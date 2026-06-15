import assert, { deepEqual, equal, match, ok } from 'node:assert/strict';
import { connect, createServer } from 'node:net';
import { after, afterEach, describe, it } from 'node:test';

import redis from '../../src/redis';
import { TestTransport } from '../testtransport';

import type { Redis } from 'ioredis';
import type { AddressInfo, Server, Socket } from 'node:net';

const REDIS_HOST = process.env[ 'REDIS_INTEGRATION_HOST' ] || '127.0.0.1';
const REDIS_PORT = process.env[ 'REDIS_INTEGRATION_PORT' ] || '6379';
const REDIS_REQUIRED = [ '1', 'true' ].includes(
	( process.env[ 'REDIS_INTEGRATION_REQUIRED' ] || '' ).toLowerCase()
);

const isRedisAvailable = (): Promise< boolean > =>
	new Promise( resolve => {
		const socket = connect( { host: REDIS_HOST, port: Number( REDIS_PORT ), timeout: 1000 } );

		socket.once( 'connect', () => {
			socket.end();
			resolve( true );
		} );
		socket.once( 'error', () => {
			socket.destroy();
			resolve( false );
		} );
		socket.once( 'timeout', () => {
			socket.destroy();
			resolve( false );
		} );
	} );

const getErrorMessage = ( error: unknown ): string =>
	error instanceof Error ? error.message : String( error );

const delay = ( ms: number ): Promise< void > =>
	new Promise( resolve => setTimeout( resolve, ms ) );

// Reject if the given promise does not settle within `ms`, using a recognizable
// message so a hang can be told apart from a genuine rejection.
const withTimeout = < T >( promise: Promise< T >, ms: number, label: string ): Promise< T > =>
	Promise.race( [
		promise,
		new Promise< never >( ( _resolve, reject ) =>
			setTimeout( () => reject( new Error( `Timed out after ${ ms }ms: ${ label }` ) ), ms )
		),
	] );

const waitFor = async (
	predicate: () => boolean,
	{ timeout = 5000, interval = 25, label = 'condition' } = {}
): Promise< void > => {
	const start = Date.now();
	while ( ! predicate() ) {
		if ( Date.now() - start > timeout ) {
			throw new Error( `Timed out after ${ timeout }ms waiting for ${ label }` );
		}
		// eslint-disable-next-line no-await-in-loop -- intentional sequential polling
		await delay( interval );
	}
};

// A controllable TCP proxy that forwards to the real Redis server. The client
// connects through it so tests can simulate an outage (`sever`) and a recovery
// (`restore`) against a live server, exercising the real reconnection path.
class RedisProxy {
	private readonly server: Server;
	private readonly sockets = new Set< Socket >();
	private severed = false;
	public port = 0;

	public constructor(
		private readonly upstreamHost: string,
		private readonly upstreamPort: number
	) {
		this.server = createServer( downstream => {
			if ( this.severed ) {
				downstream.destroy();
				return;
			}

			const upstream = connect( { host: this.upstreamHost, port: this.upstreamPort } );
			this.sockets.add( downstream );
			this.sockets.add( upstream );

			const teardown = (): void => {
				this.sockets.delete( downstream );
				this.sockets.delete( upstream );
				downstream.destroy();
				upstream.destroy();
			};

			// Swallow socket errors (e.g. ECONNRESET when severing) so they don't
			// surface as uncaught exceptions and crash the test runner.
			downstream.on( 'error', () => {} );
			upstream.on( 'error', () => {} );
			downstream.on( 'close', teardown );
			upstream.on( 'close', teardown );

			downstream.pipe( upstream );
			upstream.pipe( downstream );
		} );
	}

	public listen(): Promise< void > {
		return new Promise( ( resolve, reject ) => {
			this.server.once( 'error', reject );
			this.server.listen( 0, '127.0.0.1', () => {
				this.port = ( this.server.address() as AddressInfo ).port;
				resolve();
			} );
		} );
	}

	// Simulate an outage: drop every live connection and refuse new ones.
	public sever(): void {
		this.severed = true;
		for ( const socket of this.sockets ) {
			socket.destroy();
		}
		this.sockets.clear();
	}

	// Restore service so the client can reconnect.
	public restore(): void {
		this.severed = false;
	}

	public async close(): Promise< void > {
		this.sever();
		await new Promise< void >( resolve => this.server.close( () => resolve() ) );
	}
}

void describe( 'src/redis (integration)', async () => {
	const available = await isRedisAvailable();

	if ( ! available ) {
		if ( REDIS_REQUIRED ) {
			throw new Error(
				`Redis integration tests are required (REDIS_INTEGRATION_REQUIRED is set), but Redis is not reachable on ${ REDIS_HOST }:${ REDIS_PORT }.`
			);
		}

		// eslint-disable-next-line no-console
		console.warn(
			`Skipping Redis integration tests: Redis is not reachable on ${ REDIS_HOST }:${ REDIS_PORT }. Start it with: docker compose up -d`
		);
	}

	const itLive = available ? it : it.skip.bind( it );
	let client: Redis | undefined;

	// Configure the environment at suite level so individual tests can run in isolation
	// without depending on a previous test having mutated process.env.
	process.env[ 'REDIS_MASTER' ] = `${ REDIS_HOST }:${ REDIS_PORT }`;
	delete process.env[ 'REDIS_PASSWORD' ];

	after( async () => {
		if ( client ) {
			try {
				await client.quit();
			} catch {
				client.disconnect();
			}
		}
	} );

	await itLive( 'should create a client from REDIS_MASTER and connect', async () => {
		const transport = new TestTransport();
		client = redis( { logger: transport } );

		assert( client, 'Expected redis() to return a client' );
		ok(
			transport.logs.some(
				log => typeof log === 'string' && /Initializing a new redis client/.test( log )
			),
			'Expected the initialization debug log'
		);

		const pong = await client.ping();
		equal( pong, 'PONG' );
	} );

	await itLive( 'should return the same singleton client on subsequent calls', () => {
		const secondClient = redis();

		equal( secondClient, client );
	} );

	await itLive( 'should round-trip a value through the real server', async () => {
		assert( client, 'Expected an initialized client' );

		const key = `vip-go-integration-test:${ process.pid }:${ Date.now() }`;

		await client.set( key, 'integration-value', 'EX', 60 );
		const value = await client.get( key );
		equal( value, 'integration-value' );

		const deleted = await client.del( key );
		equal( deleted, 1 );
		equal( await client.get( key ), null );
	} );

	await itLive( 'should support expiry options on the real server', async () => {
		assert( client, 'Expected an initialized client' );

		const key = `vip-go-integration-test:expiry:${ process.pid }:${ Date.now() }`;

		await client.set( key, 'short-lived', 'PX', 500 );
		equal( await client.get( key ), 'short-lived' );

		await new Promise( resolve => setTimeout( resolve, 700 ) );
		equal( await client.get( key ), null );
	} );

	await itLive( 'should expose connection info matching the live environment', () => {
		const info = redis.getConnectionInfo();

		deepEqual( info, { host: REDIS_HOST, port: REDIS_PORT, password: null } );
	} );

	await itLive( 'should report a ready status once connected', async () => {
		assert( client, 'Expected an initialized client' );

		// ping() resolves only after the connection is established
		await client.ping();
		match( client.status, /^(connect|ready)$/ );
	} );

	await describe( 'offline queue', async () => {
		const createdClients: Redis[] = [];
		const createdProxies: RedisProxy[] = [];
		const ORIGINAL_REDIS_MASTER = process.env[ 'REDIS_MASTER' ];

		// The redis module caches its client in a module-level singleton, so each
		// test needs a fresh copy from the require registry to get its own client.
		const loadFreshRedisModule = (): typeof redis => {
			Reflect.deleteProperty( require.cache, require.resolve( '../../src/redis' ) );
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			return require( '../../src/redis' ) as typeof redis;
		};

		const startProxy = async (): Promise< RedisProxy > => {
			const proxy = new RedisProxy( REDIS_HOST, Number( REDIS_PORT ) );
			await proxy.listen();
			createdProxies.push( proxy );
			return proxy;
		};

		// Create a fresh client that connects *through* the proxy, so the test can
		// simulate outages by severing it.
		const createProxyClient = ( proxy: RedisProxy, transport: TestTransport ): Redis => {
			process.env[ 'REDIS_MASTER' ] = `127.0.0.1:${ proxy.port }`;
			delete process.env[ 'REDIS_PASSWORD' ];

			const freshRedis = loadFreshRedisModule();
			const proxyClient = freshRedis( { logger: transport } );
			ok( proxyClient, 'Expected redis() to return a client' );
			createdClients.push( proxyClient );
			return proxyClient;
		};

		// Assert a command settles by rejecting (not hanging) once issued offline.
		const assertRejectsQuickly = ( command: Promise< unknown > ): Promise< void > =>
			assert.rejects(
				withTimeout( command, 3000, 'the command hung instead of rejecting' ),
				( error: unknown ) => {
					const message = getErrorMessage( error );
					ok( ! /hung instead of rejecting/.test( message ), message );
					return true;
				}
			);

		afterEach( async () => {
			for ( const openClient of createdClients ) {
				// disconnect() halts reconnection immediately so no loop outlives the test.
				openClient.disconnect();
			}
			createdClients.length = 0;

			await Promise.all( createdProxies.map( proxy => proxy.close() ) );
			createdProxies.length = 0;
		} );

		after( () => {
			if ( ORIGINAL_REDIS_MASTER === undefined ) {
				delete process.env[ 'REDIS_MASTER' ];
			} else {
				process.env[ 'REDIS_MASTER' ] = ORIGINAL_REDIS_MASTER;
			}
			delete process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ];
		} );

		await itLive(
			'should queue commands during a transient outage and resolve them once reconnected',
			async () => {
				// A high attempt count keeps the queue from being auto-disabled during the outage.
				process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ] = '50';
				const proxy = await startProxy();
				const proxyClient = createProxyClient( proxy, new TestTransport() );

				await withTimeout( proxyClient.ping(), 5000, 'the initial connection' );

				const key = `vip-go-integration-test:offline-queue:${ process.pid }:${ Date.now() }`;
				await proxyClient.set( key, 'queued-value', 'EX', 60 );

				// Sever the connection and issue a read; with the offline queue enabled
				// the command is held until the proxyClient reconnects.
				proxy.sever();
				await waitFor( () => proxyClient.status !== 'ready', {
					label: 'the proxyClient to notice the outage',
				} );

				const pendingGet = proxyClient.get( key );

				// Bring the proxy back so the queued command can flush.
				proxy.restore();

				const value = await withTimeout( pendingGet, 8000, 'the queued GET to resolve' );
				equal( value, 'queued-value' );
			}
		);

		await itLive(
			'should automatically disable the offline queue after the max retries and reject new commands',
			async () => {
				process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ] = '2';
				const transport = new TestTransport();
				const proxy = await startProxy();
				const proxyClient = createProxyClient( proxy, transport );

				await withTimeout( proxyClient.ping(), 5000, 'the initial connection' );
				equal( proxyClient.options.enableOfflineQueue, true );

				// Take Redis down for good; after QUEUED_CONNECTION_ATTEMPTS reconnection
				// attempts the retry strategy disables the offline queue.
				proxy.sever();
				await waitFor( () => proxyClient.options.enableOfflineQueue === false, {
					timeout: 10000,
					label: 'the offline queue to be disabled',
				} );

				ok(
					transport.errors.some(
						log =>
							typeof log === 'string' && /Max connection retries reached \(max: 2\)/.test( log )
					),
					'Expected an error log when the offline queue is disabled'
				);

				// New commands are now rejected immediately instead of being queued forever.
				await assertRejectsQuickly( proxyClient.get( 'any-key' ) );
			}
		);

		await itLive(
			'should automatically re-enable the offline queue once the connection is ready again',
			async () => {
				process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ] = '2';
				const proxy = await startProxy();
				const proxyClient = createProxyClient( proxy, new TestTransport() );

				await withTimeout( proxyClient.ping(), 5000, 'the initial connection' );

				proxy.sever();
				await waitFor( () => proxyClient.options.enableOfflineQueue === false, {
					timeout: 10000,
					label: 'the offline queue to be disabled',
				} );

				// Recover: once the proxyClient reconnects and reaches the ready state, the
				// offline queue is turned back on.
				proxy.restore();
				await waitFor( () => proxyClient.options.enableOfflineQueue === true, {
					timeout: 10000,
					label: 'the offline queue to be re-enabled',
				} );

				match( proxyClient.status, /^(connect|ready)$/ );
				equal( await withTimeout( proxyClient.ping(), 5000, 'a ping after recovery' ), 'PONG' );
			}
		);

		await itLive(
			'should reject commands immediately when the offline queue is manually disabled',
			async () => {
				// Keep the attempt count high so only the manual toggle, not the retry
				// strategy, can disable the queue.
				process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ] = '50';
				const proxy = await startProxy();
				const proxyClient = createProxyClient( proxy, new TestTransport() );

				await withTimeout( proxyClient.ping(), 5000, 'the initial connection' );

				// Manually opt out of offline queueing.
				proxyClient.options.enableOfflineQueue = false;

				proxy.sever();
				await waitFor( () => proxyClient.status !== 'ready', {
					label: 'the proxyClient to notice the outage',
				} );

				await assertRejectsQuickly( proxyClient.get( 'any-key' ) );
			}
		);

		await itLive(
			'should queue commands again when the offline queue is manually re-enabled',
			async () => {
				process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ] = '50';
				const proxy = await startProxy();
				const proxyClient = createProxyClient( proxy, new TestTransport() );

				await withTimeout( proxyClient.ping(), 5000, 'the initial connection' );

				// Toggle the queue off and back on manually.
				proxyClient.options.enableOfflineQueue = false;
				proxyClient.options.enableOfflineQueue = true;
				equal( proxyClient.options.enableOfflineQueue, true );

				const key = `vip-go-integration-test:manual-queue:${ process.pid }:${ Date.now() }`;
				await proxyClient.set( key, 'manual-value', 'EX', 60 );

				proxy.sever();
				await waitFor( () => proxyClient.status !== 'ready', {
					label: 'the proxyClient to notice the outage',
				} );

				const pendingGet = proxyClient.get( key );
				proxy.restore();

				equal( await withTimeout( pendingGet, 8000, 'the queued GET to resolve' ), 'manual-value' );
			}
		);
	} );
} );
