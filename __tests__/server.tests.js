const server = require( '../src/server/' );
const expressApp = require( 'express' )();
const request = require( 'supertest' );
const healthCheckUrl = '/cache-healthcheck?';
const requestHandler = ( req, res ) => {
	if ( req.url === '/custom' ) {
		res.writeHead( 201 );
		res.end();
	}

	res.writeHead( 404 );
	res.end();
};

describe( 'Should work with an express application', () => {
	test( 'Should raise an error if express flag is present and no request handler', () => {
		expect( () => {
			server( { express: true } );
		} ).toThrow();
	} );

	test( 'Should add a /cache-healthcheck? route returning 200 OK', ( done ) => {
		const expressServer = server( { express: true, requestHandler: expressApp } );
		request( 'http://localhost:3000' ).get( healthCheckUrl ).then( ( response ) => {
			expect( response.statusCode ).toBe( 200 );
			expressServer.close();
			done();
		} );
	} );

	test( 'Should boot up a server on the provided PORT', ( done ) => {
		const PORT = 8000;
		const expressServer = server( { express: true, requestHandler: expressApp, PORT } );
		request( `http://localhost:${ PORT }` ).get( healthCheckUrl ).then( ( response ) => {
			expect( response.statusCode ).toBe( 200 );
			expressServer.close();
			done();
		} );
	} );

	test( 'Should keep already defined routes', ( done ) => {
		expressApp.get( '/down', ( req, res ) => {
			res.status( 501 ).end();
		} );

		const expressServer = server( { express: true, requestHandler: expressApp } );
		request( 'http://localhost:3000' ).get( '/down' ).then( ( response ) => {
			expect( response.statusCode ).toBe( 501 );
			expressServer.close();
			done();
		} );
	} );
} );

describe( 'Should work with a custom request handler', () => {
	test( 'Should raise an error if no request handler is passed', () => {
		expect( () => {
			server();
		} ).toThrow();
	} );

	test( 'Should add a /cache-healthcheck? route returning 200 OK', ( done ) => {
		const httpServer = server( { requestHandler: requestHandler } );
		request( 'http://localhost:3000' ).get( healthCheckUrl ).then( ( response ) => {
			expect( response.statusCode ).toBe( 200 );
			httpServer.close();
			done();
		} );
	} );

	test( 'Should boot up a server on the provided PORT', ( done ) => {
		const PORT = 8000;
		const httpServer = server( { requestHandler: requestHandler, PORT } );
		request( `http://localhost:${ PORT }` ).get( healthCheckUrl ).then( ( response ) => {
			expect( response.statusCode ).toBe( 200 );
			httpServer.close();
			done();
		} );
	} );

	test( 'Should match defined routes', ( done ) => {
		const httpServer = server( { requestHandler: requestHandler } );
		request( 'http://localhost:3000' ).get( '/custom' ).then( ( response ) => {
			expect( response.statusCode ).toBe( 201 );
			httpServer.close();
			done();
		} );
	} );

	test( 'Should return default response if no route is matched', ( done ) => {
		const httpServer = server( { requestHandler: requestHandler } );
		request( 'http://localhost:3000' ).get( '/notfound' ).then( ( response ) => {
			expect( response.statusCode ).toBe( 404 );
			httpServer.close();
			done();
		} );
	} );
} );
