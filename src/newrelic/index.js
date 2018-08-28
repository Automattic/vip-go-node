module.exports = ( { logger = console } = {} ) => {
	const licenseKey = process.env.NEW_RELIC_LICENSE_KEY;
	const noConfig = process.env.NEW_RELIC_NO_CONFIG_FILE;
	const isProduction = () => process.env.NODE_ENV === 'production';

	if ( isProduction && noConfig && licenseKey ) {
		logger.info( 'Importing New Relic library...' );
		return require( 'newrelic' );
	}

	logger.error( 'New Relic could not be loaded, environment variables are not present' );
};
