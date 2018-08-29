# VIP Go New Relic integration

## Initialization
In order to use the New Relic integration, you need to call it before starting your application (preferably the first line of your main `app.js` or `index.js`). New Relic needs to bootstrap itself before your application in order to work properly.

To initialize the integration:
``` js
const { newrelic } = require( '@automattic/vip-go' );
newrelic();
```

This will automatically grab information from your environment on VIP Go and bootup New Relic.

By default, this module logs to the console. If you want to pass your own logger, please do as follow:
``` js
const { newrelic } = require( '@automattic/vip-go' );
newrelic( { logger: yourLogger } );
```
