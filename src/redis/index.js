/**
 * External dependencies
 */
const IORedis = require( 'ioredis' );

/**
 * Internal dependencies
 */
const { logger } = require( '../logger/index' );

//allow clients to set # of queues or default to 3
const QUEUED_CONNECTION_ATTEMPTS = process.env.QUEUED_CONNECTION_ATTEMPTS || 3;

//create a class in case we need to scale the connections
class Redis {
	constructor() {
		const [ host, port ] = ( process.env.REDIS_MASTER || '' ).split( ':' );

		this.client = new IORedis( {
			port,
			host,
			password: process.env.REDIS_PASSWORD,
			retryStrategy: this.retry.bind( this ),
			enableOfflineQueue: true,
		} );

		this.handleEvents();
	}

	retry( times ) {
		return Math.min( times * 250 * 1.6, 5000 );
	}

	//handle offline queue limits
	handleEvents() {
		this.client.on( 'reconnecting', info => {
			logger.info( 'Redis is attempting to reconnect' );
			if ( QUEUED_CONNECTION_ATTEMPTS === ( info.attempt + 1 ) ) {
				logger.warn( 'There is a problem with the Redis server- disabling offline Redis queue and calling client.flush_and_error()' );

				this.client.enableOfflineQueue = false;

				// Return an error callback to any commands that were previously queued (but only once)
				// This is kinda hacky as node_redis doesn't expose a way to flush the queue
				// only, so this will emit an error event
				this.client.flush_and_error( {
					message: `Max of ${ QUEUED_CONNECTION_ATTEMPTS } Redis connection attempts reached - flushing queued requests.`,
					code: 'QUEUED_CONNECTION_ATTEMPTS',
				} );
			}
		} );
	}
}

module.exports = new Redis();
