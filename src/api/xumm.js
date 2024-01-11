require('dotenv').config();
const axios = require('axios');
const express = require("express");
const log = require('../lib/logger')();

const API_KEY = process.env.XUMM_APIKEY;
const API_SECRET = process.env.XUMM_APISECRET;

const app = express();

app.post("/login", async (req, res) => {
    let error = null;
    try {
        const payload = await axios.post(
            "https://xumm.app/api/v1/platform/payload",
            JSON.stringify({
                txjson: { TransactionType: "SignIn" },
            }),
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-API-Key": API_KEY,
                    "X-API-Secret": API_SECRET,
                },
            }
        );
        if (payload.status === 200) {
            return res.status(200).json({
                status: true,
                data: {
                    uuid: payload.data.uuid,
                    next: payload.data.next.always,
                    qrUrl: payload.data.refs.qr_png,
                    wsUrl: payload.data.refs.websocket_status,
                    pushed: payload.data.pushed,
                },
            });
        }
        error = payload;
    } catch (err) {
        log.error("Login failed");
        error = err;
        if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            //log.error(err.response.data);
            //log.error(err.response.status);
            //log.error(err.response.headers);
            return res.status(err.response.status).json({ status: false, data: err.response.data });
        } else if (err.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            // log.error(err.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            // log.error('Error', error.message);
        }
    }
    return res.status(500).json({ status: false, data: null, err: error });
});

app.get('/payload/:payload_uuid', async (req, res) => {
    let error = null;
    try {
        const payload = await axios.get(
            `https://xumm.app/api/v1/platform/payload/${req.params.payload_uuid}`,
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-API-Key": API_KEY,
                    "X-API-Secret": API_SECRET,
                },
            }
        );
        if (payload.status === 200) {
            return res.status(200).json({
                status: true,
                data: payload.data,
            });
        }
        error = payload;
    } catch (err) {
        log.error("Payload failed");
        error = err;
        if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            //log.error(err.response.data);
            //log.error(err.response.status);
            //log.error(err.response.headers);
            return res.status(err.response.status).json({ status: false, data: err.response.data });
        } else if (err.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            // log.error(err.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            // log.error('Error', error.message);
        }
    }
    return res.status(500).json({ status: false, data: null, err: error });
});

app.delete("/logout/:payload_uuid", async (req, res) => {
    let error = null;
    try {
        const payload = await axios.delete(
            `https://xumm.app/api/v1/platform/payload/${req.params.payload_uuid}`,
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-API-Key": API_KEY,
                    "X-API-Secret": API_SECRET,
                },
            }
        );
        if (payload.status === 200) {
            return res.status(200).json({
                status: true,
                data: payload.data,
            });
        }
        error = payload;
    } catch (err) {
        error = err;
        log.error("Logout failed");
        if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            //log.error(err.response.data);
            //log.error(err.response.status);
            //log.error(err.response.headers);
            return res.status(err.response.status).json({ status: false, data: err.response.data });
        } else if (err.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            // log.error(err.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            // log.error('Error', error.message);
        }
    }
    return res.status(500).json({ status: false, data: null, err: error });
});

module.exports = app;