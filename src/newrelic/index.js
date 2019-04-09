module.exports = ( { logger = console } = {} ) => {
	const licenseKey = process.env.NEW_RELIC_LICENSE_KEY;
	const noConfig = process.env.NEW_RELIC_NO_CONFIG_FILE === 'true';

	const isLocal = ! process.env.VIP_GO_APP_ID;

	if ( isLocal ) {
		logger.log( 'Local development, skipping Newrelic initialization...' );
		return;
	}

	if ( ! noConfig ) {
		throw new Error( `An environment variable is missing 
			or not set to true: NEW_RELIC_NO_CONFIG_FILE` );
	}

	if ( ! licenseKey ) {
		throw new Error( 'An environment variable is missing: NEW_RELIC_LICENSE_KEY' );
	}

	logger.info( 'Importing New Relic library...' );

	let newrelic;
	try {
		newrelic = require( 'newrelic' );
	} catch ( err ) {
		throw new Error( `The 'newrelic' package could not be imported.
			Please make sure the package is installed and available.
			Details: ${ err.message }` );
	}
	return newrelic;
};
