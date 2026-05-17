export interface LoggerLike {
	debug: ( message: string ) => void;
	error: ( message: string ) => void;
}

export interface Options {
	logger?: LoggerLike;
}

export interface ConnectionInfo {
	host: string | null;
	password: string | null;
	port: string | null;
}

export interface RedisOptions {
	enableOfflineQueue: boolean;
	host: string;
	maxRetriesPerRequest: number | string;
	password: string | null;
	port: string;
	retryStrategy: ( times: number ) => number;
}

export interface RedisClient {
	enableOfflineQueue: boolean;
	maxRetriesPerRequest?: number | string | null;
	on: ( event: string, listener: ( error?: Error ) => void ) => void;
}
