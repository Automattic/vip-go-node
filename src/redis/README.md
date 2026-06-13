# VIP Go Redis Helper Library

Our Redis helper is based on the [ioredis](https://github.com/luin/ioredis) project.

## Initialization

To start, install the `ioredis` package (declared as an optional peer dependency of this library):

```
npm install --save ioredis@^5
```

Instantiate a new Redis client:

```js
const { redis } = require( '@automattic/vip-go' );
const client = redis();
```

By default, this library logs to the `console`. If you prefer, you can set your own logger:

```js
const redis = redis( { logger: yourLogger } );
```

## Configuration

On VIP Go servers, we automatically set two env vars with connection details: `REDIS_MASTER` (host and port separated by a colon) and `REDIS_PASSWORD`.

For consistency in local environments, we recommend creating and using these variables as well.

```
REDIS_MASTER=123.456.789.123:3000
REDIS_PASSWORD=password
```

## Reconnecting to Redis

If the connection to the Redis server is lost, the client keeps queueing commands while it attempts to reconnect.

After `QUEUED_CONNECTION_ATTEMPTS` reconnection attempts (default: `3`), the offline queue is disabled and new commands are rejected immediately. ioredis flushes the previously queued commands on its own with a `MaxRetriesPerRequestError`, so no stale commands linger. The offline queue is re-enabled once the connection becomes ready again.

Set the `QUEUED_CONNECTION_ATTEMPTS` environment variable to a positive integer to change the number of attempts; invalid values fall back to the default.

## Bring Your Own Client

If you would prefer to use your own client, we expose the connection details via a helper function:

```
const { redis } = require( '@automattic/vip-go' );
const { host, port, password } = redis.getConnectionInfo();
```
