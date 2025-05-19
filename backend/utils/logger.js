const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '../src/logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => {
       return `[${timestamp}] ${level.toUpperCase()}: ${message}` 
    })
);

const logger = createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new transports.Console(),
        new transports.File({ 
            filename: path.join(logDir, 'error.log'), 
            level: 'error' 
        }),
        new transports.File({ 
            filename: path.join(logDir, 'combined.log') 
        })
    ]
});

module.exports = logger;