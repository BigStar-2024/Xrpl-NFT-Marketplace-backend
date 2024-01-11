const streams = require('../lib/streams');
const log = require('../lib/logger')({ name: 'exchangeRate.js ' });

module.exports = async (req, res) => {
    //log.info(`Get exchange rates`);
    try {
        const ledger_current = streams.getCurrentLedger();
        const exchange = streams.getCurrentExchangeRate();
        return res.status(200).send({
            result: 'success',
            USD: exchange.USD,
            EUR: exchange.EUR,
            JPY: exchange.JPY,
            CNY: exchange.CNY,
            ledger_current: ledger_current
        });
    } catch (error) {
        log.error(error);
        return res.status(error.code || 500).json({ message: error.message });
    }
};
