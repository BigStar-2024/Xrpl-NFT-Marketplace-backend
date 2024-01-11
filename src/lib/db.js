const { MongoClient } = require("mongodb");
const log = require('./logger')({ name: 'db.js ' });

const MONGO_URL = 'mongodb://localhost:27017';

const client = new MongoClient(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let dbConnection;

module.exports = {
    connect: function (callback) {
        client.connect(function (err, db) {
            if (err || !db) {
                log.error('Error on connecting to MongoDB');
                return callback(err);
            }

            dbConnection = db.db("ledger");
            log.info("Successfully connected to MongoDB.");

            return callback();
        });
    },

    getDB: function () {
        return dbConnection;
    },
};