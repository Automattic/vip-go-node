/**
 * External dependencies
 */
const redis = require( 'ioredis' );
const { logger } = require( '../logger/index' );
log

//create a class in case we need to scale the connections
class Redis {
	constructor() {
		const [ host, port ] = ( process.env.REDIS_MASTER || '' ).split( ':' );

		this.client = new Redis( {
			port,
			host,
			password: process.env.REDIS_PASSWORD,
			retryStrategy: this.retry.bind( this ),
			maxRetriesPerRequest: process.env.REDIS_MAX_RETRIES,
		} );

		this.handleEvents();
	}

	retry( attempts ) {
		return Math.min( attempts * 250 * 1.6, 5000 );
	}

module.exports = new Redis();
