# Testing

## Purpose

This document describes how to validate `@automattic/vip-go`, what each test file covers, and the testing patterns maintainers should preserve when changing runtime helpers.

## Test stack

The package uses:

- Node.js built-in test runner from `node:test`
- Node.js strict assertions from `node:assert/strict`
- `ts-node/register` to execute TypeScript tests without a separate test build
- `node:module` hooks to mock `newrelic`
- `node:test` module mocking to mock `ioredis`
- Express for server helper integration tests
- Custom `TestTransport` for logger/New Relic/Redis log assertions

The primary test command is:

```sh
npm test
```

`npm test` runs:

```sh
npm run lint && npm run typecheck && npm run cmd:test
```

The direct test runner command is:

```sh
npm run cmd:test
```

It expands to:

```sh
node --require ts-node/register --experimental-test-module-mocks --test __tests__/unit/*.spec.ts
```

Integration tests live in `__tests__/integration/` and run separately:

```sh
npm run test:integration
```

They require a reachable Redis instance (started with `docker compose up -d`); when Redis is unreachable, the suite skips itself with a warning instead of failing.

## Validation commands

Run these before opening or merging a change:

```sh
npm run lint
npm run format:check
npm run typecheck
npm run cmd:test
npm test
npm run build
```

Command roles:

- `npm run lint`: runs ESLint over JavaScript, JSX, TypeScript, and TSX files.
- `npm run format:check`: verifies Prettier formatting.
- `npm run typecheck`: runs `tsc --noEmit` for strict type validation.
- `npm run cmd:test`: runs unit specs through Node's test runner.
- `npm run test:integration`: runs integration specs against a live Redis.
- `npm test`: runs lint, typecheck, and unit tests together.
- `npm run build`: emits CommonJS JavaScript and declarations into `dist/`.

## Test file map

### `__tests__/unit/server.spec.ts`

Covers `src/server`.

Primary behavior under test:

- Express-compatible apps can be wrapped.
- Custom request handlers can be wrapped.
- `/cache-healthcheck?` always returns `200` and `ok`.
- Healthcheck requests are not forwarded to the custom request handler.
- Existing routes continue to work.
- Missing request handler throws `Please include a requestHandler`.
- Explicit `PORT` option starts a listening server.
- Wrapped server can be closed after integration tests.

Important patterns:

- Uses ephemeral ports when testing wrapped `app` directly.
- Uses port `8000` only for explicit `PORT` behavior tests.
- Closes started servers in `finally` blocks.

### `__tests__/unit/logger.spec.ts`

Covers `src/logger`.

Primary behavior under test:

- Simple log messages are passed to the configured transport.
- Winston string interpolation works.
- Local logging format is used when `VIP_GO_APP_ID` is absent.
- Production logging format is used when `VIP_GO_APP_ID` is present.
- Custom labels are preserved in log output.
- Required labels are added: `app`, `app_type`, `message_type`, `app_process`, and `app_worker`.
- Cluster worker metadata is included when a custom cluster-like object is passed.
- Per-logger `silent: true` suppresses logs.

Important patterns:

- Uses `TestTransport` instead of asserting console output.
- Saves and restores `VIP_GO_APP_ID` around production-format tests.
- Reads Winston's rendered message through `Symbol.for( 'message' )`.

### `__tests__/unit/newrelic.spec.ts`

Covers `src/newrelic`.

Primary behavior under test:

- Local mode skips New Relic when `VIP_GO_APP_ID` is absent or empty.
- Missing `NEW_RELIC_NO_CONFIG_FILE` logs an error and skips initialization.
- `NEW_RELIC_NO_CONFIG_FILE=false` logs an error and skips initialization.
- Missing `NEW_RELIC_LICENSE_KEY` logs an error and skips initialization.
- Valid New Relic environment returns the loaded `newrelic` module.
- Valid environment with missing `newrelic` package throws an import error.

Important patterns:

- Uses `registerHooks` from `node:module` to mock the `newrelic` import.
- Restores module hooks after each test.
- Restores `process.env` after each test and sets `VIP_GO_APP_ID` to mimic VIP Go mode.

### `__tests__/unit/redis.spec.ts`

Covers `src/redis`.

Primary behavior under test:

- `redis.getConnectionInfo` is exposed.
- Invalid `REDIS_MASTER` values return null connection info.
- Valid `REDIS_MASTER` values return parsed host and port.
- `REDIS_PASSWORD` is returned when present.
- Missing or malformed `REDIS_MASTER` logs an error and avoids client creation.
- Valid Redis environment initializes `ioredis` with expected options.
- Client options include `enableOfflineQueue: true`, parsed host/port/password, default `maxRetriesPerRequest: 3`, and a retry strategy.

Important patterns:

- Uses `mock.module( 'ioredis', ... )` to avoid network connections.
- Restores module mocks and `process.env` after tests.
- Tests both positive and negative parsing examples for `REDIS_MASTER`.

### `__tests__/integration/redis.spec.ts`

Covers `src/redis` against a live Redis server.

Primary behavior under test:

- `redis()` creates a working client from `REDIS_MASTER` and answers `PING`.
- Repeated `redis()` calls return the same singleton client.
- Values round-trip through the real server (`SET`/`GET`/`DEL`).
- Expiry options (`PX`) are honored by the real server.
- `redis.getConnectionInfo()` matches the live environment.
- Client status reaches `connect`/`ready` after a successful command.

Important patterns:

- Probes TCP availability first and skips the whole suite with a warning when Redis is unreachable.
- Honors `REDIS_INTEGRATION_HOST`/`REDIS_INTEGRATION_PORT` overrides, defaulting to `127.0.0.1:6379` from `docker-compose.yml`.
- Uses unique, expiring keys and deletes them, leaving no state behind.
- Closes the client with `quit()` in `after`.

### `__tests__/testtransport.ts`

Shared test helper.

`TestTransport` extends `winston-transport` and records log payloads in memory:

- `logs`: regular log/debug/info payloads
- `errors`: error payloads

Use it when testing helper behavior that writes to the logger interface.

## Environment handling in tests

Tests that mutate `process.env` should:

1. Save the old environment before mutation.
2. Restore it in `afterEach`.
3. Set only the variables needed by the behavior under test.
4. Use dummy secret values such as `ABC` or `secret123`, never real secrets.

Example pattern:

```ts
const OLD_ENV_VARS = { ...process.env };

afterEach( () => {
	process.env = { ...OLD_ENV_VARS };
} );
```

Some tests also set `VIP_GO_APP_ID` after restoration to keep later tests in VIP-like mode.

## Mocking patterns

### Mock dynamic CommonJS imports

`newrelic` uses `require( 'newrelic' )`. Tests mock that import with `registerHooks` from `node:module`.

Use this pattern when the dependency may not be installed or should not execute real agent behavior.

### Mock `ioredis`

Redis tests use `mock.module( 'ioredis', ... )` from `node:test` to replace the constructor. This avoids real Redis connections and lets tests assert constructor options.

The test runner command includes `--experimental-test-module-mocks`; keep that flag while Redis tests depend on `mock.module`.

## Adding tests for new behavior

When adding or changing a helper:

1. Add tests in the matching `__tests__/unit/*.spec.ts` file (or `__tests__/integration/` for tests that need live services).
2. Use source-level imports from `../src/...`, not built `dist/` output.
3. Prefer explicit behavior assertions over snapshots.
4. Mock optional dependencies instead of adding service dependencies to the test environment.
5. Restore global state such as `process.env`, module hooks, and mocks.
6. Add type coverage through `npm run typecheck` when public types change.
7. Run `npm run build` when package exports or declaration output changes.

## Change-specific checklist

### Server changes

- Verify healthcheck behavior still returns `200` and `ok`.
- Verify healthcheck is not forwarded to custom handlers.
- Verify explicit `PORT` and default port behavior.
- Verify `close()` is safe after `listen()`.

### Logger changes

- Verify local and production formats.
- Verify label output remains stable for downstream log search.
- Verify custom labels and message formatting still work.
- Verify `silent` behavior and `VIP_GO_SILENCE_LOGS` behavior if touched.

### New Relic changes

- Verify local mode skip behavior.
- Verify missing env vars log errors and skip initialization.
- Verify valid config imports `newrelic`.
- Verify missing package throws only after config is valid.

### Redis changes

- Verify valid and invalid `REDIS_MASTER` parsing.
- Verify password handling.
- Verify constructor options passed to `ioredis`.
- Verify reconnect/offline queue behavior when changed.

### Package/export changes

- Run `npm run typecheck`.
- Run `npm run build`.
- Inspect `dist/src/index.d.ts` and exported type declarations.
- Smoke-test package root and `@automattic/vip-go/types` imports.

## Troubleshooting

### Tests hang or port is already in use

Check server tests that call `.listen()` with an explicit port. Ensure the server is closed in a `finally` block.

### New Relic tests fail unexpectedly

Check whether module hooks were deregistered or whether `process.env` was restored too early.

### Redis tests try to connect to a real server

Check whether `mock.module( 'ioredis', ... )` is active and whether the test command includes `--experimental-test-module-mocks`.

### Typecheck passes but build output is stale

Run:

```sh
npm run clean
npm run build
```

Then inspect `dist/` output before publishing.

## Related docs

- [Architecture](ARCHITECTURE.md)
- [Environment](ENVIRONMENT.md)
- [Root README](../README.md)
