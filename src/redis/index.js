/**
 * External dependencies
 */
const IORedis = require( 'ioredis' );

let logger = console;

// Create a class in case we need to scale the connections
class Redis {
	constructor() {
		if ( ! process.env.REDIS_MASTER ) {
			logger.warn( 'Missing host and port of Redis server' );
		} else {
			const [ host, port ] = ( process.env.REDIS_MASTER ).split( ':' );

			this.client = new IORedis( {
				port,
				host,
				password: process.env.REDIS_PASSWORD,
				retryStrategy: this.reconnect.bind( this ),
				enableOfflineQueue: true,
				maxRetriesPerRequest: process.env.QUEUED_CONNECTION_ATTEMPTS || 3,
			} );

			this.connectToClient();
			this.reconnectToClient();
			this.onError();
			this.disconnect();

			return this.client;
		}
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
				logger.error( 'Max retries reached (max:' + this.client.maxRetriesPerRequest + '). Flushing all pending commands and disabling the offline queue' );

				this.client.enableOfflineQueue = false;
			}
		} );
	}

	// If an error occurs, log the error and expose the error returned from the Redis server
	onError() {
		this.client.on( 'error', error => {
			logger.error( 'Error: ' + error.message + ': ' + JSON.stringify( error ) );
			error instanceof IORedis.ReplyError;
		} );
	}

	// Disconnect from Redis
	disconnect() {
		this.client.on( 'disconnect', () => {
			logger.info( 'Disconnected from Redis client' );
		} );
	}
}

module.exports = new Redis( { logger = console } = {} );
