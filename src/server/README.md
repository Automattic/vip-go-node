# VIP Go HTTP Server

## Initialization

In order to use a VIP Go HTTP server, you need to initialize it with a request handler. The request handler contains the rooting of your server and is used to handle requests on your server

The HTTP server supports an `express` app or a `custom` handler. A custom handler is a function taking two arguments (req and res), executed against every request, and sends a reponse to the client.

The usage with a custom handler is as follows:

``` js
const { server } = require( '@automattic/vip-go' );
const myRequestHandler = ( req, res ) => {
    if ( req.url === "/admin/" ) {
        res.writeHead( 403 );
        res.end();
    }

    res.end( 'Hello from the server' );
};

const myServer = server( myRequestHandler );

myServer.listen()
```

To use it with an `express` app, make sure to pass the express application as a request handler:
``` js
const { server } = require( '@automattic/vip-go' );

const app = require('express')();

app.get( '/', ( req, res ) => res.send( 'Hello World!' ) );

const myServer = server( app );

myServer.listen()
```

The `.listen()` method takes a callback function as an argument and it's executed after the server is booted up. It can be used as follow:

``` js
const myServer = server( app );

myServer.listen( () => {
    console.log('Server ready!')
} )
```

The object has a `.close()` too and can be used to stop the server without killing the process.

The app (or request handler) and the server itself are accessible using `.app` and `.server`. Here is a recap of what you can access from the returned object:
```
const myServer = server( app );

myServer
   - .app // The application or request handler passed in the initialization
   - .server // The server started if any (null otherwise)
   - .listen( () => {} ) // Starts the server on the designed PORT, can take a callback
   - .close() // Closes the started server
```

## Configuration

On VIP Go servers, we use an environment variable called `PORT` to start up the server, which is the default that must be used. If not defined, the port defaults to `3000`. If you want to force a `PORT`, please include it in the initialization as follows:

``` js
const myServer = server( app, { PORT: process.env.PORT || 8000 } );
```

To test it, head to `http://localhost:8000/cache-healthcheck?`. You should receive a `200 OK` HTTP response code and an `ok` message if everything is working. This route is **added by default** to all servers created by the module.

The module will also log to the `console` by default. If you want to include your own logger, please use:

``` js
const myServer = server( app, { logger: myLogger } );
```
