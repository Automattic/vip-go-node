const server = require( '../src/server/' );
const expressApp = require( 'express' )();
const request = require( 'supertest' );
const HEALTHCHECKURL = '/cache-healthcheck?';

describe( 'src/server', () => {
	describe( 'should work with an express application', () => {
		it( 'should add a /cache-healthcheck? route returning 200 OK', done => {
			const expressServer = server( expressApp );
			request( expressServer.app ).get( HEALTHCHECKURL ).then( response => {
				expect( response.statusCode ).toBe( 200 );
				expect( response.text ).toBe( 'ok' );
				done();
			} );
		} );

		it( 'should keep already defined routes', done => {
			expressApp.get( '/down', ( req, res ) => {
				res.status( 501 ).end();
			} );

			const expressServer = server( expressApp );
			request( expressServer.app ).get( '/down' ).then( response => {
				expect( response.statusCode ).toBe( 501 );
				done();
			} );
		} );

		it( 'should boot up a server on the provided PORT', done => {
			const expressServerOnPort = server( expressApp, { PORT: 8000 } );
			expressServerOnPort.listen();
			request( 'http://localhost:8000' ).get( HEALTHCHECKURL ).then( response => {
				expect( response.statusCode ).toBe( 200 );
				expressServerOnPort.close();
				done();
			} );
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

		it( 'should add a /cache-healthcheck? route returning 200 OK', done => {
			const httpServer = server( requestHandler );

			request( httpServer.app ).get( HEALTHCHECKURL ).then( response => {
				expect( response.statusCode ).toBe( 200 );
				expect( response.text ).toBe( 'ok' );
				done();
			} );
		} );

		it( 'should respond to /cache-healthcheck? route and not forward the request', done => {
			const httpServer = server( requestHandler );

			request( httpServer.app ).get( HEALTHCHECKURL ).then( response => {
				expect( response.statusCode ).toBe( 200 );
				expect( response.text ).toBe( 'ok' );
				expect( mock ).not.toHaveBeenCalled();

				done();
			} );
		} );

		it( 'should match defined routes', done => {
			const httpServer = server( requestHandler );

			request( httpServer.app ).get( '/custom' ).then( response => {
				expect( response.statusCode ).toBe( 201 );
				done();
			} );
		} );

		it( 'should return default response if no route is matched', done => {
			const httpServer = server( requestHandler );

			request( httpServer.app ).get( '/notfound' ).then( response => {
				expect( response.statusCode ).toBe( 404 );
				done();
			} );
		} );

		it( 'should boot up a server on the provided PORT', done => {
			const httpServerOnPort = server( requestHandler, { PORT: 8000 } );
			httpServerOnPort.listen();
			request( 'http://localhost:8000' ).get( HEALTHCHECKURL ).then( response => {
				expect( response.statusCode ).toBe( 200 );
				httpServerOnPort.close();
				done();
			} );
		} );
	} );
} );
