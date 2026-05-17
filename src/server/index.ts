import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

const HEALTHCHECKURL = '/cache-healthcheck?';

type RequestHandler = ( req: IncomingMessage, res: ServerResponse ) => unknown;

interface LoggerLike {
	info: ( message: string ) => void;
}

const wrapApplication = (
	application: Server,
	{ PORT, logger }: Required< createGoServer.Options >
): createGoServer.WrappedApplication => {
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
	{ PORT, logger = console }: createGoServer.Options = {}
): createGoServer.WrappedApplication {
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

namespace createGoServer {
	export interface Options {
		PORT?: number | string;
		logger?: LoggerLike;
	}

	export interface WrappedApplication {
		app: Server;
		server: Server | undefined;
		listen: ( connected?: () => void ) => void;
		close: () => void;
	}
}

export = createGoServer;
