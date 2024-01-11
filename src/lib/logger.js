const bunyan = require('bunyan');

/*const logger = bunyan.createLogger({
    name: ' ',
    streams: [{
        path: '../LedgerScanner.log',
        //path: '/var/log/foo.log',
        // `type: 'file'` is implied
    }]
});*/

const logger = bunyan.createLogger({
    name: ' ',
    streams: [{
        type: 'rotating-file',
        path: '../log/backend.log',
        period: '1d',   // daily rotation
        count: 15        // keep 15 back copies
    },
    {
        level: 'trace',
        stream: process.stdout
    }]
});

module.exports = options => {
    return {
        info: (...args) => {
            logger.info(...args);
        },
        warn: (...args) => {
            logger.warn(...args);
        },
        error: (...args) => {
            logger.error(...args);
        },
        debug: (...args) => {
            logger.debug(...args);
      },
    };
};
