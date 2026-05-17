import express, { type Request, type Response } from 'express';
import { equal, throws } from 'node:assert/strict';
import { describe, it, mock, afterEach } from 'node:test';
import request from 'supertest';

import server from '../src/server';

import type { IncomingMessage, ServerResponse } from 'node:http';

const expressApp = express();
const HEALTHCHECKURL = '/cache-healthcheck?';

void describe( 'src/server', async () => {
	await describe( 'should work with an express application', async () => {
		await it( 'should add a /cache-healthcheck? route returning 200 OK', async () => {
			const expressServer = server( expressApp );
			await request( expressServer.app ).get( HEALTHCHECKURL ).expect( 200, 'ok' );
		} );

		await it( 'should keep already defined routes', async () => {
			expressApp.get( '/down', ( _req: Request, res: Response ) => {
				res.status( 501 ).end();
			} );

			const expressServer = server( expressApp );
			await request( expressServer.app ).get( '/down' ).expect( 501 );
		} );

		await it( 'should boot up a server on the provided PORT', async () => {
			const expressServerOnPort = server( expressApp, { PORT: 8000 } );
			expressServerOnPort.listen();
			try {
				await request( 'http://localhost:8000' ).get( HEALTHCHECKURL ).expect( 200 );
			} finally {
				expressServerOnPort.close();
			}
		} );
	} );

	await describe( 'should work with a custom request handler', async () => {
		const mockFn = mock.fn();
		const requestHandler = ( req: IncomingMessage, res: ServerResponse ) => {
			if ( req.url === '/custom' ) {
				res.writeHead( 201 );
				res.end();
				return;
			}

			mockFn();

			res.writeHead( 404 );
			res.end();
		};

		afterEach( () => mock.reset() );

		await it( 'should raise an error if no request handler is passed', () => {
			throws( () => server(), new Error( 'Please include a requestHandler' ) );
		} );

		await it( 'should add a /cache-healthcheck? route returning 200 OK', async () => {
			const httpServer = server( requestHandler );
			await request( httpServer.app ).get( HEALTHCHECKURL ).expect( 200, 'ok' );
		} );

		await it( 'should respond to /cache-healthcheck? route and not forward the request', async () => {
			const httpServer = server( requestHandler );
			await request( httpServer.app )
				.get( HEALTHCHECKURL )
				.expect( 200, 'ok' )
				.expect( () => {
					equal( mockFn.mock.callCount(), 0 );
				} );
		} );

		await it( 'should match defined routes', async () => {
			const httpServer = server( requestHandler );
			await request( httpServer.app ).get( '/custom' ).expect( 201 );
		} );

		await it( 'should return default response if no route is matched', async () => {
			const httpServer = server( requestHandler );

			await request( httpServer.app ).get( '/notfound' ).expect( 404 );
		} );

		await it( 'should boot up a server on the provided PORT', async () => {
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
