require('dotenv').config();
const express = require("express");
const api = require('express').Router();

api.use('/nfts', require('./nfts'));
api.use('/status', require('./status'));
api.use('/account', require('./account'));
api.use('/xumm', require('./xumm'));

api.use('/health', (_req, res) => {
  res.status(200).send('success');
});

module.exports = api;
