const server = require( '../src/server/' );
const expressApp = require( 'express' )();
const request = require( 'supertest' );
const HEALTHCHECKURL = '/cache-healthcheck?';
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

		const expressServer = server( { express: true, requestHandler: expressApp } );
		request( expressServer.app ).get( '/down' ).then( ( response ) => {
			expect( response.statusCode ).toBe( 501 );
			done();
		} );
	} );

    test( 'Should boot up a server on the provided PORT', ( done ) => {
        let expressServerOnPort = server( { requestHandler: expressApp, express: true, PORT: 8000 } );
        expressServerOnPort.listen();
        request( 'http://localhost:8000').get(HEALTHCHECKURL).then( (response) => {
            expect(response.statusCode).toBe(200);
            expressServerOnPort.close();
            done();
        })
    } );
} );

describe( 'Should work with a custom request handler', () => {
	const httpServer = server( { requestHandler: requestHandler } );

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
        let httpServerOnPort = server( { requestHandler: requestHandler, PORT: 8000 } );
        httpServerOnPort.listen();
        request( 'http://localhost:8000').get(HEALTHCHECKURL).then( (response) => {
            expect(response.statusCode).toBe(200);
            httpServerOnPort.close();
            done();
        })
    } );
} );
