# VIP Go Logger

## Initialization
In order to use a VIP Go logger, you need to initialize it with a namespace. The namespace is used in error messages and help filters errors in other tools like Kibana.

To initialize a logger:
``` js
const { logger } = require('vip-go-node');
const log = logger( 'application:application_type' );
```
You can start logging now by simply using:
``` js
log.info( 'This is a log from my application' );
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
