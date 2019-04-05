  const jwt = require('jsonwebtoken');
  const config = require('config');
  const authorDebug = require('debug')('app:authorization');
  const {handleRejection, logger} = require('../startup/logging');
  const _ = require('lodash');
  // Public routes
  const publicRoutes = [
    'POST:/client',
    'GET:/agency',
    'POST:/login',
      'GET:/client/confirmation/:id',
      'GET:/client/token/resend',
      'GET:/client/password/reset',
      'PATCH:/client/password/reset/:id',
    'POST:/agency',    //TODO add super admin and delete those
    'GET:/whoami',   //TODO it's public and not in the same time ,
                    //TODO: so we need the jwt role and id to be send to the method
  ];
  // Client only routes
  const clientRoutes = [
      { route: "POST:/upload/license",       secure: true  },
      { route: "POST:/upload/cin",           secure: true  },
      { route: "GET:/whoami",                secure: true  },
      { route: "GET:/client",                secure: true  },
      { route: "PUT:/client",                secure: true  },
      { route: "PATCH:/client/password",     secure: true  },
      { route: "GET:/session/client",        secure: true  },
      {route: "GET:/timetable/client", secure: true},
      {route: "POST:/session/reserve", secure: false},
      { route: "PATCH:/session/cancel/:id",  secure: false },
      { route: "DELETE:/session/reject/:id", secure: false },
  ];
  // Monitor only routes
  const monitorRoutes = [
    { route: "POST:/upload/license",    secure: true  },
    { route: "POST:/upload/cin",        secure: true  },
    { route: "PUT:/monitor",            secure: true  },
    { route: "PATCH:/monitor/password", secure: true  },
    { route: "GET:/whoami",             secure: true  },
    { route: "GET:/session/monitor",    secure: true  },
      {route: "GET:/history/monitor", secure: true},
    { route: "POST:/session/reserve",   secure: false },
    { route: "GET:/session",            secure: false },
    { route: "GET:/car",                secure: false },
    { route: "GET:/client",             secure: false },
    { route: "GET:/monitor",            secure: false },
      {route: "GET:/monitor/:id", secure: false},
      {route: "POST:/absence/reserve", secure: false},
      {route: "GET:/absence", secure: false},
      {route: "DELETE:/absence/:id", secure: false},

  ];
  // Admin routes
  const adminRoutes = [
    '*', //TODO add reg expression support

    'GET:/exam',
    'GET:/exam/:id',
    'PUT:/exam/:id',
    'PATCH:/exam/succeed/:id',
    'PATCH:/exam/reset/:id',
    'PATCH:/exam/failed/:id',
    'POST:/exam/scheduled',

    'GET:/monitor',
    'GET:/monitor/:id',
    'POST:/monitor',
    'PUT:/monitor/:id',
    'DELETE:/monitor/:id',

    'POST:/client',
    'GET:/client',
    'GET:/client/:id',
    'PUT:/client/:id',
    'DELETE:/client/:id',

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
    // Exclude option request
    if (req.method === "OPTIONS") return next();
    // verify if it's a public routes
    if (publicRoutes.indexOf(compact(req.method, req.url)) > -1) {
        // logger.log({
        //     level: 'info',
        //     message: `request->${compact(req.method, req.url)}`,
        //     meta: _.pick(req, ['headers', 'originalUrl', 'params', 'body'])
        //     }
        // );
        authorDebug('   Access route with public permission:');
        return next();
    }
    // verify the existence of the token
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access denied. No token provided');
    // verify the validation of the token
    try {
        // This var is the position of the req url in the route table relative to the user
        let i;
        req.user = jwt.verify(token, config.get('jwtPrivateKey'));
        req.body.agency = req.user.agency;
        authorDebug('   token payload: user role is', req.user.role);
        // if he is a client verify if he has the authorization de visit the req route
        if (req.user.role.toLowerCase().toLowerCase().indexOf('admin') > -1
            && adminRoutes.indexOf(compact(req.method, req.url)) > -1)
        {
            authorDebug('   Access route with admin permission');
            return next();
        }
        // if he is an admin verify if he has the authorization de visit the req route
        i = clientRoutes.map(x => x.route).indexOf(compact(req.method, req.url));
        if (req.user.role.toLowerCase().indexOf('client') > -1 && i > -1)
        {
            authorDebug('   Access route with client permission');
            if (clientRoutes[i].secure) req.url = req.url + '/' + req.user._id;
            else req.body.clientId = req.user._id;
            return next();
        }
        // if he is a monitor verify if he has the authorization de visit the req route
        i = monitorRoutes.map(x => x.route).indexOf(compact(req.method, req.url));
        if (req.user.role.toLowerCase().indexOf('monitor') > -1 && i > -1)
        {
            authorDebug('   Access route with monitor permission');
            if (monitorRoutes[i].secure) req.url = req.url + '/' + req.user._id;
            return next();
        }
        if (i === -1) {
            authorDebug('   --> Route Not Found');
            return res.status(404).send('The route does not exist')
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
