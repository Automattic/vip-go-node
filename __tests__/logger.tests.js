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

describe( 'src/logger', () => {
	describe( 'Logger should fail if some parameters are not initialized', () => {
		it( 'Should fail if not initialized with a namespace', () => {
			expect( () => {
				goLogger.debug( 'This should fail as namespace is not provided' );
			} ).toThrow();
		} );
	} );

	describe( 'Logger should format messages and log to the provided transport', () => {
		it( 'Should log a simple error message', () => {
			const transport = new TestTransport();
			const log = goLogger( 'go:application:test', { transport } );

			log.info( 'A simple log' );

			const firstLog = transport.logs[ 0 ];

			expect( firstLog ).toHaveProperty( 'message', 'A simple log' );
		} );

		it( 'Should format an error message', () => {
			const transport = new TestTransport();
			const log = goLogger( 'go:application:test', { transport } );

			log.debug( 'Should format %s message', 'this' );

			const firstLog = transport.logs[ 0 ];

			expect( firstLog ).toHaveProperty( 'message', 'Should format this message' );
		} );

		describe( 'local logging', () => {
			it( 'should format output correctly', () => {
				const transport = new TestTransport();
				const log = goLogger( 'go:app', { transport } );

				log.info( 'my message' );

				const firstLog = transport.logs[ 0 ];

				const message = firstLog[ symbolForMessage ];
				// eslint-disable-next-line max-len
				expect( message ).toEqual( expect.stringMatching( /^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT go:app \[info\] my message$/ ) );
			} );
		} );

		describe( 'production logging', () => {
			const ORIGINAL_VIP_GO_APP_ID = process.env.VIP_GO_APP_ID;

			beforeEach( () => process.env.VIP_GO_APP_ID = true );
			afterEach( () => process.env.VIP_GO_APP_ID = ORIGINAL_VIP_GO_APP_ID );

			it( 'should format output correctly', () => {
				const transport = new TestTransport();
				const log = goLogger( 'go:app', { transport } );

				log.info( 'my message' );

				const firstLog = transport.logs[ 0 ];

				const message = firstLog[ symbolForMessage ];
				// eslint-disable-next-line max-len
				expect( message ).toEqual( expect.stringMatching( /^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT go:app {"message":"my message","level":"info","app":"go","app_type":"app","message_type":"info","app_process":"master","app_worker":"master"}$/ ) );
			} );
		} );
	} );

	describe( 'Logger should add necessary labels and handle custom ones', () => {
		it( 'Should add custom labels to the output', () => {
			const transport = new TestTransport();
			const log = goLogger( 'go:application:test', { transport } );

			log.error( 'Should add my custom label', { customLabel: 'custom value' } );

			const firstLog = transport.logs[ 0 ];

			expect( firstLog ).toHaveProperty( 'customLabel', 'custom value' );
		} );

		it( 'Should format and add new labels to the output', () => {
			const transport = new TestTransport();
			const log = goLogger( 'go:application:test', { transport } );

			log.error( 'Should format %s, and add my custom label', 'this',
				{ customLabel: 'custom value' }
			);

			const firstLog = transport.logs[ 0 ];
			const expectedMessage = 'Should format this, and add my custom label';

			expect( firstLog ).toHaveProperty( 'message', expectedMessage );
			expect( firstLog ).toHaveProperty( 'customLabel', 'custom value' );
		} );

		it( 'Should include all necessary labels', () => {
			const transport = new TestTransport();
			const log = goLogger( 'go:application:test', { transport } );

			log.error( 'Should have some necessary labels' );

			const firstLog = transport.logs[ 0 ];

			expect( firstLog ).toHaveProperty( 'message', 'Should have some necessary labels' );
			expect( firstLog ).toHaveProperty( 'app', 'go' );
			expect( firstLog ).toHaveProperty( 'app_type', 'application:test' );
			expect( firstLog ).toHaveProperty( 'message_type', 'error' );
			expect( firstLog ).toHaveProperty( 'app_process', 'master' );
			expect( firstLog ).toHaveProperty( 'app_worker', 'master' );
		} );
	} );

	describe( 'Logger should work in a cluster environments', () => {
		it( 'Should add worker info', () => {
			const mockedCluster = {
				isWorker: true,
				worker: {
					id: 1234,
				},
			};

			const transport = new TestTransport();
			const log = goLogger( 'go:application:test', { transport, cluster: mockedCluster } );

			log.info( 'Logging from worker' );

			const firstLog = transport.logs[ 0 ];

			expect( firstLog ).toHaveProperty( 'app_worker', 'worker_1234' );
		} );
	} );
} );
