const goLogger = require( '../src/logger/' );
const Transport = require( 'winston-transport' );
const symbolForMessage = Symbol.for( 'message' );

class TestTransport extends Transport {
	constructor( opts ) {
		super( opts );
		this.logs = [];
	}

	log( info, callback ) {
		this.logs.push( info );

		callback();
	}
}

describe( 'Logger should fail if some parameters are not initialized', () => {
	test( 'Should fail if not initialized with a namespace', () => {
		expect( () => {
			goLogger.debug( 'This should fail as namespace is not provided' );
		} ).toThrow();
	} );
} );

describe( 'Logger should format messages and log to the provided transport', () => {
	test( 'Should log a simple error message', () => {
		const transport = new TestTransport();
		const log = goLogger( 'go:application:test', { transport } );

		log.info( 'A simple log' );

		const firstLog = transport.logs[0];

		expect( firstLog ).toHaveProperty( 'message', 'A simple log' );
	} );

	test( 'Should format an error message', () => {
		const transport = new TestTransport();
		const log = goLogger( 'go:application:test', { transport } );

		log.info( 'Should format %s message', 'this' );

		const firstLog = transport.logs[0];

		expect( firstLog ).toHaveProperty( 'message', 'Should format this message' );
	} );
} );

describe( 'Logger should add necessary labels and handle custom ones', () => {
	test( 'Should add custom labels to the output', () => {
		const transport = new TestTransport();
		const log = goLogger( 'go:application:test', { transport } );

		log.error( 'Should add my custom label', { customLabel: 'custom value' } );

		const firstLog = transport.logs[0];

		expect( firstLog ).toHaveProperty( 'customLabel', 'custom value' );
	} );

	test( 'Should format and add new labels to the output', () => {
		const transport = new TestTransport();
		const log = goLogger( 'go:application:test', { transport } );

		log.error( 'Should format %s, and add my custom label', 'this',
			{ customLabel: 'custom value' }
		);

		const firstLog = transport.logs[0];

		expect( firstLog ).toHaveProperty( 'message', 'Should format this, and add my custom label' );
		expect( firstLog ).toHaveProperty( 'customLabel', 'custom value' );
	} );

	test( 'Should include all necessary labels', () => {
		const transport = new TestTransport();
		const log = goLogger( 'go:application:test', { transport } );

		log.error( 'Should have some necessary labels' );

		const firstLog = transport.logs[0];

		expect( firstLog ).toHaveProperty( 'message', 'Should have some necessary labels' );
		expect( firstLog ).toHaveProperty( 'app', 'go' );
		expect( firstLog ).toHaveProperty( 'app_type', 'application:test' );
		expect( firstLog ).toHaveProperty( 'message_type', 'error' );
		expect( firstLog ).toHaveProperty( 'app_process', 'master' );
	} );
} );
