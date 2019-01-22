# VIP Go Logger

## Initialization
In order to use a VIP Go logger, you need to initialize it with a namespace. The namespace is used in error messages and help filters errors in other tools like Kibana.

To initialize a logger:
``` js
const { logger } = require( '@automattic/vip-go' );
const log = logger( 'application:application_type' );
```

You can start logging now by simply using:
``` js
log.info( 'This is a log from my application' );
```

## Uncaught Exceptions

We recommand you add an `uncaughtException` logger with a unique namespace so you can filter exceptions easily afterwards:

``` js
const { logger } = require( '@automattic/vip-go' );
const log = logger( 'my-application:uncaughtException' );

process.on( 'uncaughtException', err => {
	log.error( `Uncaught exception: ${ err }` );
} );
```

## Logging levels
This logger is based on `winston`, so expect to find all [logging levels](https://github.com/winstonjs/winston#logging-levels) provided by it. This means: `debug`, `info`, `notice`, `warning`, `error`, `crit`, `alert` and `emerg` can all be used.

``` js
log.info( 'This is a log from my application' );
log.debug( 'This is a log from my application' );
log.error( 'This is a log from my application' );
// etc
```

## Formatting messages
This logger supports formatting messages by default. You can use it as follows:
``` js
log.error( 'Can not open file: %s, please verify it is in the %s directory', 'logs.txt', '/home/src/' );
// => Can not open file logs.txt, please verify it is in the /home/src/ directory
```

## Logs format
This logger is configured to display your logs differently depending on the environment. For local development, the logs will look like:
``` js
log.info( 'This is a log from my application' );
// => The format is: <timestamp> <namespace> [level] message
// => 2018-08-03T09:54:07.013Z application:application_type [info] This is a log from my application
```
For production, more information are logged:
```
log.info( 'This is a log from my application' );
// => The format is: <timestamp> <namespace> JSON
// => 2018-08-03T09:54:07.013Z application:application_type {"message":"This is a log from my application","level":"info","timestamp":"2018-08-03T09:54:07.013Z","app":"application","app_type":":application_type" // etc // }
```
## Custom metrics
If your application needs more metrics, or need to export more information in the final JSON, you can add your own information object like the following:
``` js
log.info( 'This is a log from my application', { 'my_label': 'my_value' } );
```
Please note that this can be used with other properties like formatting:
``` js
log.info( 'This is a log from my sub application: %s', 'sub_application', { 'my_label': 'my_value' } );
```

## Advanced configuration
All this advanced configuration is per-logger basis. If you want to apply a configuration for all your loggers, please wrap the library and include your general configuration. Here is an example on how to silence logging when running tests:

``` js
// your ./logger.js file
const { logger } = require( '@automattic/vip-go' );
const isTests = process.env.NODE_ENV === 'test';

export default ( namespace ) => {
	return logger( namespace, { silent: isTests } );
};
```

### Custom transport
By default, the logs are sent to the console. If you want use a file, a third party logging service, etc. Please pass a `transport` option as follow:

``` js
const { logger } = require( '@automattic/vip-go' );
const log = logger( 'myapplication:namespace', {
	transport: myTransport
} );
```

### Cluster logging
By default, we support cluster logging from different workers and we use the default `cluster` library in Node. If you want to change this behaviour, please pass your library in the `cluster` option as follow:

``` js
const { logger } = require( '@automattic/vip-go' );
const log = logger( 'myapplication:namespace', {
	cluster: myCluster
} );
```

### Silent logging
If you want to silence the events from a logger, please use a `silent` option as follow:

``` js
const { logger } = require( '@automattic/vip-go' );
const log = logger( 'myapplication:namespace', {
	silent: true
} );
```
