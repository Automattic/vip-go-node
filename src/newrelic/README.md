# VIP Go New Relic integration

## Initialization
New Relic's package (`newrelic`) is a peer dependency of this module. This means, in order to use it, you need to install it manually. This ensures we're not obliging you to use a specific version, but will use whatever version you're using already.

If you don't have the New Relic package installed, you can run the following:

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
