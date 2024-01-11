require('dotenv').config();
const { performance } = require('perf_hooks');
const log = require('../lib/logger')({ name: 'exchanges.js ' });
const db = require('../lib/db');

module.exports = async (req, res) => {
    try {
        log.info(`Getting status`);

        var startTime = performance.now()

        // https://ws.xrpl.to/api/status
        const pipeline = [
            {
                $facet: {
                    total: [{ $count: "count" }],
                    empty: [{$match:{URI: { $in: [ null, "" ] }}}, { $count: "count" }]
                }
            }
        ];

        const aggCursor = db.getDB().collection("nfts").aggregate(pipeline);
        let total = 0;
        let empty = 0;
        await aggCursor.forEach(data => {
            /*total: [
                {
                  "count": 70445
                }
            ]
            empty: [
                {
                    "count": 10721
                }
            ]*/
            total = data.total[0].count;
            empty = data.empty[0].count;
        });

        var endTime = performance.now()
        var took = endTime - startTime;

        const ret = {
            result: 'success',
            took: `${took.toFixed(2)}ms`,
            total,
            empty
        };

        return res.status(200).send(ret);

        /*db.getDB().collection("trade")
        .find({md5}).sort({time : -1}).skip(page * limit).limit(limit)
        .toArray(function (err, result) {
            let exchs = [];
            if (err) {
                log.error(err);
            } else {
                exchs = result;
            }
            var endTime = performance.now()
            var took = endTime - startTime;

            return res.status(200).send({
                result: 'success',
                took: `${took.toFixed(2)}ms`,
                exchs,
            });
        });*/
    } catch (error) {
        log.error(error);
        return res.status(error.code || 500).json({ message: error.message });
    }
};
