const { createServer } = require( 'http' );
const HEALTHCHECKURL = '/cache-healthcheck?';
const wrapApplication = ( application, { PORT, logger } ) => {
	const app = application;
	let server;

	return {
		app,
		server,
		listen: ( connected ) => {
			logger.info( 'Starting server on ' + PORT );
			server = app.listen( PORT, connected );
		},
		close: () => {
			server.close();
		},
	};
};

module.exports = ( app, { PORT, logger = console } = {} ) => {
	if ( ! app ) {
		throw Error( 'Please include a requestHandler' );
	}

	let server = null;

	logger.info( 'Creating an HTTP server...' );

	server = createServer( ( req, res ) => {
		if ( req.url === HEALTHCHECKURL ) {
			res.writeHead( 200 );
			res.end( 'ok' );
		}

		return app( req, res );
	} );

	return wrapApplication( server, { PORT: PORT || process.env.PORT || 3000, logger } );
};
