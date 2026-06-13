import type { ConnectionInfo, Options } from './types';
import type { Redis } from 'ioredis';

let redisClient: Redis | null = null;

const getErrorMessage = ( error: unknown ): string => {
	if ( error instanceof Error ) {
		return error.message;
	}

	return String( error );
};

const getIORedis = (): typeof Redis => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { Redis } = require( 'ioredis' ) as typeof import('ioredis');
		return Redis;
	} catch ( error ) {
		throw new Error( `The 'ioredis' package could not be imported.
			Please make sure the package is installed and available.
			Details: ${ getErrorMessage( error ) }` );
	}
};

const getQueuedConnectionAttempts = (): number => {
	const DEFAULT_QUEUED_CONNECTION_ATTEMPTS = 3;
	const rawValue = process.env[ 'QUEUED_CONNECTION_ATTEMPTS' ];

	// Only accept strictly positive integers; anything else falls back to the default.
	if ( ! rawValue || ! /^\d+$/.test( rawValue ) ) {
		return DEFAULT_QUEUED_CONNECTION_ATTEMPTS;
	}

	const queuedConnectionAttempts = Number( rawValue );

	return Number.isSafeInteger( queuedConnectionAttempts ) && queuedConnectionAttempts >= 1
		? queuedConnectionAttempts
		: DEFAULT_QUEUED_CONNECTION_ATTEMPTS;
};

const getConnectionInfo = (): ConnectionInfo => {
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

function redis( { logger = console }: Options = {} ): Redis | undefined {
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
	const maxRetriesPerRequest = getQueuedConnectionAttempts();

	// Assigned right after the IORedis constructor below; declared first so the
	// retryStrategy closure never hits a temporal dead zone if invoked synchronously.
	let clientRef: Redis | null = null;

	const retryStrategy = ( times: number ): number => {
		// Only log and disable the queue once per outage (while the queue is still enabled),
		// instead of on every subsequent retry.
		if ( clientRef && times >= maxRetriesPerRequest && clientRef.options.enableOfflineQueue ) {
			logger.error(
				`Max connection retries reached (max: ${ maxRetriesPerRequest }). Disabling the offline queue; new commands will be rejected until the connection is reestablished.`
			);

			// ioredis flushes already-queued commands on its own; additionally reject any
			// new commands instead of queueing them indefinitely.
			clientRef.options.enableOfflineQueue = false;
		}

		// Wait 2 seconds maximum before attempting reconnection
		return Math.min( times * 50, 2000 );
	};

	const client = new IORedis( {
		host,
		port: Number( port ),
		password: password ?? undefined,
		retryStrategy,
		enableOfflineQueue: true,
		maxRetriesPerRequest,
	} );
	clientRef = client;
	redisClient = client;

	// Attaching event listeners

	client.on( 'connect', () => {
		logger.debug( 'Connected to Redis client...' );
	} );

	client.on( 'ready', () => {
		logger.debug( 'Redis connection ready...' );
		// Restore offline queueing only once the connection is fully ready; ioredis
		// resets its retry counter on 'ready', not on 'connect'.
		client.options.enableOfflineQueue = true;
	} );

	client.on( 'reconnecting', () => {
		logger.debug( 'Attempting a reconnection to redis...' );
	} );

	client.on( 'error', error => {
		logger.error( `Error: ${ error?.message }. Complete error: ${ JSON.stringify( error ) }` );
	} );

	client.on( 'close', () => {
		logger.debug( 'Redis connection closed' );
	} );

	client.on( 'end', () => {
		logger.debug( 'Disconnected from redis client' );
	} );

	return client;
}

const redisWithHelpers = Object.assign( redis, {
	getConnectionInfo,
} );

export = redisWithHelpers;
