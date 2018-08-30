# VIP Go Node Helpers

This package provides modules to help run Node.js applications on VIP Go.

## Modules

The following is a list of modules included in this package:

+ [server](https://github.com/Automattic/vip-go-node/tree/master/src/server): a server that wraps your request handler or `express` app behind an easy to use interface
+ [logger](https://github.com/Automattic/vip-go-node/tree/master/src/logger): a ready to use logger for your node applications with Kibana integration out of the box

## Usage

``` js
const { server, logger } = require( '@automattic/vip-go' );
```

Please refer the documentation for each module ([`server`](https://github.com/Automattic/vip-go-node/blob/master/src/server/README.md) | [`logger`](https://github.com/Automattic/vip-go-node/blob/master/src/logger/README.md)) to learn more about how to use it.

## Development

### Using hooks

For development, we have some hooks running before each commit/push. To use them, execute the following command inside the repo after cloning it:

```
git config core.hooksPath hooks
```
