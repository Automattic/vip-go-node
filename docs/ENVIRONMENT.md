# Environment

## Purpose

This document lists every environment variable read by `@automattic/vip-go` runtime helpers, explains how each variable affects behavior, and separates runtime variables from documentation/test-only references.

## Runtime variables

### `PORT`

Used by: `server`

Source: `src/server/index.ts`

Default: `3000`

The `server` helper resolves its listening port in this order:

1. explicit `PORT` option passed to `server( app, { PORT } )`
2. `process.env.PORT`
3. `3000`

Example:

```js
const { server } = require( '@automattic/vip-go' );
const appServer = server( app, { PORT: process.env.PORT || 8000 } );
appServer.listen();
```

Operational notes:

- VIP Go servers are expected to provide `PORT`.
- Local development can either set `PORT` or pass an explicit option.
- The helper always exposes `/cache-healthcheck?` on the selected port after listen starts.

### `NODEJS_APP_PROCESS`

Used by: `logger`

Source: `src/logger/index.ts`

Default: `master`

The logger reads `NODEJS_APP_PROCESS` at module load time and includes it in structured log output as `app_process`.

Operational notes:

- Use this variable when a runtime has multiple app process roles and logs need to distinguish them.
- If unset, logs use `app_process: "master"`.
- Because it is read at module load time, set it before importing or requiring the logger helper.

### `VIP_GO_SILENCE_LOGS`

Used by: `logger`

Source: `src/logger/index.ts`

Default: unset, logging enabled

When `VIP_GO_SILENCE_LOGS=1`, logger instances default to `silent: true` unless the caller explicitly passes a different `silent` option.

Example:

```sh
VIP_GO_SILENCE_LOGS=1 npm test
```

Operational notes:

- This is useful for quiet test output.
- Avoid setting it in production unless log suppression is intentional.
- Accidentally setting this variable can reduce incident visibility.

### `VIP_GO_APP_ID`

Used by: `logger`, `newrelic`

Sources: `src/logger/index.ts`, `src/newrelic/index.ts`

Default: unset, treated as local development

`VIP_GO_APP_ID` is the package-level runtime mode signal.

When absent:

- `logger` uses local text formatting.
- `logger` uses `debug` log level.
- `newrelic` logs that local development is detected and skips initialization.

When present:

- `logger` uses production JSON-like formatting.
- `logger` uses `info` log level.
- `newrelic` requires the New Relic environment variables before importing the agent.

Operational notes:

- Tests set this variable to mimic VIP Go behavior.
- Downstream apps should make sure the value is present in VIP runtime environments before depending on production logging or New Relic behavior.

### `NEW_RELIC_NO_CONFIG_FILE`

Used by: `newrelic`

Source: `src/newrelic/index.ts`

Required value: `true`

Outside local mode, `newrelic()` requires `NEW_RELIC_NO_CONFIG_FILE=true`. If it is unset or set to any value other than the string `true`, the helper logs an error and skips initialization.

Example:

```sh
NEW_RELIC_NO_CONFIG_FILE=true
```

Operational notes:

- This allows New Relic to initialize from environment variables instead of a config file.
- The check is strict: `true` works, `false` and missing values do not.

### `NEW_RELIC_LICENSE_KEY`

Used by: `newrelic`

Source: `src/newrelic/index.ts`

Default: none

Outside local mode, after `NEW_RELIC_NO_CONFIG_FILE=true` is confirmed, `newrelic()` requires `NEW_RELIC_LICENSE_KEY`. If it is missing, the helper logs an error and skips initialization.

Operational notes:

- Required for New Relic initialization in VIP runtime mode.
- Treat this value as a secret.
- Do not log it or include it in test fixtures beyond dummy values.

### `REDIS_MASTER`

Used by: `redis`

Source: `src/redis/index.ts`

Expected format: `host:port`

The Redis helper reads `REDIS_MASTER`, parses it as `host:port`, and returns `{ host, port, password }` from `redis.getConnectionInfo()`.

Valid examples from tests:

```text
host:123
123:123
127.0.0.1:3379
HOST_name.go-vip.co:123
```

Invalid examples from tests:

```text

abcdefg
:123
host:
host:abcd
host$name:123
```

Behavior:

- If `REDIS_MASTER` is missing or malformed, `redis()` logs an error and returns `undefined`.
- If `REDIS_MASTER` is valid, `redis()` dynamically imports `ioredis` and creates a singleton client.

Operational notes:

- Set this variable in local environments that use the Redis helper.
- Keep the value to a single host and numeric port.
- The helper does not parse multiple hosts or replica lists.

### `REDIS_PASSWORD`

Used by: `redis`

Source: `src/redis/index.ts`

Default: `null`

The Redis helper passes `REDIS_PASSWORD` to `ioredis` as the client password. If unset, `redis.getConnectionInfo()` returns `password: null` and the helper omits the password from the `ioredis` client options by passing `undefined`.

Operational notes:

- Set this variable when the Redis endpoint requires authentication.
- Treat it as a secret.
- `redis.getConnectionInfo()` returns the password, so downstream code should avoid logging that return value directly.

### `QUEUED_CONNECTION_ATTEMPTS`

Used by: `redis`

Source: `src/redis/index.ts`

Default: `3`

The Redis helper passes `QUEUED_CONNECTION_ATTEMPTS` to `ioredis` as `maxRetriesPerRequest`. If unset, the default is `3`.

Behavior:

- Offline queueing is enabled when the client is created.
- Values are validated as integers greater than or equal to `1`; unset, empty, zero, negative, fractional, or non-numeric values fall back to `3`.
- After that many reconnection attempts, the helper logs one error per outage and disables the offline queue, so new commands are rejected.
- `ioredis` flushes previously queued commands with `MaxRetriesPerRequestError` after `maxRetriesPerRequest` attempts.
- The helper re-enables the offline queue when the connection becomes `ready`.

Operational notes:

- Use this variable to tune queued Redis command retry behavior.
- Lower values reduce stale queued commands but can increase failed requests during transient Redis outages.
- Higher values may preserve commands longer but can increase queue buildup during outages.

## Documentation-only references

### `NODE_ENV`

Used by: logger README example only

Source: `src/logger/README.md`

`NODE_ENV` appears in an example wrapper that silences logging during tests:

```js
const isTests = process.env.NODE_ENV === 'test';
```

The runtime helpers do not read `NODE_ENV` directly.

## Test-only environment behavior

Tests mutate environment variables to simulate local and VIP runtime behavior.

Common test patterns:

- Save a copy of `process.env` before mutation.
- Restore `process.env` after each test.
- Set `VIP_GO_APP_ID` to mimic VIP Go mode.
- Set New Relic variables to exercise skip/error/success paths.
- Set Redis variables to exercise valid and invalid parsing paths.

## Quick reference

| Variable                     | Helper               | Required for runtime?              | Default or fallback                                            |
| ---------------------------- | -------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `PORT`                       | `server`             | no                                 | `3000`                                                         |
| `NODEJS_APP_PROCESS`         | `logger`             | no                                 | `master`                                                       |
| `VIP_GO_SILENCE_LOGS`        | `logger`             | no                                 | logging enabled                                                |
| `VIP_GO_APP_ID`              | `logger`, `newrelic` | required for VIP mode behavior     | local mode when absent                                         |
| `NEW_RELIC_NO_CONFIG_FILE`   | `newrelic`           | yes, outside local mode            | skip New Relic when missing or not `true`                      |
| `NEW_RELIC_LICENSE_KEY`      | `newrelic`           | yes, outside local mode            | skip New Relic when missing                                    |
| `REDIS_MASTER`               | `redis`              | yes, for `redis()` client creation | log error and return `undefined` when missing/malformed        |
| `REDIS_PASSWORD`             | `redis`              | only when Redis requires auth      | `null` from `getConnectionInfo()`; omitted from client options |
| `QUEUED_CONNECTION_ATTEMPTS` | `redis`              | no                                 | `3`                                                            |
| `NODE_ENV`                   | README example only  | no                                 | not read by runtime helpers                                    |

## Related docs

- [Architecture](ARCHITECTURE.md)
- [Testing](TESTING.md)
- [Redis README](../src/redis/README.md)
- [Logger README](../src/logger/README.md)
- [New Relic README](../src/newrelic/README.md)
- [Server README](../src/server/README.md)
