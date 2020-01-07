# VIP Go Redis Helper Library

## Initialization

Instantiate a new Redis client:

``` js
const { redis } = require( '@automattic/vip-go' );
const redis = new Redis();
```
By default, this helper library logs to the `console`. If you prefer, you can set your own logger:

```js
const redis = new Redis( { logger: yourLogger } );
```

## Configuration
Configuring a Redis client compatible with the VIP Go platform requires a `REDIS_MASTER` environment variable. This is the host and port of your Redis server, which might look something like this:
`REDIS_MASTER = 123.456.789.123:3000`

If you require a password, please set the `REDIS_PASSWORD` environment variable as well.

## Reconnecting to Redis
If the connection to the Redis server is lost, offline queuing for commands will be disabled.

After three reconnection attempts, all pending commands will be flushed so that there are no stale commands.
You can change this number by using the `QUEUED_CONNECTION_ATTEMPTS` environment variable.