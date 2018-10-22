const { createLogger, format, transports } = require( 'winston' );
const { combine, timestamp, printf, splat } = format;

const appProcess = process.env.NODEJS_APP_PROCESS || 'master';

const isLocal = () => ! process.env.VIP_GO_APP_ID;

const createLogEntry = namespace => {
	return format( info => {
		const { level, message } = info;

		// Given a namespace like `my-app:module:sub-module`
		// `app` is `my-app`; `app_type` is `module:sub-module`
		const firstSeparator = namespace.indexOf( ':' );
		const output = {
			app: namespace.substring( 0, firstSeparator ),
			// eslint-disable-next-line camelcase
			app_type: namespace.substring( firstSeparator + 1, namespace.length ),
			// eslint-disable-next-line camelcase
			message_type: level,
			message: message,
			// eslint-disable-next-line camelcase
			app_process: appProcess,
		};

		// TODO: Add an error stack handler

		// If formatting is used and a custom object is provided, winston
		// will move the object to meta. Adding the info.meta helps flatten the object
		return Object.assign( info, output, info.meta );
	} );
};

// Logging format for local
const localLoggingFormat = printf( output => {
	const { timestamp: time, app, app_type: type, level, message } = output;
	return `${ time } ${ app }:${ type } [${ level }] ${ message }`;
} );

// Logging format for production
const prodLoggingFormat = printf( output => {
	const { timestamp: time, app, app_type: type } = output;

	// Can't include the timestamp in the JSON
	delete output.timestamp;

	return `${ time } ${ app }:${ type } ${ JSON.stringify( output ) }`;
} );

module.exports = ( namespace, { transport } = { } ) => {
	if ( ! namespace ) {
		throw Error( 'Please include a namespace to initialize your logger.' );
	}

	const consoleLogging = isLocal() ? localLoggingFormat : prodLoggingFormat;
	const level = isLocal() ? 'debug' : 'info';

	const formatLogEntry = createLogEntry( namespace );

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
		transports: [ transport || new transports.Console ],
		level,
	} );

	return winstonLogger;
};
