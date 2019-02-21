# VIP Go New Relic integration

## Initialization
New Relic is no longer a peer dependency for this module. If your app requires New Relic, you can run the following command to install the `newrelic` package:

```
npm install --save newrelic@^4.8.0
```

Once installed, you need to call our `newrelic` module before starting your application (preferably the first line of your main `app.js` or `index.js`). New Relic needs to bootstrap itself before your application in order to work properly.

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
