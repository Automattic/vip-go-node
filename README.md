# VIP Go Node Helpers

This package provides modules to help run Node.js applications on VIP Go.

## Install

```
npm install --save @automattic/vip-go
```

## Modules

The following is a list of modules included in this package:

- [server](https://github.com/Automattic/vip-go-node/tree/trunk/src/server): a server that wraps your request handler or `express` app behind an easy to use interface
- [logger](https://github.com/Automattic/vip-go-node/tree/trunk/src/logger): a ready to use logger for your node applications with Kibana integration out of the box
- [newrelic](https://github.com/Automattic/vip-go-node/tree/trunk/src/newrelic): New Relic integration for applications on VIP Go
- [redis](https://github.com/Automattic/vip-go-node/tree/trunk/src/redis): a helper library to instantiate a Redis client compatible with VIP Go

## Usage

```js
const { server, logger, newrelic, redis } = require( '@automattic/vip-go' );
```

TypeScript consumers can import public helper types from the package subpath:

```ts
import type { RedisOptions } from '@automattic/vip-go/types';
```

Please refer the documentation for each module ([`server`](https://github.com/Automattic/vip-go-node/blob/trunk/src/server/README.md) | [`logger`](https://github.com/Automattic/vip-go-node/blob/trunk/src/logger/README.md) | [`newrelic`](https://github.com/Automattic/vip-go-node/blob/trunk/src/newrelic/README.md) | [`redis`](https://github.com/Automattic/vip-go-node/tree/trunk/src/redis)) to learn more about how to use it.

New Relic is no longer a peer dependency of this module. Please remember to install [New Relic](https://docs.newrelic.com/docs/agents/manage-apm-agents/installation/install-agent) separately if your app requires it.

## Reference docs

- [Architecture](docs/ARCHITECTURE.md)
- [Environment](docs/ENVIRONMENT.md)
- [Testing](docs/TESTING.md)

## Development

### Using hooks

For development, we have some hooks running before each commit/push. To use them, execute the following command inside the repo after cloning it:

```
git config core.hooksPath hooks
```

### Running tests

Unit tests can run locally without Docker because test dependencies are mocked.

Start Docker services only when working on local or integration scenarios that require Redis:

```
docker-compose up
```

Build the TypeScript sources before using the CommonJS compatibility wrappers:

```
npm run build
```

Run strict type checking for both the library and tests:

```
npm run typecheck
```

Run the TypeScript test suite directly with Node's test runner:

```
npm run cmd:test
```

The full test command runs linting, type checking, and the test suite:

```
npm test
```
