export type { Redis as RedisClient, RedisOptions } from 'ioredis';

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
