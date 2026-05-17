interface LoggerLike {
	debug: ( message: string ) => void;
	error: ( message: string ) => void;
}

interface RedisConstructor {
	new ( options: redis.RedisOptions ): redis.RedisClient;
}

let redisClient: redis.RedisClient | null = null;

const getErrorMessage = ( error: unknown ): string => {
	if ( error instanceof Error ) {
		return error.message;
	}

	return String( error );
};

const getIORedis = (): RedisConstructor => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require( 'ioredis' ) as RedisConstructor;
	} catch ( error ) {
		throw new Error( `The 'ioredis' package could not be imported.
			Please make sure the package is installed and available.
			Details: ${ getErrorMessage( error ) }` );
	}
};

const retryStrategy = ( times: number ): number => {
	// Wait 2 seconds maximum before attempting reconnection
	return Math.min( times * 50, 2000 );
};

const getConnectionInfo = (): redis.ConnectionInfo => {
	const hostAndPort = process.env[ 'REDIS_MASTER' ] || '';
	const password = process.env[ 'REDIS_PASSWORD' ] || null;

	let host = null;
	let port = null;
	// Must be in the format `host:port`
	if ( hostAndPort && hostAndPort.match( /^[\w\-_.]+:\d+$/ ) ) {
		const splitted = hostAndPort.split( ':' );
		host = splitted[ 0 ] || null;
		port = splitted[ 1 ] || null;
	}

	return { host, port, password };
};

function redis( { logger = console }: redis.Options = {} ): redis.RedisClient | undefined {
	if ( redisClient ) {
		// Client already defined and initialized
		return redisClient;
	}

	const { host, port, password } = getConnectionInfo();

	if ( ! host || ! port ) {
		logger.error(
			`Couldn't get the host and port from the REDIS_MASTER environment variable. Please pass a valid REDIS_MASTER environment variable in the form of a host:port string`
		);
		return;
	}

	logger.debug( 'Initializing a new redis client...' );

	const IORedis = getIORedis();

	redisClient = new IORedis( {
		host,
		port,
		password,
		retryStrategy,
		enableOfflineQueue: true,
		maxRetriesPerRequest: process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ] || 3,
	} );
	const client = redisClient;

	// Attaching event listeners

	client.on( 'connect', () => {
		logger.debug( 'Connected to Redis client...' );
		client.enableOfflineQueue = true;
	} );

	client.on( 'reconnecting', () => {
		logger.debug( 'Attempting a reconnection to redis...' );

		if ( client.maxRetriesPerRequest ) {
			logger.error(
				`Max retries reached (max: ${ client.maxRetriesPerRequest }). Flushing all pending commands and disabling the offline queue...`
			);

			client.enableOfflineQueue = false;
		}
	} );

	client.on( 'error', error => {
		logger.error( `Error: ${ error?.message }. Complete error: ${ JSON.stringify( error ) }` );
	} );

	client.on( 'disconnect', () => {
		logger.debug( 'Disconnected from redis client' );
	} );

	return client;
}

namespace redis {
	export interface Options {
		logger?: LoggerLike;
	}

	export interface ConnectionInfo {
		host: string | null;
		password: string | null;
		port: string | null;
	}

	export interface RedisOptions {
		enableOfflineQueue: boolean;
		host: string;
		maxRetriesPerRequest: number | string;
		password: string | null;
		port: string;
		retryStrategy: ( times: number ) => number;
	}

	export interface RedisClient {
		enableOfflineQueue: boolean;
		maxRetriesPerRequest?: number | string | null;
		on: ( event: string, listener: ( error?: Error ) => void ) => void;
	}
}

redis.getConnectionInfo = getConnectionInfo;

export = redis;
