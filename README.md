# VIP Go Node Helpers

This package provides modules to help run Node.js applications on VIP Go.

## Install

```
npm install --save @automattic/vip-go
```

## Modules

The following is a list of modules included in this package:

+ [server](https://github.com/Automattic/vip-go-node/tree/trunk/src/server): a server that wraps your request handler or `express` app behind an easy to use interface
+ [logger](https://github.com/Automattic/vip-go-node/tree/trunk/src/logger): a ready to use logger for your node applications with Kibana integration out of the box
+ [newrelic](https://github.com/Automattic/vip-go-node/tree/trunk/src/newrelic): New Relic integration for applications on VIP Go
+ [redis](https://github.com/Automattic/vip-go-node/tree/trunk/src/redis): a helper library to instantiate a Redis client compatible with VIP Go

## Usage

``` js
const { server, logger, newrelic, redis } = require( '@automattic/vip-go' );
```

Please refer the documentation for each module ([`server`](https://github.com/Automattic/vip-go-node/blob/trunk/src/server/README.md) | [`logger`](https://github.com/Automattic/vip-go-node/blob/trunk/src/logger/README.md) | [`newrelic`](https://github.com/Automattic/vip-go-node/blob/trunk/src/newrelic/README.md)) | [redis](https://github.com/Automattic/vip-go-node/tree/trunk/src/redis)) to learn more about how to use it.

New Relic is no longer a peer dependency of this module. Please remember to install [New Relic](https://docs.newrelic.com/docs/agents/manage-apm-agents/installation/install-agent) separately if your app requires it.

## Development

### Using hooks

For development, we have some hooks running before each commit/push. To use them, execute the following command inside the repo after cloning it:

```
git config core.hooksPath hooks
```

### Running tests

To run tests locally, make sure the Docker container is up and running:

```
docker-compose up
```
test
