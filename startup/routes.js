const error = require('../middleware/error');
const express = require('express');
const car  = require('../routes/cars');
const client  = require('../routes/clients');
const monitor  = require('../routes/monitors');
const session  = require('../routes/sessions');
const authentication  = require('../routes/authentication');
const manager  = require('../routes/managers');
// routes imports goes here
const agency = require('../routes/agencys');

module.exports = (app) => {

// routes chain goes here
    app.use(express.json());
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
