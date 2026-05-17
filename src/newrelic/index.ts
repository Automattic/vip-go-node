import type { NewRelicOptions } from './types';

const getErrorMessage = ( error: unknown ): string => {
	if ( error instanceof Error ) {
		return error.message;
	}

	return String( error );
};

function initializeNewRelic( { logger = console }: NewRelicOptions = {} ): unknown {
	const licenseKey = process.env[ 'NEW_RELIC_LICENSE_KEY' ];
	const noConfig = process.env[ 'NEW_RELIC_NO_CONFIG_FILE' ] === 'true';

	const isLocal = ! process.env[ 'VIP_GO_APP_ID' ];

	if ( isLocal ) {
		logger.log( 'Local development, skipping New Relic initialization...' );
		return;
	}

	if ( ! noConfig ) {
		logger.error( `An environment variable is missing 
			or not set to true: NEW_RELIC_NO_CONFIG_FILE. Skipping New Relic initialization...` );
		return;
	}

	if ( ! licenseKey ) {
		logger.error( `An environment variable is missing: 
			NEW_RELIC_LICENSE_KEY. Skipping New Relic initialization...` );
		return;
	}

	logger.info( 'Importing New Relic library...' );

	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require( 'newrelic' );
	} catch ( error ) {
		throw new Error( `The 'newrelic' package could not be imported.
			Please make sure the package is installed and available.
			Details: ${ getErrorMessage( error ) }` );
	}
}

export = initializeNewRelic;
