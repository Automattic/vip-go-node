import assert, { deepEqual, equal, match, ok } from 'node:assert/strict';
import { connect } from 'node:net';
import { after, describe, it } from 'node:test';

import redis from '../../src/redis';
import { TestTransport } from '../testtransport';

import type { Redis } from 'ioredis';

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

	after( async () => {
		if ( client ) {
			await client.quit();
		}
	} );

	await itLive( 'should create a client from REDIS_MASTER and connect', async () => {
		process.env[ 'REDIS_MASTER' ] = `${ REDIS_HOST }:${ REDIS_PORT }`;
		delete process.env[ 'REDIS_PASSWORD' ];

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
} );
