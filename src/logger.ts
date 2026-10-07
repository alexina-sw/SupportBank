import log4js from "log4js";

log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: 'logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug'}
    }
});

export const getLogger = (filename: string): log4js.Logger => log4js.getLogger(filename);
