const { createServer } = require( 'http' );
const HEALTHCHECKURL = '/cache-healthcheck?';
const wrapApplication = ( application, PORT ) => {
	const app = application;
	let server;

	return {
		app,
		server,
		listen: ( connected ) => {
			console.log("Starting server on", PORT)
			server = app.listen( PORT, connected );
		},
		close: () => {
			server.close();
		},
	};
};

module.exports = ( { PORT, requestHandler, express = false, logger = console } ) => {
	if ( requestHandler && express ) {
		logger.info( 'Creating an Express server...' );
		requestHandler.get( HEALTHCHECKURL, ( req, res ) => {
			res.status( 200 ).end( 'ok' );
		} );

		return wrapApplication( requestHandler, PORT || process.env.PORT || 3000 );
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

		return wrapApplication( server, PORT || process.env.PORT || 3000 );
	}

	throw Error( 'Please include a requestHandler and the appropriate flag' );
};
