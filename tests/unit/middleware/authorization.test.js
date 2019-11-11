const rewire = require('rewire');
const authorizationRewire = rewire('../../../middleware/authorization');
const authorizationMid = require('../../../middleware/authorization');
const compact = authorizationRewire.__get__('compact');
const publicRoutes = authorizationRewire.__get__('publicRoutes');
const clientRoutes = authorizationRewire.__get__('clientRoutes');
const monitorRoutes = authorizationRewire.__get__('monitorRoutes');
const adminRoutes = authorizationRewire.__get__('adminRoutes');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');

// global variable declaration
let req;
let res;
let next;

describe(' authorization middleware Unit Test', () => {
    describe('general middleware logic', () => {
        beforeEach( () => {
             req = {
                method: '',
                url: '',
                user: '',
                body: { agency: ''},
                clientId: '',
                header: (h) => {return 0},
            };
             res = {
                status: (s) => { this.s = s; return { send: (m) => {this.m = m; return this} } } ,
                s: 200,
                m: 'OK',
            };
             next = () => 0;
        });
        it('call next() if the req method is OPTIONS', () => {
            req.method = 'OPTIONS';
            authorizationMid(req, res, next);
            expect(authorizationMid(req, res, next)).toBe(0);
        });

        it('call next() if the route is public', () => {
            const tmp = publicRoutes[0].split(':');
            req.method = tmp[0];
            req.url = tmp[1];
            expect(authorizationMid(req, res, next)).toBe(0);
        });

        it('should return 401 if no token is provided and it\'s not public routes', () => {
            expect(authorizationMid(req, res, next))
                .toMatchObject({s: 401, m: 'Access denied. No token provided'});
        });

        it('should return 400 if token is invalid', () => {
            req.header = () => { return 'invalid token'};
            expect(authorizationMid(req, res, next))
                .toMatchObject({s: 400, m: ' Invalid token.'});
        });

        it('should return 404 if routes not found ', () => {
            req.header = () => {
                return jwt.sign({
                    _id: new mongoose.Types.ObjectId,
                    username: 'user',
                    role: 'role',
                    agency: new mongoose.Types.ObjectId,
                }, config.get('jwtPrivateKey').toString())};
            expect(authorizationMid(req, res, next))
                .toMatchObject({s: 404, m: 'The route does not exist'});
        });

        it('should return 403 if user does not have the right permission', () => {
            const tmp = clientRoutes[1].route.split(':');
            req.method = tmp[0];
            req.url = tmp[1];
            req.header = () => {
                return jwt.sign({
                    _id: new mongoose.Types.ObjectId,
                    username: 'user',
                    role: 'role',
                    agency: new mongoose.Types.ObjectId,
                }, config.get('jwtPrivateKey').toString())};
            expect(authorizationMid(req, res, next))
                .toMatchObject({s: 403, m: 'Access denied. You don\'t have the right permission'});
        });

        it('should call next() if it\'s admin route', () => {
            const tmp = adminRoutes[1].split(':');
            req.method = tmp[0];
            req.url = tmp[1];
            req.header = () => {
                return jwt.sign({
                    _id: new mongoose.Types.ObjectId,
                    username: 'admin',
                    role: 'admin',
                    agency: new mongoose.Types.ObjectId,
                }, config.get('jwtPrivateKey').toString())
            };
            expect(authorizationMid(req, res, next)).toBe(0);
        } );

        it('should set req.body.agency to the agency id decoded from the token', () => {
            const tmp = adminRoutes[1].split(':');
            req.method = tmp[0];
            req.url = tmp[1];
            const agencyId =new mongoose.Types.ObjectId;
            req.header = () => {
                return jwt.sign({
                    _id: new mongoose.Types.ObjectId,
                    username: 'admin',
                    role: 'admin',
                    agency: agencyId,
                }, config.get('jwtPrivateKey').toString())
            };
            next = () => {return req.body.agency};
            expect(authorizationMid(req, res, next))
                .toMatch(agencyId.toString());
        });

        it('should call next() if it\'s client route', () => {
            const tmp = clientRoutes[1].route.split(':');
            req.method = tmp[0];
            req.url = tmp[1];
            req.header = () => {
                return jwt.sign({
                    _id: new mongoose.Types.ObjectId,
                    username: 'client',
                    role: 'client',
                    agency: new mongoose.Types.ObjectId,
                }, config.get('jwtPrivateKey').toString())
            };
            expect(authorizationMid(req, res, next)).toBe(0);
        } );

        it('should append the client id from the token to req.url (if route is secure)', () => {
            // make sure if the order of routes change this test will not break
            const tmp = clientRoutes.filter(c => c.secure === true)[0].route.split(':');
            req.method = tmp[0];
            req.url = tmp[1];
            const clientId = new mongoose.Types.ObjectId;
            req.header = () => {
                return jwt.sign({
                    _id: clientId,
                    username: 'client',
                    role: 'client',
                    agency: new mongoose.Types.ObjectId,
                }, config.get('jwtPrivateKey').toString())
            };
            next = () => {return req.url.match(/[0-9a-fA-F]{24}$/g)[0]};
            expect(authorizationMid(req, res, next)).toMatch(clientId.toString());
        });

        it('should set clientId from the token (if route is not secure)', () => {
            // make sure if the order of routes change this test will not break
            const tmp = clientRoutes.filter(c => c.secure === false)[0].route.split(':');
            req.method = tmp[0];
            req.url = tmp[1];
            const clientId = new mongoose.Types.ObjectId;
            req.header = () => {
                return jwt.sign({
                    _id: clientId,
                    username: 'client',
                    role: 'client',
                    agency: new mongoose.Types.ObjectId,
                }, config.get('jwtPrivateKey').toString())
            };
            next = () => {return req.body.clientId};
            expect(authorizationMid(req, res, next)).toMatch(clientId.toString());
        });

        it('should call next() if it\'s monitor route', () => {
            const tmp = monitorRoutes[0].route.split(':');
            req.method = tmp[0];
            req.url = tmp[1];
            req.header = () => {
                return jwt.sign({
                    _id: new mongoose.Types.ObjectId,
                    username: 'monitor',
                    role: 'monitor',
                    agency: new mongoose.Types.ObjectId,
                }, config.get('jwtPrivateKey').toString())
            };
            expect(authorizationMid(req, res, next)).toBe(0);
        } );

        it('should append the monitor id from the token to req.url (if route is secure)', () => {
            // make sure if the order of routes change this test will not break
            const tmp = monitorRoutes.filter(c => c.secure === true)[0].route.split(':');
            req.method = tmp[0];
            req.url = tmp[1];
            const monitorId = new mongoose.Types.ObjectId;
            req.header = () => {
                return jwt.sign({
                    _id: monitorId,
                    username: 'monitor',
                    role: 'monitor',
                    agency: new mongoose.Types.ObjectId,
                }, config.get('jwtPrivateKey').toString())
            };
            next = () => {return req.url.match(/[0-9a-fA-F]{24}$/g)[0]};
            expect(authorizationMid(req, res, next)).toMatch(monitorId.toString());
        });
    });

    describe('FN: compact(method, uri)', () => {
        it('should return a compact "method:/uri"', () => {
            const uri = "/test/testing";
            const method = "POST";
            expect(compact(method, uri)).toMatch('POST:/test/testing');
        });

        it('should replace the  "mongoose object id params" in uri with ":id"', () => {
            const uri = "/test/testing/" + new mongoose.Types.ObjectId().toString();
            const method = "POST";
            expect(compact(method, uri)).toMatch('POST:/test/testing/:id');
        });

        it('should return a compact "method:/uri" event if the uri is in uppercase', () => {
            const uri = "/test/testing/";
            const method = "POST";
            expect(compact(method, uri.toUpperCase())).toMatch('POST:/test/testing/');
        });

    });
});
