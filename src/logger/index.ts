import nodeCluster from 'node:cluster';
import { createLogger, format, transports, type Logger } from 'winston';

import type { ClusterLike, LoggerOptions } from './types';
import type { TransformableInfo } from 'logform';

const { combine, timestamp, printf, splat } = format;

const appProcess = process.env[ 'NODEJS_APP_PROCESS' ] || 'master';

// Allow globally silencing logs by setting the env var to 1.
// Defaults to not silent.
const DEFAULT_SILENCE_LOGS = Boolean(
	process.env[ 'VIP_GO_SILENCE_LOGS' ] && '1' === process.env[ 'VIP_GO_SILENCE_LOGS' ]
);

interface LogEntry extends TransformableInfo {
	app?: unknown;
	app_type?: unknown;
	meta?: Record< string, unknown >;
	timestamp?: unknown;
}

const isLocal = () => ! process.env[ 'VIP_GO_APP_ID' ];

const createLogEntry = ( namespace: string, cluster: ClusterLike ) => {
	return format( ( info: TransformableInfo ) => {
		const { level, message } = info;

		// Given a namespace like `my-app:module:sub-module`
		// `app` is `my-app`; `app_type` is `module:sub-module`
		const firstSeparator = namespace.indexOf( ':' );

		// Add app worker info for cluster support
		let appWorker = 'none';

		if ( cluster.isMaster ) {
			appWorker = 'master';
		} else if ( cluster.isWorker && cluster.worker ) {
			appWorker = `worker_${ cluster.worker.id }`;
		}

		const output = {
			app: namespace.substring( 0, firstSeparator ),
			app_type: namespace.substring( firstSeparator + 1, namespace.length ),
			message_type: level,
			message,
			app_process: appProcess,
			app_worker: appWorker,
		};

		// TODO: Add an error stack handler

		// If formatting is used and a custom object is provided, winston
		// will move the object to meta. Adding the info.meta helps flatten the object
		return Object.assign( info, output, ( info as LogEntry ).meta );
	} );
};

// Logging format for local
const localLoggingFormat = printf( output => {
	const { timestamp: time, app, app_type: type, level, message } = output as LogEntry;
	return `${ String( time ) } ${ String( app ) }:${ String( type ) } [${ level }] ${ String(
		message
	) }`;
} );

// Logging format for production
const prodLoggingFormat = printf( output => {
	const logOutput = output as LogEntry;
	const { app, app_type: type } = logOutput;

	// Can't include the timestamp in the JSON
	delete logOutput.timestamp;

	return `${ String( app ) }:${ String( type ) } ${ JSON.stringify( logOutput ) }`;
} );

function createGoLogger(
	namespace: string,
	{ transport, cluster, silent = DEFAULT_SILENCE_LOGS }: LoggerOptions = {}
): Logger {
	if ( ! namespace ) {
		throw Error( 'Please include a namespace to initialize your logger.' );
	}

	const consoleLogging = isLocal() ? localLoggingFormat : prodLoggingFormat;
	const level = isLocal() ? 'debug' : 'info';

	const formatLogEntry = createLogEntry( namespace, cluster || nodeCluster );

	const winstonLogger = createLogger( {
		format: combine(
			// Format log messages
			splat(),
			// Add a timestamp to each log
			timestamp( { format: () => new Date().toUTCString() } ),
			// Add necessary labels to JSON log
			formatLogEntry(),
			// Log to console depending on environment
			consoleLogging
		),
		// Allow the user to define a transport (used for tests too)
		transports: [ transport || new transports.Console() ],
		level,
		silent,
	} );

	return winstonLogger;
}

export = createGoLogger;
