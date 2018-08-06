const { createServer } = require( 'http' );
const healthCheckUrl = '/cache-healthcheck?';

module.exports = ( { PORT = 3000, requestHandler, express = false, logger = console } ) => {
	if ( requestHandler && express ) {
		logger.info( 'Creating an Express server...' );
		requestHandler.get( healthCheckUrl, ( req, res ) => {
			res.status( 200 ).end();
		} );

		logger.info( `Starting server on port ${ PORT }...` );
		return requestHandler.listen( PORT );
	}

	if ( requestHandler ) {
		logger.info( 'Creating an HTTP server...' );
		const server = createServer( ( req, res ) => {
			if ( req.url === healthCheckUrl ) {
				res.writeHead( 200 );
				res.end();
			}

			return requestHandler( req, res );
		} );

		logger.info( `Starting server on port ${ PORT }...` );
		return server.listen( PORT );
	}

	throw Error( 'Please include a requestHandler and the appropriate flag' );
};
