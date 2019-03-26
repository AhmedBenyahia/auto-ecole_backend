const jwt = require('jsonwebtoken');
const config = require('config');
const authorDebug = require('debug')('app:authorization');

// Public routes
const publicRoutes = [
    'POST:/client',
    'GET:/agency',
    'POST:/login',
    'POST:/agency',    //TODO add super admin and delete those
    'GET:/whoami',   //TODO it's public and not in the same time ,
                    //TODO: so we need the jwt role and id to be send to the method
];
// Client only routes
const clientRoutes = [
    'POST:/upload/permi',
    'POST:/upload/cin',
    'GET:/whoami',
    'GET:/client',
    'PUT:/client',
    'PATCH:/client/password',
    'GET:/session/client',
    // to fix
    'POST:/session/reserve',
    'PATCH:/session/cancel',
    'DELETE:/session/reject/:id',

];
// Monitor only routes
const monitorRoutes = [
    'POST:/upload/permi',
    'POST:/upload/cin',
    'PUT:/monitor',
    'PATCH:/monitor/password',
    'POST:/session/reserve',
    'GET:/whoami',
    'GET:/session/monitor'
];
// Admin routes
const adminRoutes = [
    '*', //TODO add reg expression support
   
   'GET:/exame',
    'PUT:/exame/:id',
    'PATCH:/exame/succeed/:id',
    'PATCH:/exame/reset/:id',
    'PATCH:/exame/failed/:id',
    'POST:/exame/scheduleed',
    'GET:/monitor',
    'GET:/monitor/:id',
    'POST:/monitor',
    'PUT:/monitor/:id',
    'DELETE:/monitor/:id',


//
//postclient passiv
'POST:/client',
    'GET:/client',
    'GET:/client/:id',
    'PUT:/client/:id',
    'DELETE:/client/:id',

    // fixed
    'GET:/car',
    'GET:/car/:id',
    'POST:/car',
    'PUT:/car/:id',
    'DELETE:/car/:id',

    'GET:/manager',
    'GET:/manager/:id',
    'POST:/manager',
    'PATCH:/manager/password/:id',
    'DELETE:/manager/:id',

    'GET:/session',
    'GET:/session/client/:id',
    'GET:/session/monitor/:id',
    'GET:/session/:id',
    'PUT:/session/:id',
    'POST:/session/reserve',
    'PATCH:/session/approve/:id',
    'PATCH:/session/cancel/:id',
    'PATCH:/session/update/:id',

];

module.exports = function(req, res, next) {
    authorDebug('Debugging authorization middleware');
    authorDebug('   req:', compact(req.method, req.url));
    // Exclude option request
    if (req.method === "OPTIONS") return next();
    // verify if it's a public routes
    if (publicRoutes.indexOf(compact(req.method, req.url)) > -1) {
        authorDebug('   Access route with public permission:');
        return next();
    }
    // verify the existence of the token
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access denied. No token provided');
    // verify the validation of the token
    try {
        req.user = jwt.verify(token, config.get('jwtPrivateKey'));
        req.body.agency = req.user.agency;
        authorDebug('   token payload: user role is', req.user.role);
        // if he is an admin verify if he has the authorization de visit the req route
        // authorDebug('he is admin and he has the permission so let his, pass: ' + adminRoutes.indexOf(compact(req.method, req.url)) > -1);
        if (req.user.role.toLowerCase().toLowerCase().indexOf('admin') > -1 && adminRoutes.indexOf(compact(req.method, req.url)) > -1) {
            authorDebug('   Access route with admin permission');
            return next();
        }
        // if he is an admin verify if he has the authorization de visit the req route
        if (req.user.role.toLowerCase().indexOf('client') > -1 && clientRoutes.indexOf(compact(req.method, req.url)) > -1) {
            authorDebug('   Access route with client permission');
            //TODO: fix this if the  are a error
            if (req.method !== 'POST')req.url = req.url + '/' + req.user._id;
            else req.body.clientId = req.user._id;
            return next();
        }
        // if he is an admin verify if he has the authorization de visit the req route
        if (req.user.role.toLowerCase().indexOf('monitor') > -1 && monitorRoutes.indexOf(compact(req.method, req.url)) > -1) {
            authorDebug('   Access route with monitor permission');
            req.url = req.url + '/' + req.user._id;
            return next();
        }
        authorDebug('   --> Forbidden, can access route');
        return res.status(403).send('Access denied. You don\'t have the right permission')
    } catch(err) {
        res.status(400).send(' Invalid token.') ;
    }

};

function  compact(method, url) {
    return method + ':' + url.replace(url.match(/[0-9a-fA-F]{24}$/g),':id').toLowerCase();
}

function verifyAccess(method, url, routes) {

}
