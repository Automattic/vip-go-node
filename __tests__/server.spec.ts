/* eslint-disable jest/expect-expect */
const expressApp = require( 'express' )();
const request = require( 'supertest' );

const server = require( '../src/server/' );

const HEALTHCHECKURL = '/cache-healthcheck?';

describe( 'src/server', () => {
	describe( 'should work with an express application', () => {
		it( 'should add a /cache-healthcheck? route returning 200 OK', () => {
			const expressServer = server( expressApp );
			return request( expressServer.app ).get( HEALTHCHECKURL ).expect( 200, 'ok' );
		} );

		it( 'should keep already defined routes', () => {
			expressApp.get( '/down', ( _req, res ) => {
				res.status( 501 ).end();
			} );

			const expressServer = server( expressApp );
			return request( expressServer.app ).get( '/down' ).expect( 501 );
		} );

		it( 'should boot up a server on the provided PORT', async () => {
			const expressServerOnPort = server( expressApp, { PORT: 8000 } );
			expressServerOnPort.listen();
			try {
				await request( 'http://localhost:8000' ).get( HEALTHCHECKURL ).expect( 200 );
			} finally {
				expressServerOnPort.close();
			}
		} );
	} );

	describe( 'should work with a custom request handler', () => {
		const mock = jest.fn();
		const requestHandler = ( req, res ) => {
			if ( req.url === '/custom' ) {
				res.writeHead( 201 );
				res.end();
				return;
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

		it( 'should add a /cache-healthcheck? route returning 200 OK', () => {
			const httpServer = server( requestHandler );
			return request( httpServer.app ).get( HEALTHCHECKURL ).expect( 200, 'ok' );
		} );

		it( 'should respond to /cache-healthcheck? route and not forward the request', () => {
			const httpServer = server( requestHandler );
			return request( httpServer.app )
				.get( HEALTHCHECKURL )
				.expect( 200, 'ok' )
				.expect( () => {
					expect( mock ).not.toHaveBeenCalled();
				} );
		} );

		it( 'should match defined routes', () => {
			const httpServer = server( requestHandler );
			return request( httpServer.app ).get( '/custom' ).expect( 201 );
		} );

		it( 'should return default response if no route is matched', () => {
			const httpServer = server( requestHandler );

			return request( httpServer.app ).get( '/notfound' ).expect( 404 );
		} );

		it( 'should boot up a server on the provided PORT', async () => {
			const httpServerOnPort = server( requestHandler, { PORT: 8000 } );
			httpServerOnPort.listen();
			try {
				await request( 'http://localhost:8000' ).get( HEALTHCHECKURL ).expect( 200 );
			} finally {
				httpServerOnPort.close();
			}
		} );
	} );
} );
