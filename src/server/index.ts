import { createServer, type Server } from 'node:http';

import type { GoServerOptions, RequestHandler, WrappedApplication } from './types';

const HEALTHCHECKURL = '/cache-healthcheck?';

const wrapApplication = (
	application: Server,
	{ PORT, logger }: Required< GoServerOptions >
): WrappedApplication => {
	const app = application;
	let server: Server | undefined;

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
			( server as Server ).close();
		},
	};
};

function createGoServer(
	app?: RequestHandler,
	{ PORT, logger = console }: GoServerOptions = {}
): WrappedApplication {
	if ( ! app ) {
		throw Error( 'Please include a requestHandler' );
	}

	logger.info( 'Creating an HTTP server...' );

	const server = createServer( ( req, res ) => {
		if ( req.url === HEALTHCHECKURL ) {
			res.writeHead( 200 );
			return res.end( 'ok' );
		}

		return app( req, res );
	} );

	return wrapApplication( server, { PORT: PORT || process.env[ 'PORT' ] || 3000, logger } );
}

export = createGoServer;
