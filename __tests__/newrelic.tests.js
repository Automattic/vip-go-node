const newrelic = require( '../src/newrelic/' );

describe( 'Should fail if some environment variables are not present', () => {
	const OLD_ENV_VARS = process.env;

	// eslint-disable-next-line no-undef
	afterEach( () => {
		process.env = OLD_ENV_VARS;
	} );

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

describe( 'Should return expected values when all configuration is present', () => {
	test( 'Should return newrelic module', () => {
		process.env.NEW_RELIC_NO_CONFIG_FILE = true;
		process.env.NEW_RELIC_LICENSE_KEY = 'ABC';
		const returnedValue = newrelic();

		expect( returnedValue.value ).toEqual( 'newrelic' );
	} );
} );
