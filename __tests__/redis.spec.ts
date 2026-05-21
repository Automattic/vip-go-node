import assert, { deepEqual, equal, match, ok } from 'node:assert/strict';
import { after, afterEach, describe, it, Mock, mock } from 'node:test';

import { TestTransport } from './testtransport';
import redis from '../src/redis';

import type { RedisOptions } from '../src/redis/types';

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

		const mod = mock.module( 'ioredis', {
			defaultExport: class {
				public constructor( options: RedisOptions ) {
					mockedCtor( options );
				}
				public on(): void {}
			},
		} );

		after( () => {
			mod.restore();
			mockedCtor.mock.restore();
		} );

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
			equal( options.port, '9876' );
			equal( typeof options.retryStrategy, 'function' );
		} );
	} );
} );
