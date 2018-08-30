const goLogger = require( '../src/logger/' );
const winston = require( 'winston' );
const symbolForMessage = Symbol.for( 'message' );

describe( 'Logger should fail if some parameters are not initialized', () => {
	test( 'Should fail if not initialized with a namespace', () => {
		expect( () => {
			goLogger.debug( 'This should fail as namespace is not provided' );
		} ).toThrow();
	} );
} );

describe( 'Logger should format messages and log to the provided transport', () => {
	test( 'Should log a simple error message', ( done ) => {
		const transport = new winston.transports.Console();
		const log = goLogger( 'go:application:test', { transport } );

		log.info( 'A simple log' );

		transport.on( 'logged', function( logObject ) {
			const isIncluded = logObject[ symbolForMessage ].includes( 'A simple log' );

			expect( isIncluded ).toBe( true );
			done();
		} );
	} );

	test( 'Should format an error message', ( done ) => {
		const transport = new winston.transports.Console();
		const log = goLogger( 'go:application:test', { transport } );

		log.info( 'Should format %s message', 'this' );

		transport.on( 'logged', function( logObject ) {
			const isIncluded = logObject[ symbolForMessage ]
				.includes( 'Should format this message' );

			expect( isIncluded ).toBe( true );
			done();
		} );
	} );
} );

describe( 'Logger should add necessary labels and handle custom ones', () => {
	test( 'Should add custom labels to the output', ( done ) => {
		const transport = new winston.transports.Console();
		const log = goLogger( 'go:application:test', { transport } );

		log.error( 'Should add my custom label', { customLabel: 'custom value' } );

		transport.on( 'logged', function( logObject ) {
			expect( logObject ).toHaveProperty( 'customLabel', 'custom value' );
			done();
		} );
	} );

	test( 'Should format and add new labels to the output', ( done ) => {
		const transport = new winston.transports.Console();
		const log = goLogger( 'go:application:test', { transport } );

		log.error( 'Should format %s, and add my custom label', 'this',
			{ customLabel: 'custom value' }
		);

		transport.on( 'logged', function( logObject ) {
			const isIncluded = logObject[ symbolForMessage ].includes( 'Should format this' );

			expect( isIncluded ).toBe( true );
			expect( logObject ).toHaveProperty( 'customLabel', 'custom value' );
			done();
		} );
	} );

	test( 'Should include all necessary labels', ( done ) => {
		const transport = new winston.transports.Console();
		const log = goLogger( 'go:application:test', { transport } );

		log.error( 'Should have some necessary labels' );

		transport.on( 'logged', function( logObject ) {
			expect( logObject ).toHaveProperty( 'app', 'go' );
			expect( logObject ).toHaveProperty( 'app_type', 'application:test' );
			expect( logObject ).toHaveProperty( 'message_type', 'error' );
			expect( logObject ).toHaveProperty( 'app_process', 'master' );
			expect( logObject ).toHaveProperty( 'message', 'Should have some necessary labels' );
			done();
		} );
	} );
} );
