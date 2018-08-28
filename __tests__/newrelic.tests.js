const newrelic = require( '../src/newrelic/' );

test( 'New Relic module should fail if no license key is given', () => {
	// eslint-disable-next-line no-undef
	const spyOnError = jest.spyOn( console, 'error' );

	newrelic();

	expect( spyOnError ).toHaveBeenCalled();

	spyOnError.mockRestore();
} );
