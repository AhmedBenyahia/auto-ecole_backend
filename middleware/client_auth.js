const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function auth(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access denied. No token provided');

    try {
        req.user = jwt.verify(token, config.get('jwtPrivateKey'));
        if (req.user.role.indexOf('admin')) console.log('It\'s and admin redirect him');
        if (req.user.role !== 'client') return res.status(403).send('Access denied. You don\'t have the right permission');
        next();
    } catch(err) {
        res.status(400).send(' Invalid token.') ;
    }
};

