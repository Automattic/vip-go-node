import assert, { equal, match, throws } from 'node:assert/strict';
import { ModuleHooks, registerHooks } from 'node:module';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { TestTransport } from './testtransport';
import newrelic from '../src/newrelic';

function mockNewRelic(): ModuleHooks {
	return registerHooks( {
		resolve( specifier, context, nextResolve ) {
			return specifier === 'newrelic'
				? {
						url: 'newrelic',
						shortCircuit: true,
						format: 'commonjs',
				  }
				: nextResolve( specifier, context );
		},
		load( url, context, nextLoad ) {
			return url === 'newrelic'
				? {
						format: 'commonjs',
						source: `module.exports = { value: 'newrelic' };`,
						shortCircuit: true,
				  }
				: nextLoad( url, context );
		},
	} );
}

void describe( 'src/newrelic', async () => {
	const OLD_ENV_VARS = { ...process.env };
	let hooks: ModuleHooks | undefined;

	beforeEach( () => {
		hooks = mockNewRelic();
	} );
	afterEach( () => {
		hooks?.deregister();
	} );

	afterEach( () => {
		process.env = { ...OLD_ENV_VARS };
		process.env[ 'VIP_GO_APP_ID' ] = '123'; // Adding an ID to mimic VIP Go
	} );

	await describe( 'environment variables are missing', async () => {
		await it( 'should skip if local development environment', () => {
			process.env[ 'VIP_GO_APP_ID' ] = '';
			const transport = new TestTransport();
			newrelic( { logger: transport } );

			const firstLog = transport.logs[ 0 ];
			assert( typeof firstLog === 'string', 'Expected New Relic to log a message' );
			match( firstLog, /skipping New Relic/ );
		} );

		await it( 'should fail if NEW_RELIC_NO_CONFIG_FILE is not set', () => {
			const transport = new TestTransport();
			newrelic( { logger: transport } );

			const firstError = transport.errors[ 0 ];
			assert( typeof firstError === 'string', 'Expected New Relic to log an error' );
			match( firstError, /NEW_RELIC_NO_CONFIG_FILE/ );
		} );

		await it( 'should fail if NEW_RELIC_NO_CONFIG_FILE is set to false', () => {
			process.env[ 'NEW_RELIC_NO_CONFIG_FILE' ] = 'false';
			const transport = new TestTransport();
			newrelic( { logger: transport } );

			const firstError = transport.errors[ 0 ];
			assert( typeof firstError === 'string', 'Expected New Relic to log an error' );
			match( firstError, /NEW_RELIC_NO_CONFIG_FILE/ );
		} );

		await it( 'should fail if NEW_RELIC_LICENSE_KEY is not set', () => {
			process.env[ 'NEW_RELIC_NO_CONFIG_FILE' ] = 'true';
			const transport = new TestTransport();
			newrelic( { logger: transport } );

			const firstError = transport.errors[ 0 ];
			assert( typeof firstError === 'string', 'Expected New Relic to log an error' );
			match( firstError, /NEW_RELIC_LICENSE_KEY/ );
		} );
	} );

	await describe( 'environment variables are present', async () => {
		await it( 'should fail if `newrelic` module errors out', () => {
			hooks?.deregister();
			hooks = undefined;

			process.env[ 'NEW_RELIC_NO_CONFIG_FILE' ] = 'true';
			process.env[ 'NEW_RELIC_LICENSE_KEY' ] = 'ABC';
			throws( () => {
				newrelic();
			}, /could not be imported/ );
		} );

		await it( 'should return newrelic module when config is correctly set', () => {
			process.env[ 'NEW_RELIC_NO_CONFIG_FILE' ] = 'true';
			process.env[ 'NEW_RELIC_LICENSE_KEY' ] = 'ABC';

			const returnedValue = newrelic() as { value: string };
			equal( returnedValue.value, 'newrelic' );
		} );
	} );
} );
