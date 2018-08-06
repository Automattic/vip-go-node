# VIP GO HTTP server usage
## Initialization
In order to use a VIP Go HTTP server, you need to initialize it with a request handler. The request handler contains the rooting of your server and is used handle requests on your server

The HTTP server supports an `express` app or a `custom` handler. A custom handler is a function taking two arguments (req and res), executed against any request, and should respond to the client's request.

The usage with a custom handler is as follows:

``` js
const { server } = require('vip-go-node');
const myRequestHandler = ( req, res ) => {
    if ( req.url === "/admin/" ) {
        res.writeHead( 403 );
        res.end();
    }

    res.send( 'Hello from the server' );
};

const myServer = server( { requestHandler: myRequestHandler } );
```
To use it with an `express` app, make sure to pass the express application as a request handler and activate the `express` flag as follows:
``` js
const { server } = require('vip-go-node');
const app = require('express')();

const myServer = server( { requestHandler: app, express: true } );
```
The `server` module boots the server on the designed PORT and returns the created server. To test it, head to `http://localhost:3000/cache-healthcheck?`. You should receive a `200 OK` HTTP response code if everything is working. This route is **added by default** to all servers created by the module.

## Configuration
By default, the server will start on port `3000`. If you want to change the port, please include a PORT in the initialization:
``` js
const myServer = server( { requestHandler: myRequestHandler, PORT: 8000 } );
```
The module will also log to the `console` by default. If you want to include your own logger, please use:
``` js
const myServer = server( { requestHandler: myRequestHandler, logger: myLogger } );
```
