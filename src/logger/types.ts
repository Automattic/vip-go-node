import type TransportStream from 'winston-transport';

export interface ClusterLike {
	isMaster?: boolean;
	isWorker?: boolean;
	worker?: {
		id: number | string;
	};
}

export interface LoggerOptions {
	transport?: TransportStream;
	cluster?: ClusterLike;
	silent?: boolean;
}
