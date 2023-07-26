const server = require( '../src/server/' );
const expressApp = require( 'express' )();
const request = require( 'supertest' );
const HEALTHCHECKURL = '/cache-healthcheck?';

describe( 'src/server', () => {
	describe( 'should work with an express application', () => {
		it( 'should add a /cache-healthcheck? route returning 200 OK', async () => {
			const expressServer = server( expressApp );
			const response = await request( expressServer.app ).get( HEALTHCHECKURL );

			expect( response.statusCode ).toBe( 200 );
			expect( response.text ).toBe( 'ok' );
		} );

		it( 'should keep already defined routes', async () => {
			expressApp.get( '/down', ( _req, res ) => {
				res.status( 501 ).end();
			} );

			const expressServer = server( expressApp );
			const response = await request( expressServer.app ).get( '/down' );

			expect( response.statusCode ).toBe( 501 );
		} );

		it( 'should boot up a server on the provided PORT', async () => {
			const expressServerOnPort = server( expressApp, { PORT: 8000 } );
			expressServerOnPort.listen();
			const response = await request( 'http://localhost:8000' ).get( HEALTHCHECKURL );

			expect( response.statusCode ).toBe( 200 );
			expressServerOnPort.close();
		} );
	} );

	describe( 'should work with a custom request handler', () => {
		const mock = jest.fn();
		const requestHandler = ( req, res ) => {
			if ( req.url === '/custom' ) {
				res.writeHead( 201 );
				res.end();
			}

			mock();

			res.writeHead( 404 );
			res.end();
		};

		afterEach( () => mock.mockClear() );

		it( 'should raise an error if no request handler is passed', () => {
			expect( () => {
				server();
			} ).toThrow( 'Please include a requestHandler' );
		} );

		it( 'should add a /cache-healthcheck? route returning 200 OK', async () => {
			const httpServer = server( requestHandler );
			const response = await request( httpServer.app ).get( HEALTHCHECKURL );

			expect( response.statusCode ).toBe( 200 );
			expect( response.text ).toBe( 'ok' );
		} );

		it( 'should respond to /cache-healthcheck? route and not forward the request', async () => {
			const httpServer = server( requestHandler );
			const response = await request( httpServer.app ).get( HEALTHCHECKURL );

			expect( response.statusCode ).toBe( 200 );
			expect( response.text ).toBe( 'ok' );
			expect( mock ).not.toHaveBeenCalled();
		} );

		it( 'should match defined routes', async () => {
			const httpServer = server( requestHandler );
			const response = await request( httpServer.app ).get( '/custom' );

			expect( response.statusCode ).toBe( 201 );
		} );

		it( 'should return default response if no route is matched', async () => {
			const httpServer = server( requestHandler );

			const response = await request( httpServer.app ).get( '/notfound' );

			expect( response.statusCode ).toBe( 404 );
		} );

		it( 'should boot up a server on the provided PORT', async () => {
			const httpServerOnPort = server( requestHandler, { PORT: 8000 } );
			httpServerOnPort.listen();
			const response = await request( 'http://localhost:8000' ).get( HEALTHCHECKURL );

			expect( response.statusCode ).toBe( 200 );
			httpServerOnPort.close();
		} );
	} );
} );
