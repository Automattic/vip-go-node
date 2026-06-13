import assert, { equal, match } from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import goLogger from '../../src/logger';
import { TestTransport } from '../testtransport';

import type { TransformableInfo } from 'logform';

const symbolForMessage = Symbol.for( 'message' );

void describe( 'src/logger', async () => {
	await describe( 'logger should format messages and log to the provided transport', async () => {
		await it( 'should log a simple error message', () => {
			const transport = new TestTransport< TransformableInfo >();
			const log = goLogger( 'go:application:test', { transport } );

			log.info( 'A simple log' );

			const firstLog = transport.logs[ 0 ];

			assert( typeof firstLog === 'object', 'Expected log to be an object' );
			equal( firstLog?.message, 'A simple log' );
		} );

		await it( 'should format an error message', () => {
			const transport = new TestTransport< TransformableInfo >();
			const log = goLogger( 'go:application:test', { transport } );

			log.debug( 'Should format %s message', 'this' );

			const firstLog = transport.logs[ 0 ];

			assert( typeof firstLog === 'object', 'Expected log to be an object' );
			equal( firstLog?.message, 'Should format this message' );
		} );

		await describe( 'local logging', async () => {
			await it( 'should format output correctly', () => {
				const transport = new TestTransport< TransformableInfo >();
				const log = goLogger( 'go:app', { transport } );

				log.info( 'my message' );

				const firstLog = transport.logs[ 0 ];

				// eslint-disable-next-line security/detect-object-injection
				const message = firstLog?.[ symbolForMessage ];

				assert( typeof message === 'string', 'Expected log message to be a string' );
				match(
					message,
					/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT go:app \[info\] my message$/
				);
			} );
		} );

		await describe( 'production logging', async () => {
			const ORIGINAL_VIP_GO_APP_ID = process.env[ 'VIP_GO_APP_ID' ];

			beforeEach( () => ( process.env[ 'VIP_GO_APP_ID' ] = 'true' ) );
			afterEach( () => ( process.env[ 'VIP_GO_APP_ID' ] = ORIGINAL_VIP_GO_APP_ID ) );

			await it( 'should format output correctly', () => {
				const transport = new TestTransport< TransformableInfo >();
				const log = goLogger( 'go:app', { transport } );

				log.info( 'my message' );

				const firstLog = transport.logs[ 0 ];

				// eslint-disable-next-line security/detect-object-injection
				const message = firstLog?.[ symbolForMessage ];

				assert( typeof message === 'string', 'Expected log message to be a string' );
				match(
					message,
					/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT go:app {"message":"my message","level":"info","app":"go","app_type":"app","message_type":"info","app_process":"master","app_worker":"master"}$/
				);
			} );
		} );
	} );

	await describe( 'logger should add necessary labels and handle custom ones', async () => {
		await it( 'should add custom labels to the output', () => {
			const transport = new TestTransport< TransformableInfo >();
			const log = goLogger( 'go:application:test', { transport } );

			log.error( 'Should add my custom label', { customLabel: 'custom value' } );

			const firstLog = transport.logs[ 0 ];

			equal( typeof firstLog, 'object' );
			equal( firstLog?.[ 'customLabel' ], 'custom value' );
		} );

		await it( 'should format and add new labels to the output', () => {
			const transport = new TestTransport< TransformableInfo >();
			const log = goLogger( 'go:application:test', { transport } );

			log.error( 'Should format %s, and add my custom label', 'this', {
				customLabel: 'custom value',
			} );

			const firstLog = transport.logs[ 0 ];
			const expectedMessage = 'Should format this, and add my custom label';

			equal( typeof firstLog, 'object' );
			equal( firstLog?.message, expectedMessage );
			equal( firstLog?.[ 'customLabel' ], 'custom value' );
		} );

		await it( 'should include all necessary labels', () => {
			const transport = new TestTransport< TransformableInfo >();
			const log = goLogger( 'go:application:test', { transport } );

			log.error( 'Should have some necessary labels' );

			const firstLog = transport.logs[ 0 ];

			equal( typeof firstLog, 'object' );
			equal( firstLog?.message, 'Should have some necessary labels' );
			equal( firstLog?.[ 'app' ], 'go' );
			equal( firstLog?.[ 'app_type' ], 'application:test' );
			equal( firstLog?.[ 'message_type' ], 'error' );
			equal( firstLog?.[ 'app_process' ], 'master' );
			equal( firstLog?.[ 'app_worker' ], 'master' );
		} );
	} );

	await describe( 'logger should work in a cluster environments', async () => {
		await it( 'should add worker info', () => {
			const mockedCluster = {
				isWorker: true,
				worker: {
					id: 1234,
				},
			};

			const transport = new TestTransport< TransformableInfo >();
			const log = goLogger( 'go:application:test', { transport, cluster: mockedCluster } );

			log.info( 'Logging from worker' );

			const firstLog = transport.logs[ 0 ];

			equal( typeof firstLog, 'object' );
			equal( firstLog?.[ 'app_worker' ], 'worker_1234' );
		} );
	} );

	await describe( 'logger should not log if silent flag is true', async () => {
		await it( 'should add worker info', () => {
			const transport = new TestTransport< TransformableInfo >();
			const log = goLogger( 'go:application:test', { transport, silent: true } );

			log.error( 'This should not be logged!' );

			equal( transport.logs.length, 0 );
		} );
	} );
} );
