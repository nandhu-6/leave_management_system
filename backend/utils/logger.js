const { createLogger, format, transports } = require('winston');

const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => {
       return `[${timestamp}] ${level.toUpperCase()}: ${message}` 
    })
);

const logger = createLogger({
    level : 'info',
    format : logFormat,
    transports : [
        new transports.Console(),
        new transports.File({ filename : '../src/logs/error.log', level : 'error' }),
        new transports.File({ filename : '../src/logs/combined.log' })
    ]

});

module.exports = logger;