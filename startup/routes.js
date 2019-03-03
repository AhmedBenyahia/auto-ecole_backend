const error = require('../middleware/error');
const express = require('express');
const car  = require('../routes/cars');
const monitor  = require('../routes/monitors');
// routes imports goes here
const agency = require('../routes/agencys');

module.exports = (app) => {

// routes chain goes here
    app.use(express.json());
    app.use('/agency', agency);
    app.use('/car', car);
    app.use('/monitor', monitor);
// handling requests error
    app.use(error);
};
