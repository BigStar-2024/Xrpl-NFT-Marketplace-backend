require('dotenv').config();
const axios = require('axios');
const express = require("express");
const log = require('../lib/logger')();
const utils = require('../lib/utils');
const xrpl = require("xrpl");

const URL = process.env.RIPPLED_ENV === 'SELF'?'http://127.0.0.1:5005':'https://xrplcluster.com';

const app = express();

// [port_ws_admin_local]
// port = 6006
// ip = 127.0.0.1
// admin = 127.0.0.1
// protocol = ws

// https://ws.xrpnft.com/api/account/nfts/rH6jr16vArKBneg2Hzy1bgC9ewdMReYavH
app.get('/nfts/:account', async (req, res) => {
    let error = null;
    const account = req.params.account;
    if (account/* && utils.isValidXRPAddress(account)*/) {
        try {
            const client = new xrpl.Client("ws://localhost:6006")
            await client.connect()
            const nfts = await client.request({
                method: "account_nfts",
                account: account
            })
            client.disconnect();
            if (nfts && nfts.result && nfts.result.account && nfts.type && nfts.type === 'response') {
                return res.status(200).send({
                    result: 'success',
                    account: nfts.result.account,
                    ledger_current_index: nfts.result.ledger_current_index,
                    validated: nfts.result.validated,
                    nfts: nfts.result.account_nfts
                });
            }
            error = nfts;
        } catch (err) {
            error = err;
        }
    } else {
        error = "Invalid account address";
    }
    log.error(error);
    return res.status(500).json({ status: false, data: null, err: error });
});

module.exports = app;

/*const accounts = [
    {
      id: 1,
      key: "rH6jr16vArKBneg2Hzy1bgC9ewdMReYavH",
      secret: "shsUVURnRc6dC1Y2aqpkhu3dDG2eu",
    },
    {
      id: 2,
      key: "r3tuno9Nkd2zpEDBdSJMtyeQ6sZb9CXy88",
      secret: "ssWxNRgrAzECJzLpeUoL8dYvCixtn",
    },
    {
      id: 3,
      key: "rGS2zSMwHP3j6Rqm9D5r4iTwoucHwAfAM9",
      secret: "ssUPpTPeNFUUgUkHS46WY6tXgKgxK",
    },
    {
      id: 4,
      key: "r3cu51e1qWBVALPArjBmcHAwMyMrSWRREX",
      secret: "ssXfMEPz1wBvNv11CDVq6dfmXmCnP",
    },
    {
      id: 5,
      key: "rK7eKU18TgbMReccVDtkQu2kfLYmirdVS9",
      secret: "shsh6ty64sqNCu9bkCqUwqCCFbwss",
    }
];*/