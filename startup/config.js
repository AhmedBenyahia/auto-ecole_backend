const config = require('config');

module.exports = () => {
    // verify that the jwt key is defined in the global variable
        if (!config.get('jwtPrivateKey')) {
        throw new Error('FATAL ERROR: jwtPrivateKey is not defined.');
    }
};
