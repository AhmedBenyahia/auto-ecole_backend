const mongoose = require('mongoose');
const {logger} = require('../startup/logging');
const config = require('config');
// const dbDebug = require('debug')('app:db');

module.exports = () => {
    // connect to database
    mongoose.connect(config.get('db'), {
        useCreateIndex: true,
        useNewUrlParser: true
    })
        .then(() => logger.info( `connection to db: ${config.get('db')} succeeded`));
};
