const redis = require( '../src/redis/' );
const Transport = require( 'winston-transport' );
const wait =require( 'waait' );

class TestTransport extends Transport {
	constructor( opts ) {
		super( opts );
		this.logs = [];
		this.errors = [];
	}

	info( info ) {
		console.log( 'received:', info );
		this.logs.push( info );
	}

	error( info ) {
		this.errors.push( info );
	}
}

const DEFAULT_REDIS_LOCAL_IP = '127.0.0.1:6379';

describe( 'src/redis', () => {
	const OLD_ENV_VARS = process.env;

	afterEach( () => {
		process.env = OLD_ENV_VARS;
		process.env.VIP_GO_APP_ID = 123; // Adding an ID to mimick VIP Go
	} );

	describe( 'Environment variable REDIS_MASTER is missing or malformed', () => {
		it( 'Should log an error if REDIS_MASTER environment variable is missing', () => {
			process.env.REDIS_MASTER = '';
			const transport = new TestTransport();
			redis( { logger: transport } );

			expect( transport.errors[ 0 ] ).toMatch( 'Missing REDIS_MASTER environment variable' );
		} );

		it( 'Should log an error if REDIS_MASTER environment variable is missing', () => {
			process.env.REDIS_MASTER = 'abcdef'; // Expected is 123.123.123.123:4567
			const transport = new TestTransport();
			redis( { logger: transport } );

			expect( transport.errors[ 0 ] ).toMatch( `Couldn't get the host and port from the REDIS_MASTER`);
		} );
	} );
