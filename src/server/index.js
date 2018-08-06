const { createServer } = require( 'http' );
const HEALTHCHECKURL = '/cache-healthcheck?';

module.exports = ( { PORT = 3000, requestHandler, express = false, logger = console } ) => {
	if ( requestHandler && express ) {
		logger.info( 'Creating an Express server...' );
		requestHandler.get( HEALTHCHECKURL, ( req, res ) => {
			res.status( 200 ).end( 'ok' );
		} );

		logger.info( `Starting server on port ${ PORT }...` );
		return requestHandler.listen( PORT );
	}

	if ( requestHandler ) {
		logger.info( 'Creating an HTTP server...' );
		const server = createServer( ( req, res ) => {
			if ( req.url === HEALTHCHECKURL ) {
				res.writeHead( 200 );
				res.end( 'ok' );
			}

			return requestHandler( req, res );
		} );

		logger.info( `Starting server on port ${ PORT }...` );
		return server.listen( PORT );
	}

	throw Error( 'Please include a requestHandler and the appropriate flag' );
};
