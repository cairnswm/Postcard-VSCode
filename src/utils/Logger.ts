export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3
}

export class Logger {
	private static currentLogLevel: LogLevel = LogLevel.INFO;
	private readonly context: string;

	constructor(context: string) {
		this.context = context;
	}

	/**
	 * Sets the global log level
	 * @param level The minimum log level to display
	 */
	public static setLogLevel(level: LogLevel): void {
		Logger.currentLogLevel = level;
	}

	/**
	 * Logs a debug message
	 * @param message The message to log
	 * @param data Optional additional data
	 */
	public debug(message: string, data?: any): void {
		this.log(LogLevel.DEBUG, message, data);
	}

	/**
	 * Logs an info message
	 * @param message The message to log
	 * @param data Optional additional data
	 */
	public info(message: string, data?: any): void {
		this.log(LogLevel.INFO, message, data);
	}

	/**
	 * Logs a warning message
	 * @param message The message to log
	 * @param data Optional additional data
	 */
	public warn(message: string, data?: any): void {
		this.log(LogLevel.WARN, message, data);
	}

	/**
	 * Logs an error message
	 * @param message The message to log
	 * @param data Optional additional data
	 */
	public error(message: string, data?: any): void {
		this.log(LogLevel.ERROR, message, data);
	}

	/**
	 * Internal logging method
	 * @param level The log level
	 * @param message The message to log
	 * @param data Optional additional data
	 */
	private log(level: LogLevel, message: string, data?: any): void {
		if (level < Logger.currentLogLevel) {
			return;
		}

		const timestamp = new Date().toISOString();
		const levelName = LogLevel[level];
		const prefix = `[${timestamp}] [${levelName}] [${this.context}]`;

		const logMessage = `${prefix} ${message}`;

		// Use appropriate console method based on level
		switch (level) {
			case LogLevel.DEBUG:
				console.debug(logMessage, data || '');
				break;
			case LogLevel.INFO:
				console.info(logMessage, data || '');
				break;
			case LogLevel.WARN:
				console.warn(logMessage, data || '');
				break;
			case LogLevel.ERROR:
				console.error(logMessage, data || '');
				break;
		}
	}

	/**
	 * Creates a logger instance for a specific context
	 * @param context The context name (usually class name)
	 * @returns Logger instance
	 */
	public static create(context: string): Logger {
		return new Logger(context);
	}
}