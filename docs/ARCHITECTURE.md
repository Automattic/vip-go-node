# Architecture

## Purpose

This document describes the runtime shape of `@automattic/vip-go`, the package helpers it exposes, and the boundaries each helper owns. It is intended for maintainers, reviewers, and downstream consumers that need a quick mental model before changing the package.

## Package role

`@automattic/vip-go` is a small helper package for Node.js applications running on VIP Go. It provides shared runtime primitives for HTTP serving, logging, New Relic bootstrapping, and Redis connection setup.

The package is not an application framework and does not own product logic. Consumers remain responsible for routing, authorization, request validation, error handling, and application-specific observability.

## Public entrypoint

The package root exports an object from `src/index.ts`:

```ts
import logger from './logger';
import newrelic from './newrelic';
import redis from './redis';
import server from './server';

export = {
	logger,
	server,
	newrelic,
	redis,
};
```

Runtime consumers commonly use CommonJS:

```js
const { server, logger, newrelic, redis } = require( '@automattic/vip-go' );
```

Type consumers can import helper types from the `./types` export:

```ts
import type { RedisOptions } from '@automattic/vip-go/types';
```

## Build and package output

Source is authored in TypeScript and compiled to CommonJS JavaScript under `dist/`.

Important package metadata:

- `main`: `./dist/src/index.js`
- `types`: `./dist/src/index.d.ts`
- package root export: `./dist/src/index.js` plus `./dist/src/index.d.ts`
- `./types` export: `./dist/src/types/index.js` plus `./dist/src/types/index.d.ts`
- published files: `dist/src/`

The TypeScript compiler is configured for strict checking and declaration emit. The build command is:

```sh
npm run build
```

## Module map

### `server`

Source: `src/server/index.ts`

The `server` helper wraps a request handler or Express-compatible app with a Node HTTP server.

Responsibilities:

- Require a request handler.
- Create an HTTP server with `node:http.createServer`.
- Add a built-in `/cache-healthcheck?` route that returns `200` and `ok`.
- Forward all non-healthcheck requests to the provided app/request handler.
- Return a wrapped application object with `app`, `server`, `listen`, and `close`.
- Resolve the listen port from the explicit `PORT` option, then `process.env.PORT`, then `3000`.

Boundary:

- The helper does not define application routes beyond `/cache-healthcheck?`.
- Consumers own routing, HTTP semantics, authentication, and request validation.

### `logger`

Source: `src/logger/index.ts`

The `logger` helper creates a Winston logger with VIP-oriented log labels and environment-sensitive formatting.

Responsibilities:

- Require a namespace such as `app:component`.
- Derive `app` and `app_type` labels from the namespace.
- Add `message_type`, `app_process`, and `app_worker` labels.
- Use local text formatting when `VIP_GO_APP_ID` is absent.
- Use production JSON-like formatting when `VIP_GO_APP_ID` is present.
- Set log level to `debug` in local mode and `info` in VIP mode.
- Support custom Winston transport, cluster implementation, and per-logger silence option.
- Support default global silencing via `VIP_GO_SILENCE_LOGS=1`.

Boundary:

- The helper normalizes log shape but does not enforce redaction or application-specific logging policy.
- Consumers must avoid logging secrets and sensitive request payloads.

### `newrelic`

Source: `src/newrelic/index.ts`

The `newrelic` helper conditionally loads the `newrelic` package for VIP runtime environments.

Responsibilities:

- Treat absent `VIP_GO_APP_ID` as local development and skip initialization.
- Require `NEW_RELIC_NO_CONFIG_FILE=true` outside local mode.
- Require `NEW_RELIC_LICENSE_KEY` outside local mode.
- Dynamically require the `newrelic` package only after environment checks pass.
- Return the loaded New Relic module when initialization succeeds.
- Log missing configuration and skip initialization instead of throwing for missing env vars.
- Throw if the `newrelic` package cannot be imported after configuration is valid.

Boundary:

- `newrelic` is not a package dependency. Applications that need it must install it.
- This helper bootstraps the agent; it does not define application-specific New Relic instrumentation.

### `redis`

Source: `src/redis/index.ts`

The `redis` helper creates a singleton `ioredis` client using VIP Redis environment variables.

Responsibilities:

- Expose `redis()` for client creation.
- Expose `redis.getConnectionInfo()` for bring-your-own-client scenarios.
- Read `REDIS_MASTER` as `host:port`.
- Read `REDIS_PASSWORD` and pass it to the client options.
- Use `QUEUED_CONNECTION_ATTEMPTS` as `maxRetriesPerRequest`, defaulting to `3`.
- Enable offline queue by default.
- Re-enable offline queue on connect.
- Disable offline queue on reconnect once max retry behavior is reached.
- Attach connect, reconnecting, error, and disconnect log handlers.
- Dynamically require `ioredis` only when a valid host and port are present.

Boundary:

- `ioredis` is not a production dependency of this package. Applications using Redis must install it.
- The helper standardizes client creation but does not own cache semantics, key design, or command-level retry policy beyond the configured client options.

## Runtime mode model

`VIP_GO_APP_ID` is the shared signal for local versus VIP runtime behavior:

- absent: local mode
- present: VIP mode

Effects:

- `logger` switches formatting and log level.
- `newrelic` skips initialization in local mode.

`server` and `redis` do not use `VIP_GO_APP_ID` directly for runtime branching.

## External dependencies

Runtime dependency:

- `winston`: logger implementation.

Consumer-installed optional dependencies:

- `newrelic`: required by consumers that call `newrelic()` in VIP mode.
- `ioredis`: required by consumers that call `redis()` with a valid Redis endpoint.

Development and test dependencies include TypeScript, `ts-node`, Express, `ioredis`, Winston transport types, Node types, and formatting/linting tools.

## Compatibility notes

- Package output is CommonJS.
- Source uses TypeScript with `export =` compatibility patterns.
- Consumers should prefer the package root export and the documented `./types` export.
- Legacy imports from build output paths, such as `@automattic/vip-go/dist/...`, should be treated as compatibility-sensitive because they couple consumers to package internals.

## Change-risk map

High-risk areas:

- `src/server/index.ts`: changes can affect service startup and healthcheck behavior.
- `src/logger/index.ts`: changes can affect Kibana/log search shape and incident visibility.
- `src/newrelic/index.ts`: changes can silently disable or alter APM initialization.
- `src/redis/index.ts`: changes can affect cache connectivity, queued commands, and reconnect behavior.
- `package.json` exports and `files`: changes can break published package resolution or TypeScript declarations.

Lower-risk areas:

- README-only examples, as long as they match runtime behavior.
- Test helper transport code, as long as it remains aligned with Winston transport behavior.

## Related docs

- [Environment](ENVIRONMENT.md)
- [Testing](TESTING.md)
- [Root README](../README.md)
