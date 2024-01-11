require('dotenv').config();
const log = require('../lib/logger')({ name: 'nfts.js ' });

const alldata = require('../lib/alldata');
const { performance } = require('perf_hooks');
const db = require('../lib/db');
let count_api = 0;

module.exports = async (req, res) => {
    count_api++;

    let page = 0;
    let limit = 10;
    let flag = 0;
    let self = true;

    try {
        page = Number(req.query.page);
        limit = Number(req.query.limit);
        flag = Number(req.query.flag);
        self = req.query.self === 'true';

        if (page < 0) page = 0;
        if (limit > 1000) limit = 1000;
    } catch (err) {
        page = 0;
        limit = 10;
        flag = 0;
        self = true;
    }
    
    try {
        log.info(`Getting nfts with page=${page}&limit=${limit}&flag=${flag}&self=${self}`);
        
        // https://ws.xrpnft.com/api/nfts?page=0&limit=20&flag=0&self=true

        //const nfts = alldata.getNfts(page, limit, flag, self);
        // { _id: ObjectId('624eb4c646b45a10d86bf930') };
        // let query = {uri: { $nin: [ null, "" ]} };
        // let query = {pURI: { $nin: [ null, "" ]} }; 
        let query = {parse: true};
        var startTime = performance.now();

        if (self)
            query.self = true;

        if (flag)
            query.Flags = { $bitsAllSet: flag };

        db.getDB().collection("nfts")
        .find(query).skip(page * limit).limit(limit)
        .toArray(function (err, result) {
            if (err) {
                log.error(err);
            } else {
                //log.info(result);
                var endTime = performance.now();

                return res.status(200).send({
                    result: 'success',
                    count_api: count_api,
                    page,
                    limit,
                    flag,
                    self,
                    //nft_count: transformedNfts.length,
                    //self_nft_count: transformedSelfNfts.length,
                    query_time: `${(endTime - startTime).toFixed(2)} ms`,
                    nfts: result
                });
            }
        });
    } catch (error) {
        log.error(error);
        return res.status(error.code || 500).json({ message: error.message });
    }
};
