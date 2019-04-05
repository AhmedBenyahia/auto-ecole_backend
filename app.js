// import modules and libs
const express = require('express');
const app = express();
const cors = require('cors');
const fileUpload = require('express-fileupload');

app.use(cors());

app.use(fileUpload());


require('./startup/config')(app);
const { handleRejection, logger } = require('./startup/logging');
handleRejection();
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/validation');
require('./startup/prod')(app);

// run the server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`)) ;
// fg

module.exports = server;

