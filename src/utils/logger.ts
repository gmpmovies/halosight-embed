export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
    private static _instance: Logger;
    private static _debug: boolean = false; // Make this static so it's shared across all references

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }

    public setDebug(debug: boolean): void {
        Logger._debug = debug; // Set the static property
    }

    public getDebug(): boolean {
        return Logger._debug;
    }

    public debug(message: string, ...args: any[]): void {
        if (Logger._debug) {
            console.log(`[Halosight] ${message}`, ...args);
        }
    }

    public info(message: string, ...args: any[]): void {
        if (Logger._debug) {
            console.info(`[Halosight] ${message}`, ...args);
        }
    }

    public warn(message: string, ...args: any[]): void {
        if (Logger._debug) {
            console.warn(`[Halosight] ${message}`, ...args);
        }
    }

    public error(message: string, ...args: any[]): void {
        // Always log errors regardless of debug mode
        console.error(`[Halosight] ${message}`, ...args);
    }

    public log(level: LogLevel, message: string, ...args: any[]): void {
        switch (level) {
            case 'debug':
                this.debug(message, ...args);
                break;
            case 'info':
                this.info(message, ...args);
                break;
            case 'warn':
                this.warn(message, ...args);
                break;
            case 'error':
                this.error(message, ...args);
                break;
        }
    }
}

// Create a convenient Log object that can be used directly
export const Log = {
    debug: (message: string, ...args: any[]) => Logger.getInstance().debug(message, ...args),
    info: (message: string, ...args: any[]) => Logger.getInstance().info(message, ...args),
    warn: (message: string, ...args: any[]) => Logger.getInstance().warn(message, ...args),
    error: (message: string, ...args: any[]) => Logger.getInstance().error(message, ...args),
};

// Create a separate function for the default export
function LogFunction(level: LogLevel, message: string, ...args: any[]): void {
    Logger.getInstance().log(level, message, ...args);
}

// Export the function as default separately
export default LogFunction;
