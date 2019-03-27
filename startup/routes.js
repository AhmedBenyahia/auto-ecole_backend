const error = require('../middleware/error');
const authorization = require('../middleware/authorization');
const express = require('express');

// routes imports goes here
const agency = require('../routes/agencys');
const car  = require('../routes/cars');
const client  = require('../routes/clients');
const monitor  = require('../routes/monitors');
const session  = require('../routes/sessions');
const authentication  = require('../routes/authentication');
const manager  = require('../routes/managers');
const authorDebug = require('debug')('app:authorization');

module.exports = (app) => {

// Authorization check
    app.use(express.json()) ;
    app.use(authorization);
// routes chain goes here
    app.use('/agency', agency);
    app.use('/car', car);
    app.use('/client', client);
    app.use('/monitor', monitor);
    app.use('/session', session);
    app.use('/', authentication);
    app.use('/manager', manager);
// handling requests error
    app.use(error);
};
