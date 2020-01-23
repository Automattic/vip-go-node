# VIP Go Redis Helper Library

Our Redis helper is based on the [ioredis](https://github.com/luin/ioredis) project.

## Initialization

Instantiate a new Redis client:

``` js
const { redis } = require( '@automattic/vip-go' );
const client = redis();
```
By default, this library logs to the `console`. If you prefer, you can set your own logger:

```js
const redis = redis( { logger: yourLogger } );
```

## Configuration

Configuring a Redis client compatible with the VIP Go platform requires a `REDIS_MASTER` environment variable. This is the host and port of your Redis server, which might look something like this:
`REDIS_MASTER = 123.456.789.123:3000`

If you require a password, please set the `REDIS_PASSWORD` environment variable as well.

Please note **this is only required if you want to run redis locally**. On VIP Go, these variables are **automatically set**.

## Reconnecting to Redis

If the connection to the Redis server is lost, offline queuing for commands will be disabled.

After three reconnection attempts, all pending commands will be flushed so that there are no stale commands. You can change this number by using the `QUEUED_CONNECTION_ATTEMPTS` environment variable.

## Bring Your Own Client

If you would prefer to use your own client, we expose the connection details via a helper function:

```
const { redis } = require( '@automattic/vip-go' );
const { host, port, password } = redis.getConnectionInfo();
```
