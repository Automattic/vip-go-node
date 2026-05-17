import Transport from 'winston-transport';

export class TestTransport< LogItem = unknown > extends Transport {
	public logs: LogItem[] = [];
	public errors: LogItem[] = [];

	public log( info: LogItem, callback?: () => void ): void {
		this.logs.push( info );
		callback?.();
	}

	public info( info: LogItem ): void {
		this.logs.push( info );
	}

	public debug( info: LogItem ): void {
		this.logs.push( info );
	}

	public error( info: LogItem ): void {
		this.errors.push( info );
	}
}
