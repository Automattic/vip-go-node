import express, { type Request, type Response } from 'express';
import { equal, ok, throws } from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { describe, it, mock, afterEach } from 'node:test';

import server from '../../src/server';

import type { IncomingMessage, Server, ServerResponse } from 'node:http';

const expressApp = express();
const HEALTHCHECKURL = '/cache-healthcheck?';

interface RawHttpResponse {
	body: string;
	statusCode: number;
}

interface RequestTarget {
	app?: Server;
	port?: number;
}

const requestPath = ( path: string, target: RequestTarget ): Promise< RawHttpResponse > => {
	return new Promise( ( resolve, reject ) => {
		const send = ( port: number, close?: () => void ): void => {
			const req = httpRequest(
				{
					host: '127.0.0.1',
					method: 'GET',
					path,
					port,
				},
				res => {
					let body = '';

					res.on( 'data', ( chunk: Buffer | string ) => {
						body += typeof chunk === 'string' ? chunk : chunk.toString( 'utf8' );
					} );

					res.on( 'end', () => {
						close?.();
						resolve( {
							body,
							statusCode: res.statusCode || 0,
						} );
					} );
				}
			);

			req.on( 'error', error => {
				close?.();
				reject( error );
			} );

			req.end();
		};

		if ( target.app ) {
			target.app.on( 'error', reject );
			const listener = target.app.listen( 0, '127.0.0.1', () => {
				const address = listener.address();
				ok( address && typeof address !== 'string', 'Expected a numeric port address' );
				send( address.port, () => listener.close() );
			} );
			listener.on( 'error', reject );
			return;
		}

		ok( typeof target.port === 'number', 'Expected a port when app is not provided' );
		send( target.port );
	} );
};

void describe( 'src/server', async () => {
	await describe( 'should work with an express application', async () => {
		await it( 'should add a /cache-healthcheck? route returning 200 OK', async () => {
			const expressServer = server( expressApp );
			const response = await requestPath( HEALTHCHECKURL, { app: expressServer.app } );
			equal( response.statusCode, 200 );
			equal( response.body, 'ok' );
		} );

		await it( 'should keep already defined routes', async () => {
			expressApp.get( '/down', ( _req: Request, res: Response ) => {
				res.status( 501 ).end();
			} );

			const expressServer = server( expressApp );
			const response = await requestPath( '/down', { app: expressServer.app } );
			equal( response.statusCode, 501 );
		} );

		await it( 'should boot up a server on the provided PORT', async () => {
			const expressServerOnPort = server( expressApp, { PORT: 8000 } );
			expressServerOnPort.listen();
			try {
				const response = await requestPath( HEALTHCHECKURL, { port: 8000 } );
				equal( response.statusCode, 200 );
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
			const response = await requestPath( HEALTHCHECKURL, { app: httpServer.app } );
			equal( response.statusCode, 200 );
			equal( response.body, 'ok' );
		} );

		await it( 'should respond to /cache-healthcheck? route and not forward the request', async () => {
			const httpServer = server( requestHandler );
			const response = await requestPath( HEALTHCHECKURL, { app: httpServer.app } );
			equal( response.statusCode, 200 );
			equal( response.body, 'ok' );
			equal( mockFn.mock.callCount(), 0 );
		} );

		await it( 'should match defined routes', async () => {
			const httpServer = server( requestHandler );
			const response = await requestPath( '/custom', { app: httpServer.app } );
			equal( response.statusCode, 201 );
		} );

		await it( 'should return default response if no route is matched', async () => {
			const httpServer = server( requestHandler );

			const response = await requestPath( '/notfound', { app: httpServer.app } );
			equal( response.statusCode, 404 );
		} );

		await it( 'should boot up a server on the provided PORT', async () => {
			const httpServerOnPort = server( requestHandler, { PORT: 8000 } );
			httpServerOnPort.listen();
			try {
				const response = await requestPath( HEALTHCHECKURL, { port: 8000 } );
				equal( response.statusCode, 200 );
			} finally {
				httpServerOnPort.close();
			}
		} );
	} );
} );
