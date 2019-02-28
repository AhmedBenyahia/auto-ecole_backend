const error = require('../middleware/error');
const express = require('express');

// routes imports goes here


module.exports = (app) => {

// routes chain goes here
    app.use(express.json());


// handling requests error
    app.use(error);
};
