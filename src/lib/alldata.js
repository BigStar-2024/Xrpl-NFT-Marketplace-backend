const fs = require('fs');
const lodash = require('lodash');
const axios = require('axios');
const CryptoJS = require('crypto-js');
//const {redis} = require('./redis');
const scheduler = require('node-schedule');
const log = require('./logger')();
const { createInterface } = require('readline');
const { once } = require('events');
const jsonrpc = require('./jsonrpc');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const AddressCodec = require('ripple-address-codec');
const BigNumber = require('bignumber.js');
const { performance } = require('perf_hooks');
const db = require('./db');

let nftIssuers = new Map();
let nftAccounts = new Map();
let transformedNfts = [];
let transformedSelfNfts = [];
let isWorking = false;
let timer1 = 0; // 60 mins

const BITHOMP_API_TOKEN = process.env.BITHOMP_API_TOKEN;

let ledger_index; // number
let ledger_date; // string
let ledger_time_ms; // number
let ledger_hash; // string
/* 
https://github.com/node-schedule/node-schedule

Cron-style Scheduling

*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)

ex: '42 * * * *' Execute a cron job when the minute is 42 (e.g. 19:42, 20:42, etc.).
    '* /5 * * * *'  Execute a cron job every 5 Minutes
*/
module.exports.init = async () => {
	log.info('Initialize data module ...');

    db.connect(function (err) {
        /*db.getDB().collection("nfts")
        .deleteMany( {}, function (err, _result) {
            if (err) {
                log.error(err);
            } else {
                const removed = _result.deletedCount;
                log.info(`Removed ${removed}`);
            }
        });*/
    });

    // try {
    //     timer1 = 30;
    //     runScheduledJob();
    //     //await runScheduledJob(); // Remove this line, and uncomment the next line
    //     scheduler.scheduleJob("scheduledJob", "*/1 * * * *", () => runScheduledJob());
    //     //scheduler.scheduleJob("reloadServiceNames", {hour: 12, minute: 0, second: 0}, () => getServiceNames());
    // } catch(err) {
    //     log.error("ERROR INITIALIZING DATA MODULE", err);
    // }
};

async function runScheduledJob() {
    // Called every 1 mins
    timer1++;
    log.info(timer1 + " ScheduledJob, isWorking: " + isWorking);
    if (isWorking) return;

    isWorking = true;
    if (timer1 >= 30) {
        timer1 = 0;
        // Load data from FS every 30 mins
        await loadNftDataFromFS();
    }

    isWorking = false;
}

function getFlag(nft) {
    const flags = new BigNumber(nft.tokenID.slice(0, 4), 16).toNumber();
    return flags;
}

module.exports.getNfts = (page, limit, flag, self) => {
    let query = {}; // { _id: ObjectId('624eb4c646b45a10d86bf930') };
    var startTime = performance.now();

    if (self)
        query = {self: true};

    db.getDB().collection("nfts")
    .find(query).skip(page * limit).limit(limit)
    .toArray(function (err, result) {
        if (err) {
            log.error(err);
        } else {
            //log.info(result);
            var endTime = performance.now();
        }
    });

    
    if (flag) {
        //nfts = lodash.filter(nfts, (_nft) => (getFlag(_nft) & flag) === flag);
    }

    const len = nfts.length;
     
    nfts = nfts.slice(page * limit, (page + 1) * limit);

    let ret = {
        nft_count: transformedNfts.length,
        self_nft_count: transformedSelfNfts.length,
        filter_count: len,
        filter_time: `${(endTime - startTime).toFixed(2)} ms`,
        ledger_index: ledger_index,
        ledger_hash: ledger_hash,
        ledger_date: ledger_date,
        ledger_time_ms: ledger_time_ms,
        nfts: nfts
    }
    return ret;
}

module.exports.getNfts_old = (page, limit, flag, self) => {
    let nfts = transformedNfts;
    if (self)
        nfts = transformedSelfNfts;

    var startTime = performance.now();
    if (flag) {
        nfts = lodash.filter(nfts, (_nft) => (getFlag(_nft) & flag) === flag);
    }
    var endTime = performance.now();

    const len = nfts.length;
     
    nfts = nfts.slice(page * limit, (page + 1) * limit);

    let ret = {
        nft_count: transformedNfts.length,
        self_nft_count: transformedSelfNfts.length,
        filter_count: len,
        filter_time: `${(endTime - startTime).toFixed(2)} ms`,
        ledger_index: ledger_index,
        ledger_hash: ledger_hash,
        ledger_date: ledger_date,
        ledger_time_ms: ledger_time_ms,
        nfts: nfts
    }
    return ret;
}

function transformNfts() {
    let nftsList = [];
    let selfNftsList = [];
    nftIssuers.forEach((data, key, map) => {
        const tokenID = key
        const tokenURI = data.uri;
        const self = data.self;
        const issuer = AddressCodec.encodeAccountID(Buffer.from(tokenID.slice(8, 48), "hex"));
        let domain = null;
        if (nftAccounts.has(issuer))
            domain = nftAccounts.get(issuer).Domain;
        //const md5 = CryptoJS.MD5(key).toString();
        let nft = {
            tokenID: tokenID,
            URI: tokenURI
        };
        if (domain)
            nft.domain = Buffer.from(domain, 'hex').toString();
        nftsList.push(nft);
        if (self)
            selfNftsList.push(nft);
        //log.info(transformedTokens.length);
    });
    transformedNfts = nftsList;
    transformedSelfNfts = selfNftsList;
}

async function loadNftDataFromFS() {
    try {
        log.info("Loading NFT data from nftData.js");
        let nftMap = new Map();
        let accountMap = new Map();
        if(fs.existsSync("./../data.js")) {
            let data = JSON.parse(fs.readFileSync("./../data.js").toString());
            if(data) {
                ledger_index = data['ledger_index'];
                ledger_date = data['ledger_date'];
                ledger_time_ms = data['ledger_time_ms'];
                ledger_hash = data['ledger_hash'];

                let nfts = data.nfts;
                for (var i in nfts) {
                    if (nfts.hasOwnProperty(i)) {
                        const nft = nfts[i];
                        const uri = nft.URI;
                        const self = nft.SELF;
                        nftMap.set(nft.tokenID, {uri, self});
                    }
                }

                let accounts = data.accounts;
                for (var i in accounts) {
                    if (accounts.hasOwnProperty(i)) {
                        const account = accounts[i];
                        accountMap.set(account.Account, account);
                    }
                }

                log.info("Loaded " + nftMap.size + " NFTs, " + accountMap.size + " accounts from ./../data.js");

                if (nftMap.size > 10) {
                    nftIssuers = new Map(nftMap);
                    nftAccounts = new Map(accountMap);
                    transformNfts();
                } else 
                    timer1 = 30;
            }
        } else {
            log.warn("NFT data file does not exist yet.")
        }
    } catch(err) {
        log.error("Error reading NFT data from FS", err);
    }
}
