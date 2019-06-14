/**
 * External dependencies
 */
const IORedis = require( 'ioredis' );

/**
 * Internal dependencies
 */
let { logger } = require( '../logger/index' );

//create a class in case we need to scale the connections
class Redis {
	constructor() {
		const [ host, port ] = ( process.env.REDIS_MASTER || '' ).split( ':' );

		this.client = new IORedis( {
			port,
			host,
			password: process.env.REDIS_PASSWORD,
			retryStrategy: this.reconnect.bind( this ),
			enableOfflineQueue: true,
			maxRetriesPerRequest: process.env.QUEUED_CONNECTION_ATTEMPTS || 3,
		}, { logger = console } = {} );

		this.connect();
		this.reconnectToClient();
	}

	// Wait 2 seconds maximum before attempting reconnection
	reconnect( times ) {
		const delay = Math.min( times * 50, 2000 );
		return delay;
	}

	// Connect to the Redis client
	connectToClient() {
		this.client.on( 'connect', () => {
			logger.info( 'Connected to Redis client' );
			this.client.enableOfflineQueue = true;
		} );
	}

	// Reconnect to client if connection is lost and handle offline queue limits
	reconnectToClient() {
		this.client.on( 'reconnecting', () => {
			logger.info( 'Redis is attempting to reconnect' );

			if ( this.client.maxRetriesPerRequest ) {
				logger.error( `Max retries reached (max: ${ this.client.maxRetriesPerRequest }). Flushing all pending commands and disabling the offline queue` );

				this.client.enableOfflineQueue = false;
			}
		} );
	}
}

module.exports = new Redis();
