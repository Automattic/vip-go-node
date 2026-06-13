import assert, { deepEqual, equal, match, ok } from 'node:assert/strict';
import { after, afterEach, describe, it, Mock, mock } from 'node:test';

import redis from '../../src/redis';
import { TestTransport } from '../testtransport';

import type { RedisOptions } from '../../src/redis/types';

void describe( 'src/redis', async () => {
	const OLD_ENV_VARS = { ...process.env };

	afterEach( () => {
		process.env = { ...OLD_ENV_VARS };
		process.env[ 'VIP_GO_APP_ID' ] = '123'; // Adding an ID to mimic VIP Go
	} );

	await describe( 'getConnectionInfo()', async () => {
		await it( 'should expose getConnectionInfo on the exported redis helper', () => {
			equal( typeof redis.getConnectionInfo, 'function' );
		} );

		await it( 'should return empty info if REDIS_MASTER is invalid', () => {
			for ( const hostAndPort of [
				'', // empty
				'abcdefg', // no colon
				':123', // empty host
				'host:', // empty port
				'host:abcd', // invalid port
				'host$name:123', // invalid host
			] ) {
				process.env[ 'REDIS_MASTER' ] = hostAndPort;

				const info = redis.getConnectionInfo();

				deepEqual( info, { host: null, port: null, password: null } );
			}
		} );

		await it( 'should return valid info if REDIS_MASTER is valid', () => {
			for ( const [ hostAndPort, expectedInfo ] of [
				[ 'host:123', { host: 'host', port: '123', password: null } ],
				[ '123:123', { host: '123', port: '123', password: null } ],
				[ '127.0.0.1:3379', { host: '127.0.0.1', port: '3379', password: null } ],
				[ 'HOST_name.go-vip.co:123', { host: 'HOST_name.go-vip.co', port: '123', password: null } ],
			] as const ) {
				process.env[ 'REDIS_MASTER' ] = hostAndPort;

				const info = redis.getConnectionInfo();

				deepEqual( info, expectedInfo );
			}
		} );

		await it( 'should return valid password when REDIS_PASSWORD is set', () => {
			process.env[ 'REDIS_MASTER' ] = 'host:123';
			process.env[ 'REDIS_PASSWORD' ] = 'secret';

			const info = redis.getConnectionInfo();

			deepEqual( info, { host: 'host', port: '123', password: 'secret' } );
		} );
	} );

	await describe( 'environment variable REDIS_MASTER is missing or malformed', async () => {
		await it( 'should log an error if REDIS_MASTER environment variable is missing', () => {
			process.env[ 'REDIS_MASTER' ] = '';
			const transport = new TestTransport();
			redis( { logger: transport } );

			const firstError = transport.errors[ 0 ];
			assert( typeof firstError === 'string', 'Expected redis to log an error' );
			match( firstError, /Couldn't get the host and port from the REDIS_MASTER/ );
		} );

		await it( 'should log an error if REDIS_MASTER environment variable has incorrect format', () => {
			process.env[ 'REDIS_MASTER' ] = 'abcdef'; // Expected is 123.123.123.123:4567
			const transport = new TestTransport();
			redis( { logger: transport } );

			const firstError = transport.errors[ 0 ];
			assert( typeof firstError === 'string', 'Expected redis to log an error' );
			match( firstError, /Couldn't get the host and port from the REDIS_MASTER/ );
		} );
	} );

	await describe( 'environment variable REDIS_MASTER is present', async () => {
		const mockedCtor: Mock< ( args: RedisOptions ) => void > = mock.fn();

		class MockRedis {
			public options: RedisOptions;
			public handlers = new Map< string, ( ...args: unknown[] ) => void >();

			public constructor( options: RedisOptions ) {
				mockedCtor( options );
				this.options = options;
				instances.push( this );
			}

			public on( event: string, listener: ( ...args: unknown[] ) => void ): void {
				this.handlers.set( event, listener );
			}
		}

		const instances: MockRedis[] = [];

		const mod = mock.module( 'ioredis', {
			namedExports: {
				Redis: MockRedis,
			},
		} );

		after( () => {
			mod.restore();
			mockedCtor.mock.restore();
		} );

		// The redis module caches its client in a module-level singleton, so creating
		// a new client requires a fresh copy of the module from the require registry.
		const loadFreshRedisModule = (): typeof redis => {
			Reflect.deleteProperty( require.cache, require.resolve( '../../src/redis' ) );
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			return require( '../../src/redis' ) as typeof redis;
		};

		const createClient = ( transport: TestTransport ): MockRedis => {
			process.env[ 'REDIS_MASTER' ] = 'neverneverland:9876';

			const freshRedis = loadFreshRedisModule();
			freshRedis( { logger: transport } );

			const instance = instances[ instances.length - 1 ];
			ok( instance, 'Expected a redis client instance to be created' );
			return instance;
		};

		await it( 'should connect successfully and return the redis client back', () => {
			process.env[ 'REDIS_MASTER' ] = 'neverneverland:9876';
			process.env[ 'REDIS_PASSWORD' ] = 'secret123';

			redis();
			equal( mockedCtor.mock.calls.length, 1 );
			const options = mockedCtor.mock.calls[ 0 ]?.arguments[ 0 ];
			ok( options, 'Expected ioredis to be initialized' );
			equal( options.enableOfflineQueue, true );
			equal( options.host, 'neverneverland' );
			equal( options.maxRetriesPerRequest, 3 );
			equal( options.password, 'secret123' );
			equal( options.port, 9876 );
			equal( typeof options.retryStrategy, 'function' );
		} );

		await describe( 'QUEUED_CONNECTION_ATTEMPTS parsing', async () => {
			await it( 'should fall back to the default of 3 for missing or invalid values', () => {
				for ( const rawValue of [
					undefined, // unset
					'', // empty
					'0', // not strictly positive
					'-5', // negative
					'2.5', // not an integer
					'abc', // not a number
				] ) {
					if ( rawValue === undefined ) {
						delete process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ];
					} else {
						process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ] = rawValue;
					}

					const instance = createClient( new TestTransport() );

					equal(
						instance.options.maxRetriesPerRequest,
						3,
						`Expected default for ${ JSON.stringify( rawValue ) }`
					);
				}
			} );

			await it( 'should use a strictly positive integer value', () => {
				process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ] = '5';

				const instance = createClient( new TestTransport() );

				equal( instance.options.maxRetriesPerRequest, 5 );
			} );
		} );

		await describe( 'retryStrategy()', async () => {
			await it( 'should back off linearly and cap the delay at 2000ms', () => {
				// A high max keeps the queue-disabling branch out of this test.
				process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ] = '1000';

				const instance = createClient( new TestTransport() );
				const { retryStrategy } = instance.options;
				ok( retryStrategy, 'Expected a retryStrategy to be configured' );

				equal( retryStrategy( 1 ), 50 );
				equal( retryStrategy( 10 ), 500 );
				equal( retryStrategy( 100 ), 2000 );
			} );

			await it( 'should not disable the offline queue or log an error below the max', () => {
				const transport = new TestTransport();
				const instance = createClient( transport );
				const { retryStrategy } = instance.options;
				ok( retryStrategy, 'Expected a retryStrategy to be configured' );

				retryStrategy( 1 );
				retryStrategy( 2 );

				equal( instance.options.enableOfflineQueue, true );
				equal( transport.errors.length, 0 );
			} );

			await it( 'should disable the offline queue and log a single error at the max', () => {
				const transport = new TestTransport();
				const instance = createClient( transport );
				const { retryStrategy } = instance.options;
				ok( retryStrategy, 'Expected a retryStrategy to be configured' );

				retryStrategy( 3 );

				equal( instance.options.enableOfflineQueue, false );
				equal( transport.errors.length, 1 );
				const firstError = transport.errors[ 0 ];
				assert( typeof firstError === 'string', 'Expected redis to log an error' );
				match( firstError, /Max connection retries reached \(max: 3\)/ );
			} );

			await it( 'should not log additional errors once the queue is already disabled', () => {
				const transport = new TestTransport();
				const instance = createClient( transport );
				const { retryStrategy } = instance.options;
				ok( retryStrategy, 'Expected a retryStrategy to be configured' );

				retryStrategy( 3 );
				retryStrategy( 4 );
				retryStrategy( 5 );

				equal( instance.options.enableOfflineQueue, false );
				equal( transport.errors.length, 1 );
			} );
		} );

		await describe( 'event handlers', async () => {
			await it( 'should re-enable the offline queue on ready', () => {
				const transport = new TestTransport();
				const instance = createClient( transport );
				const { retryStrategy } = instance.options;
				ok( retryStrategy, 'Expected a retryStrategy to be configured' );

				retryStrategy( 3 );
				equal( instance.options.enableOfflineQueue, false );

				const readyHandler = instance.handlers.get( 'ready' );
				ok( readyHandler, 'Expected a ready handler to be registered' );
				readyHandler();

				equal( instance.options.enableOfflineQueue, true );
			} );

			await it( 'should register the expected connection lifecycle handlers', () => {
				const instance = createClient( new TestTransport() );

				for ( const event of [ 'connect', 'ready', 'reconnecting', 'error', 'close', 'end' ] ) {
					ok( instance.handlers.has( event ), `Expected a handler for '${ event }'` );
				}

				equal( instance.handlers.has( 'disconnect' ), false );
			} );
		} );
	} );
} );
