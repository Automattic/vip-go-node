const newrelic = require( '../src/newrelic/' );

describe( 'src/newrelic', () => {
	const OLD_ENV_VARS = process.env;

	beforeEach( () => {
		jest.resetModules();

		jest.doMock( 'newrelic', () => ( {
			value: 'newrelic',
		} ) );
	} );

	afterEach( () => {
		process.env = OLD_ENV_VARS;
	} );

	describe( 'Environment variables are missing', () => {
		test( 'Should fail if NEW_RELIC_NO_CONFIG_FILE is not set', () => {
			expect( () => {
				newrelic();
			} ).toThrowError( /NEW_RELIC_NO_CONFIG_FILE/ );
		} );

		test( 'Should fail if NEW_RELIC_NO_CONFIG_FILE is set to false', () => {
			process.env.NEW_RELIC_NO_CONFIG_FILE = false;

			expect( () => {
				newrelic();
			} ).toThrowError( /NEW_RELIC_NO_CONFIG_FILE/ );
		} );

		test( 'Should fail if NEW_RELIC_LICENSE_KEY is not set', () => {
			process.env.NEW_RELIC_NO_CONFIG_FILE = true;

			expect( () => {
				newrelic();
			} ).toThrowError( /NEW_RELIC_LICENSE_KEY/ );
		} );
	} );

	describe( 'Environment variables are present', () => {
		test( 'Should fail if `newrelic` module errors out', () => {
			jest.doMock( 'newrelic', () => {
				throw new Error( 'Module does not exist.' );
			} );

			process.env.NEW_RELIC_NO_CONFIG_FILE = true;
			process.env.NEW_RELIC_LICENSE_KEY = 'ABC';

			expect( () => {
				newrelic();
			} ).toThrowError( /could not be imported/ );
		} );

		test( 'Should return newrelic module when config correct set', () => {
			process.env.NEW_RELIC_NO_CONFIG_FILE = true;
			process.env.NEW_RELIC_LICENSE_KEY = 'ABC';
			const returnedValue = newrelic();

			expect( returnedValue.value ).toEqual( 'newrelic' );
		} );
	} );
} );
