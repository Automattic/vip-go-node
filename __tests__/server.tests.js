const server = require( '../src/server/' );
const expressApp = require( 'express' )();
const request = require( 'supertest' );
const HEALTHCHECKURL = '/cache-healthcheck?';
const requestHandler = ( req, res ) => {
	if ( req.url === '/custom' ) {
		res.writeHead( 201 );
		res.end();
	}

	// eslint-disable-next-line no-console
	console.log( 'Not found' );

	res.writeHead( 404 );
	res.end();
};

describe( 'Should work with an express application', () => {
	test( 'Should add a /cache-healthcheck? route returning 200 OK', ( done ) => {
		const expressServer = server( expressApp );
		request( expressServer.app ).get( HEALTHCHECKURL ).then( ( response ) => {
			expect( response.statusCode ).toBe( 200 );
			expect( response.text ).toBe( 'ok' );
			done();
		} );
	} );

	test( 'Should keep already defined routes', ( done ) => {
		expressApp.get( '/down', ( req, res ) => {
			res.status( 501 ).end();
		} );

		const expressServer = server( expressApp );
		request( expressServer.app ).get( '/down' ).then( ( response ) => {
			expect( response.statusCode ).toBe( 501 );
			done();
		} );
	} );

	test( 'Should boot up a server on the provided PORT', ( done ) => {
		const expressServerOnPort = server( expressApp, { PORT: 8000 } );
		expressServerOnPort.listen();
		request( 'http://localhost:8000' ).get( HEALTHCHECKURL ).then( ( response ) => {
			expect( response.statusCode ).toBe( 200 );
			expressServerOnPort.close();
			done();
		} );
	} );
} );

describe( 'Should work with a custom request handler', () => {
	const httpServer = server( requestHandler );

	test( 'Should raise an error if no request handler is passed', () => {
		expect( () => {
			server();
		} ).toThrow();
	} );

	test( 'Should add a /cache-healthcheck? route returning 200 OK', ( done ) => {
		request( httpServer.app ).get( HEALTHCHECKURL ).then( ( response ) => {
			expect( response.statusCode ).toBe( 200 );
			expect( response.text ).toBe( 'ok' );
			done();
		} );
	} );

	test( 'Should respond to /cache-healthcheck? route and not forward the request', ( done ) => {
		// eslint-disable-next-line no-undef
		const consoleSpy = jest.spyOn( console, 'log' );

		request( httpServer.app ).get( HEALTHCHECKURL ).then( ( response ) => {
			expect( response.statusCode ).toBe( 200 );
			expect( response.text ).toBe( 'ok' );
			expect( consoleSpy ).not.toHaveBeenCalled();

			consoleSpy.mockRestore();
			done();
		} );
	} );

	test( 'Should match defined routes', ( done ) => {
		request( httpServer.app ).get( '/custom' ).then( ( response ) => {
			expect( response.statusCode ).toBe( 201 );
			done();
		} );
	} );

	test( 'Should return default response if no route is matched', ( done ) => {
		request( httpServer.app ).get( '/notfound' ).then( ( response ) => {
			expect( response.statusCode ).toBe( 404 );
			done();
		} );
	} );

	test( 'Should boot up a server on the provided PORT', ( done ) => {
		const httpServerOnPort = server( requestHandler, { PORT: 8000 } );
		httpServerOnPort.listen();
		request( 'http://localhost:8000' ).get( HEALTHCHECKURL ).then( ( response ) => {
			expect( response.statusCode ).toBe( 200 );
			httpServerOnPort.close();
			done();
		} );
	} );
} );
