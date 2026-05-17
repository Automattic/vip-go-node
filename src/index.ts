import logger from './logger';
import newrelic from './newrelic';
import redis from './redis';
import server from './server';

interface VipGo {
	logger: typeof logger;
	server: typeof server;
	newrelic: typeof newrelic;
	redis: typeof redis;
}

const vipGo: VipGo = {
	logger,
	server,
	newrelic,
	redis,
};

export = vipGo;
