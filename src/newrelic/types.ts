export interface LoggerLike {
	error: ( message: string ) => void;
	info: ( message: string ) => void;
	log: ( message: string ) => void;
}

export interface NewRelicOptions {
	logger?: LoggerLike;
}
