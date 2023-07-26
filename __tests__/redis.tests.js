const redis = require( '../src/redis/' );
const IORedis = require( 'ioredis' );
const Transport = require( 'winston-transport' );

jest.mock( 'ioredis' );

class TestTransport extends Transport {
	constructor( opts ) {
		super( opts );
		this.logs = [];
		this.errors = [];
	}

	info( info ) {
		this.logs.push( info );
	}

	error( info ) {
		this.errors.push( info );
	}
}

describe( 'src/redis', () => {
	const OLD_ENV_VARS = process.env;

	afterEach( () => {
		process.env = OLD_ENV_VARS;
		process.env.VIP_GO_APP_ID = 123; // Adding an ID to mimick VIP Go
	} );

	describe( 'getConnectionInfo()', () => {
		it.each( [
			'', // empty
			'abcdefg', // no colon
			':123', // empty host
			'host:', // empty port
			'host:abcd', // invalid port
			'host$name:123', // invalid host
		] )( 'should return empty info if REDIS_MASTER is invalid', hostAndPort => {
			process.env.REDIS_MASTER = hostAndPort;

			const info = redis.getConnectionInfo();

			expect( info ).toEqual( { host: null, port: null, password: null } );
		} );

		it.each( [
			[ 'host:123', { host: 'host', port: '123', password: null } ],
			[ '123:123', { host: '123', port: '123', password: null } ],
			[ '127.0.0.1:3379', { host: '127.0.0.1', port: '3379', password: null } ],
			[ 'HOST_name.go-vip.co:123', { host: 'HOST_name.go-vip.co', port: '123', password: null } ],
		] )( 'should return valid info if REDIS_MASTER is valid', ( hostAndPort, expectedInfo ) => {
			process.env.REDIS_MASTER = hostAndPort;

			const info = redis.getConnectionInfo();

			expect( info ).toEqual( expectedInfo );
		} );

		it( 'should return valid password when REDIS_PASSWORD is set', () => {
			process.env.REDIS_MASTER = 'host:123';
			process.env.REDIS_PASSWORD = 'secret';

			const info = redis.getConnectionInfo();

			expect( info ).toEqual( { host: 'host', port: '123', password: 'secret' } );
		} );
	} );

	describe( 'environment variable REDIS_MASTER is missing or malformed', () => {
		it( 'should log an error if REDIS_MASTER environment variable is missing', () => {
			process.env.REDIS_MASTER = '';
			const transport = new TestTransport();
			redis( { logger: transport } );

			expect( transport.errors[ 0 ] ).toMatch(
				"Couldn't get the host and port from the REDIS_MASTER"
			);
		} );

		it( 'should log an error if REDIS_MASTER environment variable has incorrect format', () => {
			process.env.REDIS_MASTER = 'abcdef'; // Expected is 123.123.123.123:4567
			const transport = new TestTransport();
			redis( { logger: transport } );

			expect( transport.errors[ 0 ] ).toMatch(
				"Couldn't get the host and port from the REDIS_MASTER"
			);
		} );
	} );

	describe( 'environment variable REDIS_MASTER is present', () => {
		it( 'should connect succesfully and return the redis client back', async () => {
			process.env.REDIS_MASTER = 'neverneverland:9876';
			process.env.REDIS_PASSWORD = 'secret123';
			redis();

			expect( IORedis ).toHaveBeenCalledWith( {
				enableOfflineQueue: true,
				host: 'neverneverland',
				maxRetriesPerRequest: 3,
				password: 'secret123',
				port: '9876',
				retryStrategy: expect.any( Function ),
			} );
		} );
	} );
} );
