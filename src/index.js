//require('dotenv').config();
const app = require('./app');

const log = require('./lib/logger')();

const alldata = require('./lib/alldata');

const PORT = process.env.PORT || 80;

const start = async () => {
    app.listen(PORT, () => {
        /* eslint-disable no-console */
        log.info(`Listening: http://localhost:${PORT}`);
        /* eslint-enable no-console */
    });

    await alldata.init();
}

// Run the server!
start();