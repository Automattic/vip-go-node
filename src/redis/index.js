/**
 * External dependencies
 */
const redis = require( 'ioredis' );
const { logger } = require( '../logger/index' );

//allow clients to set # of queues or default to 3
const MAX_CONNECTION_RETRIES_FOR_OFFLINE_QUEUE = process.env.MAX_CONNECTIONS_OFFLINE_QUEUE || 3;
