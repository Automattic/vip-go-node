import logger from './logger';
import newrelic from './newrelic';
import redis from './redis';
import server from './server';

const vipGo = {
	logger,
	server,
	newrelic,
	redis,
};

export = vipGo;
