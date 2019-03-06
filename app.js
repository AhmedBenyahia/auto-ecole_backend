// import modules and libs
const express = require('express');
const app = express();
const { handleRejection, logger } = require('./startup/logging');

handleRejection();
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')(app);
require('./startup/validation');

// run the server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`)) ;
// fg

module.exports = server;

