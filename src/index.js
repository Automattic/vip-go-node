const logger = require( './logger/' );
const server = require( './server/' );
const newrelic = require( './newrelic/' );

module.exports = {
	logger,
	server,
    newrelic,
};
