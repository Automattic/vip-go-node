/**
 * External dependencies
 */
const IORedis = require( 'ioredis' );

let redisClient = null;

const retryStrategy = times => {
	// Wait 2 seconds maximum before attempting reconnection
	return Math.min( times * 50, 2000 );
}

module.exports = ( { logger = console } = {} ) => {
	if( redisClient ) {
		// Client already defined and initialized
		return redisClient;
	}

	const redisMasterIP = process.env.REDIS_MASTER;

	if ( ! redisMasterIP ) {
		logger.error( `Missing REDIS_MASTER environment variable. Please provide a 
			REDIS_MASTER environment variable in the form of a host:port string.` );
		return;
	}

	const [ host, port ] = redisMasterIP.split( ':' );

	if ( ! host || ! port ) {
		logger.error( `Couldn't get the host and port from the REDIS_MASTER 
			environment variable. Please pass a valid REDIS_MASTER environment variable 
			in the form of a host:port string` );
		return;
	}

	logger.info( 'Initializing a new redis client...' );

	redisClient = new IORedis( {
		host,
		port,
		password: process.env.REDIS_PASSWORD,
		retryStrategy: retryStrategy,
		enableOfflineQueue: true,
		maxRetriesPerRequest: process.env.QUEUED_CONNECTION_ATTEMPTS || 3,
	} );

	// Attaching event listeners

	redisClient.on( 'connect', () => {
		logger.info( 'Connected to Redis client...' );
		redisClient.enableOfflineQueue = true;
	} );

	redisClient.on( 'reconnecting', () => {
		logger.info( 'Attempting a reconnection to redis...' );

		if ( redisClient.maxRetriesPerRequest ) {
			logger.error( `Max retries reached (max: ${ redisClient.maxRetriesPerRequest }). 
				Flushing all pending commands and disabling the offline queue...` );

			redisClient.enableOfflineQueue = false;
		}
	} );

	redisClient.on( 'error', error => {
		logger.error( `Error: ${ error.message }. Complete error: ${ JSON.stringify( error ) }` );
	} );

	redisClient.on( 'disconnect', () => {
		logger.info( 'Disconnected from redis client' );
	} );

	return redisClient;
}