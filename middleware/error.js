const logger = require('winston');
module.exports = (err, req, res, next) => {
    //Log Error
    logger.log({
        level: 'error',
        message: 'Something failed:  ' + err.message,
        meta: err
    });
    res.status(500).send('Something failed')
};
