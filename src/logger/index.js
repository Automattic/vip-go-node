const { createLogger, format, transports } = require( 'winston' );
const { combine, timestamp, printf, splat } = format;

const appProcess = process.env.NODEJS_APP_PROCESS || 'master';

const isDevelopment = () => {
	const env = process.env;
	return ! env.VIP_GO_APP_ID && ! env.IS_VIP_GO_ENV && env.NODE_ENV !== 'production';
};

const createLogEntry = ( namespace ) => {
	return format( ( info ) => {
		const { level, message } = info;

		const firstSeparator = namespace.indexOf( ':' );
		const output = {
			app: namespace.substring( 0, firstSeparator ),
			// eslint-disable-next-line camelcase
			app_type: namespace.substring( firstSeparator, namespace.length ),
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
	return `${ time } ${ app }${ type } [${ level }] ${ message }`;
} );

// Logging format for production
const prodLoggingFormat = printf( output => {
	const { timestamp: time, app, app_type: type } = output;
	return `${ time } ${ app }${ type } ${ JSON.stringify( output ) }`;
} );

module.exports = ( namespace, { transport } = { } ) => {
	if ( ! namespace ) {
		throw Error( 'Please include a namespace to initialize your logger.' );
	}

	const consoleLogging = isDevelopment() ? localLoggingFormat : prodLoggingFormat;

	const formatLogEntry = createLogEntry( namespace );

	const winstonLogger = createLogger( {
		format: combine(
			// Format log messages
			splat(),
			// Add a timestamp to each log
			timestamp(),
			// Add necessary labels to JSON log
			formatLogEntry(),
			// Log to console depending on environment
			consoleLogging
		),
		// Allow the user to define a transport (used for tests too)
		transports: [ transport || new transports.Console ],
	} );

	return winstonLogger;
};
