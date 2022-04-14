const newrelic = require( '../src/newrelic/' );
const Transport = require( 'winston-transport' );

class TestTransport extends Transport {
	constructor( opts ) {
		super( opts );
		this.logs = [];
		this.errors = [];
	}

	log( info ) {
		this.logs.push( info );
	}

	error( info ) {
		this.errors.push( info );
	}
}

describe( 'src/newrelic', () => {
	const OLD_ENV_VARS = process.env;

	beforeEach( () => {
		jest.resetModules();

		jest.mock( 'newrelic', () => ( {
			value: 'newrelic',
		} ) );
	} );

	afterEach( () => {
		process.env = OLD_ENV_VARS;
		process.env.VIP_GO_APP_ID = 123; // Adding an ID to mimick VIP Go
	} );

	describe( 'environment variables are missing', () => {
		it( 'should skip if local development environment', () => {
			process.env.VIP_GO_APP_ID = '';
			const transport = new TestTransport();
			newrelic( { logger: transport } );

			expect( transport.logs[ 0 ] ).toMatch( 'skipping New Relic' );
		} );

		it( 'should fail if NEW_RELIC_NO_CONFIG_FILE is not set', () => {
			const transport = new TestTransport();
			newrelic( { logger: transport } );

			expect( transport.errors[ 0 ] ).toMatch( 'NEW_RELIC_NO_CONFIG_FILE' );
		} );

		it( 'should fail if NEW_RELIC_NO_CONFIG_FILE is set to false', () => {
			process.env.NEW_RELIC_NO_CONFIG_FILE = false;
			const transport = new TestTransport();
			newrelic( { logger: transport } );

			expect( transport.errors[ 0 ] ).toMatch( 'NEW_RELIC_NO_CONFIG_FILE' );
		} );

		it( 'should fail if NEW_RELIC_LICENSE_KEY is not set', () => {
			process.env.NEW_RELIC_NO_CONFIG_FILE = true;
			const transport = new TestTransport();
			newrelic( { logger: transport } );

			expect( transport.errors[ 0 ] ).toMatch( 'NEW_RELIC_LICENSE_KEY' );
		} );
	} );

	describe( 'environment variables are present', () => {
		it( 'should fail if `newrelic` module errors out', () => {
			jest.mock( 'newrelic', () => {
				throw new Error( 'Module does not exist.' );
			} );

			process.env.NEW_RELIC_NO_CONFIG_FILE = true;
			process.env.NEW_RELIC_LICENSE_KEY = 'ABC';

			expect( () => {
				newrelic();
			} ).toThrow( /could not be imported/ );
		} );

		it( 'should return newrelic module when config is correctly set', () => {
			process.env.NEW_RELIC_NO_CONFIG_FILE = true;
			process.env.NEW_RELIC_LICENSE_KEY = 'ABC';
			const returnedValue = newrelic();

			expect( returnedValue.value ).toBe( 'newrelic' );
		} );
	} );
} );
