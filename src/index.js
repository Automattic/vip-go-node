const logger = require( './logger/' );
const server = require( './server/' );
const newrelic = require( './newrelic/' );
const redis = require( './redis/' );

module.exports = {
	logger,
	server,
	newrelic,
	redis,
};
