const http = require( 'http' );

const SERVER_PORT = process.env.PORT || 7777;
const HEALTHCHECK_PATH = '/cache-healthcheck?';

export default function createServer( requestListener ) {
	const server = http.createServer( requestListener );

	server.on( 'request', ( req, res ) => {
		if ( req.url.startsWith( HEALTHCHECK_PATH ) ) {
			res.statusCode = 200;
			return res.end( 'OK' );
		}
	} );

	server.listen( SERVER_PORT );

	return server;
}
