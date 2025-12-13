const { createServer } = require( 'http' );
const HEALTHCHECKURL = '/cache-healthcheck?';
const wrapApplication = ( application, { PORT, logger } ) => {
	const app = application;
	let server;

	return {
		app,
		server,
		listen: connected => {
			logger.info( 'Starting server on ' + PORT );
			server = app.listen( PORT, () => {
				logger.info( 'Server listening on port ' + PORT );

				if ( typeof connected === 'function' ) {
					connected();
				}
			} );
		},
		close: () => {
			server.close();
		},
	};
};

/**
 * Creates an HTTP server wrapper with health check endpoint.
 * @param {Function} app - Express application or custom request handler
 * @param {Object} [options] - Server options
 * @param {number} [options.PORT] - Port number for the server
 * @param {Console} [options.logger] - Logger instance for output
 * @returns {{app: any, server: any, listen: Function, close: Function}} Server wrapper object
 */
module.exports = ( app, { PORT, logger = console } = {} ) => {
	if ( ! app ) {
		throw Error( 'Please include a requestHandler' );
	}

	let server = null;

	logger.info( 'Creating an HTTP server...' );

	server = createServer( ( req, res ) => {
		if ( req.url === HEALTHCHECKURL ) {
			res.writeHead( 200 );
			return res.end( 'ok' );
		}

		return app( req, res );
	} );

	return wrapApplication( server, { PORT: PORT || process.env.PORT || 3000, logger } );
};
