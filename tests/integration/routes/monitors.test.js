const usernameGenerator = require('username-generator');
const {Monitor} = require('../../../model/monitor');
const {Agency} = require('../../../model/agency');
const {Notif} = require('../../../model/notif');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require("bcrypt");
const _ = require('lodash');

let server;
const timeoutDelay = 100;
// clean the database
const cleanDB = async () => {
    await Monitor.deleteMany({}).exec();
    await Agency.deleteMany({}).exec();
    await Notif.deleteMany({}).exec();
};
// !important NOTE:make sure to use done() every time we have async
// callback or Timeout FN, if not we will get unpredictable error in unpredictable place
describe('monitor routes', () => {

    beforeEach(async (done) => {
        server = require('../../../app');
        await cleanDB();
        tmp = [
            {
                name: 'sayto',
                cin: '12548563',
                birthday: new Date(Date.now()).toISOString(),
                cinDate: new Date(Date.now()).toISOString(),
                surname: 'sayto',
                address: 'ggggggg',
                phone: '54741588',
                drivingLicence: [{
                    drivingLicenceType: 'B',
                    drivingLicenceNum: '24896214',
                    drivingLicenceDate: new Date(Date.now()).toISOString(),
                }],
                certification: [{
                    certificationType: 'B',
                    certificationNum: '20398701',
                    certificationDate: new Date(Date.now()).toISOString(),
                }],
                postalCode: '5471',
                agency: agencyId,
            }, {
                name: 'sayto2',
                cin: '25480168',
                birthday: new Date(Date.now()).toISOString(),
                cinDate: new Date(Date.now()).toISOString(),
                surname: 'sayto2',
                address: 'gggggggg',
                drivingLicence: [{
                    drivingLicenceType: 'C',
                    drivingLicenceNum: '01479354',
                    drivingLicenceDate: new Date(Date.now()).toISOString(),
                }],
                certification: [{
                    certificationType: 'C',
                    certificationNum: '20147950',
                    certificationDate: new Date(Date.now()).toISOString(),
                }],
                phone: '54741589',
                postalCode: '5481',
                agency: agencyId,
            }];
        done();
    });

    afterEach( async (done) => {
        await cleanDB();
        await server.close();
        done();
    });

    // Global test var
    let agencyId = (new mongoose.Types.ObjectId).toString();
    let tmp;

    describe('GET ALL', () => {
        // we need the agency id to add new monitor and to create the token
        // We need the jwt token to access the route
        let token;
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .get('/monitor')
                .set('Authorization', token);
        };

        it('should return the list of the monitors in the agency',  async (done) => {
            // create authentication token
            token = jwt.sign({
                _id: new mongoose.Types.ObjectId,
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // add some monitors to db
            tmp[1].password = 'i am a password';
            tmp[1].username = 'i am a username';
            tmp[0].password = 'i am a password 2';
            tmp[0].username = 'i am a username 2';
            await new Monitor(tmp[0]).save();
            await new Monitor(tmp[1]).save();
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined body
            expect(res.body.length).toBe(2);
            // the date need re-formatting
            expect(res.body[0]).toMatchObject(tmp[0]);
            expect(res.body[1]).toMatchObject(tmp[1]);
            done();
        });
    });
    // Mosh refactoring method :
    describe('GET By Id', () => {
        // We need the jwt token to access the route
        let token;
        let uri = '/monitor';

        const exec = () => {
            return request(server)
                .get(uri)
                .set('Authorization', token);
        };

        it('should return the monitor with the giving id',  async () => {
            // create authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // add a monitor to db
            tmp[0].password = 'i am a password';
            tmp[0].username = 'i am a username';
            const monitor =  new Monitor(tmp[0]);
            await monitor.save();
            // append the monitor id to request uri
            uri = uri + '/' + monitor._id;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test the if it's the right result
            expect(res.body).toMatchObject(tmp[0]);// the date need re-formatting
        });

        it('should return 404 if monitor id is invalid',  async () => {
            // create authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // append the monitor id to request uri
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
        });
    });

    // NOTE: i am not going to validate the Joi schema because it's simple and doesn't need test
    // FUTURE: we can unit test the joi validation fn
    describe('ADD New', () => {
        let monitor;
        let token;
        // Mosh refactoring method
        beforeEach(async (done) => {
            // add an agency to db
            const agency = new Agency({
                title: usernameGenerator.generateUsername(),
                address: 'i am an address',
                phone: '54102879',
                postalCode: '1458',
                email: 'ahmes@bj.com',
                licenceExpirationDate: new Date(Date.now()),
                taxRegistrationNum: '123456789',
                taxRegistrationDate: new Date(Date.now()),
                cin: '12254878',
                cinDate: new Date(Date.now()),
                region: 'Tunis',
            });
            await agency.save();
            // create authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agency._id,
            }, config.get('jwtPrivateKey').toString());
            // set the agency of the monitor we are adding to the created agency id
            tmp[0].agency = agency._id.toString();
            monitor = tmp[0];
            done();
        });
        const exec = () => {
            return request(server)
                .post('/monitor')
                .set('Authorization', token)
                .send(monitor);
        };
        // The happy path 1
        it('should save the giving monitor in the db if everything is ok and return it',  async (done) => {
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test the if it's the right result
            expect(res.body).toMatchObject(_.omit(monitor, 'password'));// the date need re-formatting
            // test If the password match
            expect(res.body.state).toMatch('ACTIVE');
            // test if the monitor is saved in the database
            setTimeout(async () => {
                expect(await Monitor.estimatedDocumentCount()).toBe(1);
                expect((await Monitor.findOne()).password).toBeDefined();
                expect((await Monitor.findOne()).username).toBeDefined();
                done();
            },timeoutDelay)
        });
        // agency not found
        it('should return 404 if the agency doesn\'t exist',  async () => {
            // agency not found
            await Agency.deleteMany({}).exec();
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
        });

        it('should return 400 if bad request',  async () => {
            monitor.address = '';
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
        });

    });

    describe('UPDATE Monitor (password is not included)', () => {
        // We need the jwt token to access the route
        let token = '';
        let uri = '/monitor';
        let monitor;
        //NOTE always make sure to clean
        /** your mother isn't here so clean up after yourself **/
        beforeEach(async () => {
            // add an agency to db
            const agency = new Agency({
                title: usernameGenerator.generateUsername(),
                address: 'i am an address',
                phone: '54102879',
                postalCode: '1458',
                email: 'ahmes@bj.com',
                licenceExpirationDate: new Date(Date.now()),
                taxRegistrationNum: '123456789',
                taxRegistrationDate: new Date(Date.now()),
                cin: '12254878',
                cinDate: new Date(Date.now()),
                region: 'Tunis',
            });
            await agency.save();
            // save the created agency id
            agencyId = agency._id;
            // set the tmp monitor agency id to the created agency id
            tmp[1].agency = agency._id.toString();
            // generate authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // create the req object
            monitor = tmp[1];
            // set the uri
            uri = '/monitor';
        });

        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .put(uri)
                .set('Authorization', token)
                .send(monitor);
        };
        // The happy path 1
        it('should update the monitor with the giving att && return the update monitor',  async (done) => {
            // add new monitor do db
            tmp[1].password = 'i am a password';
            tmp[1].username = 'i am a username';
            const monitorObj = await new Monitor(tmp[1]).save();
            // change some att in monitor obj
            monitor.surname = 'surname updated';
            monitor.name = 'name updated';
            // remove also some other att to make sure the update doesn't need all the att
            monitor = _.omit(monitor, 'email', 'password', 'username');
            // add the monitor id to request uri
            uri = uri + '/' + monitorObj._id;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if it's the right result
            expect(res.body).toMatchObject(_.omit(monitor, 'password'));
            // test if the monitor is saved in the database
            setTimeout(async () => {
                expect(await Monitor.estimatedDocumentCount()).toBe(1);
                done();
            },timeoutDelay);
            // test if the monitor is updated in the db
            setTimeout(async () => {
                const monitorFromDb = await Monitor.findOne({_id: monitorObj._id});
                expect(monitorFromDb.surname).toMatch(monitor.surname);
                expect(monitorFromDb.name).toMatch(monitor.name);
                done();
            },timeoutDelay);
        });
        // Other bad path 1
        it('should return 404 if agency not found',  async () => {
            // append the monitor id to request uri
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // agency not found
            await Agency.deleteMany({}).exec();
            // omit password and username

            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message).toContain('agency');
        });
        // Other bad path 2
        it('should return 404 if the monitor not found',  async () => {
            // append the monitor id to request uri
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('monitor') > -1 > -1).toBeTruthy();
        });
        // Other bad path 3
        it('should return 400 if we try to update the password',  async () => {
            // add new monitor do db
            tmp[1].password = 'i am a password';
            tmp[1].username = 'i am a username';
            const monitorObj = await new Monitor(tmp[1]).save();
            // change some att in monitor obj
            monitor.surname = 'surname updated';
            monitor.name = 'name updated';
            monitor.password = 'i am a password';
            // add the monitor id to request uri
            uri = uri + '/' + monitorObj._id;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
            // test the message
            expect(res.body.message).toContain('"password" is not allowed');
        });

    });

    describe('UPDATE Monitor password ', () => {
        // We need the jwt token to access the route
        let token = '';
        let uri = '';
        let updatePassword = {newPassword: '', oldPassword: ''};

        //NOTE always make sure to clean up
        /** your mother isn't here so clean up after yourself **/
        // Mosh refactoring method
        beforeEach(async (done) => {
            // add an agency to db
            const agency = new Agency({
                title: usernameGenerator.generateUsername(),
                address: 'i am an address',
                phone: '54102879',
                postalCode: '1458',
                email: 'ahmes@bj.com',
                licenceExpirationDate: new Date(Date.now()),
                taxRegistrationNum: '123456789',
                taxRegistrationDate: new Date(Date.now()),
                cin: '12254878',
                cinDate: new Date(Date.now()),
                region: 'Tunis',
            });
            await agency.save();
            // save the id of the created agency
            agencyId = agency._id;
            // generate authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // set the tmp monitor agency id to the created agency id
            tmp[1].agency = agency._id.toString();
            uri = '/monitor/password';
            done();
        });
        const exec = () => {
            return request(server)
                .patch(uri)
                .set('Authorization', token)
                .send(updatePassword);
        };
        // The happy path 1
        it('should update the monitor password when the old password is provided',  async (done) => {
            tmp[1].password = 'i am a password';
            tmp[1].username = 'i am a username';
            // save the pass plain text
            updatePassword.oldPassword = tmp[1].password;
            updatePassword.newPassword = '123456789';
            // hash the tmp monitor pass
            tmp[1].password = await bcrypt.hash(tmp[1].password, await bcrypt.genSalt(10));
            const monitorObj = await new Monitor(tmp[1]).save();
            // add the monitor id to request uri
            uri = uri + '/' + monitorObj._id;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if the monitor is updated in the db
            setTimeout(async () => {
                const monitorFromDb = await Monitor.findOne({_id: monitorObj._id});
                expect(await bcrypt.compare(updatePassword.newPassword, monitorFromDb.password)).toBeTruthy();
                done();
            }, timeoutDelay);
        });
        // Other bad path 1
        it('should return 404 if the monitor not found',  async () => {
            // append the monitor id to request uri
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('monitor') > -1).toBeTruthy();
        });
        // Other bad path 2
        it('should return 401 if password is incorrect',  async () => {
            tmp[1].password = 'i am a password';
            tmp[1].username = 'i am a username';
            const monitorId = (await new Monitor(tmp[1]).save())._id;
            // add the monitor id to request uri
            uri = uri + '/' + monitorId;
            // password incorrect
            updatePassword.oldPassword = 'i am incorrect password';
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(401);
            // test the message
            expect(res.body.message).toContain('Incorrect password!!');
        });

    });

    describe('DELETE Monitor', () => {
        // We need the jwt token to access the route
        let token = '';
        let uri = '';
        //NOTE always make sure to clean up
        /** your mother isn't here so clean up after yourself **/
        beforeEach(async () => {
            // add an agency to db
            const agency = new Agency({
                title: usernameGenerator.generateUsername(),
                address: 'i am an address',
                phone: '54102879',
                postalCode: '1458',
                email: 'ahmes@bj.com',
                licenceExpirationDate: new Date(Date.now()),
                taxRegistrationNum: '123456789',
                taxRegistrationDate: new Date(Date.now()),
                cin: '12254878',
                cinDate: new Date(Date.now()),
                region: 'Tunis',
            });
            await agency.save();
            agencyId = agency._id;
            // generate authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // add a monitor to db with the agencyId we have just created
            tmp[1].agency = agency._id.toString();
            uri = '/monitor';
        });
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .delete(uri)
                .set('Authorization', token);
        };
        // The happy path 1
        it('should delete the monitor with the giving id',  async (done) => {
            tmp[1].password = 'i am a password';
            tmp[1].username = 'i am a username';
            const monitorId = (await new Monitor(tmp[1]).save())._id;
            // add the monitor id to request uri
            uri = uri + '/' + monitorId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if the monitor is deleted from the db
            setTimeout(async () => {
                const monitorFromDb = await Monitor.findOne({_id: monitorId});
                expect(monitorFromDb).toBeNull();
                done();
            },timeoutDelay);
        });
        // Other bad path 1
        it('should return 404 if the monitor not found',  async () => {
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('monitor') > -1 > -1).toBeTruthy();
        });

    });

});
