import type { IncomingMessage, Server, ServerResponse } from 'node:http';

export type RequestHandler = ( req: IncomingMessage, res: ServerResponse ) => unknown;

export interface LoggerLike {
	info: ( message: string ) => void;
}

export interface GoServerOptions {
	PORT?: number | string;
	logger?: LoggerLike;
}

export interface WrappedApplication {
	app: Server;
	server: Server | undefined;
	listen: ( connected?: () => void ) => void;
	close: () => void;
}
