const usernameGenerator = require('username-generator');
const passwordGenerator = require('generate-password');
const {Session} = require('../../../model/session');
const {Monitor} = require('../../../model/monitor');
const {Client} = require('../../../model/client');
const {Manager} = require('../../../model/manager');
const {Car} = require('../../../model/car');
const {Agency} = require('../../../model/agency');
const {Notif} = require('../../../model/notif');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require("bcrypt");
const _ = require('lodash');
const moment = require('moment');
let server;
const timeoutDelay = 100;
// clean the database
const cleanDB = async () => {
    await Monitor.deleteMany({}).exec();
    await Manager.deleteMany({}).exec();
    await Car.deleteMany({}).exec();
    await Client.deleteMany({}).exec();
    await Session.deleteMany({}).exec();
    await Agency.deleteMany({}).exec();
    await Notif.deleteMany({}).exec();
};
// !important NOTE:make sure to use done() every time we have async
// callback or Timeout FN, if not we will get unpredictable error in unpredictable place
describe('session routes', () => {
    // Global test var
    let agencyId;
    let tmpMonitor;
    let tmpClient;
    let tmpCar;
    let tmpAgency;
    let tmpSession;
    beforeEach(async (done) => {
        server = require('../../../app');
        // make sure to clean everything in case one of the test didnt clean his miss
        await cleanDB();
        // add an agency to db
        tmpAgency = [
            {
                title: 'title',
                region: 'region',
                cin: '12548563',
                cinDate: new Date(Date.now()).toISOString(),
                taxRegistrationDate: new Date(Date.now()).toISOString(),
                taxRegistrationNum: '123654789',
                address: 'ggggggg',
                email: 'ahmedb@gmail.com',
                phone: '54741588',
                postalCode: '5471',
            }, {
                title: 'title 2',
                region: 'region 2',
                cin: '12540563',
                cinDate: new Date(Date.now()).toISOString(),
                taxRegistrationDate: new Date(Date.now()).toISOString(),
                taxRegistrationNum: '123654709',
                address: 'ggggggg',
                email: 'ahmedb2@gmail.com',
                phone: '54741580',
                postalCode: '5401',
            }];
        agencyId = (await new Agency(tmpAgency[0]).save())._id.toString();
        // set some template
        tmpMonitor = [
            {
                username: usernameGenerator.generateUsername(),
                password: passwordGenerator.generate(),
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
                username: usernameGenerator.generateUsername(),
                password: passwordGenerator.generate(),
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
        tmpClient = [
            {
                username: usernameGenerator.generateUsername(),
                password: passwordGenerator.generate(),
                name: 'sayto',
                cin: '12548563',
                birthday: new Date(Date.now()).toISOString(),
                cinDate: new Date(Date.now()).toISOString(),
                surname: 'sayto',
                address: 'ggggggg',
                email: 'ahmedb@gmail.com',
                phone: '54741588',
                postalCode: '5471',
                state: 'READY',
                agency: agencyId,
            }, {
                username: usernameGenerator.generateUsername(),
                password: passwordGenerator.generate(),
                name: 'sayto2',
                cin: '25480168',
                birthday: new Date(Date.now()).toISOString(),
                cinDate: new Date(Date.now()).toISOString(),
                surname: 'sayto2',
                address: 'gggggggg',
                email: 'ahmedb2@gmail.com',
                drivingLicence: [{
                    drivingLicenceType: 'B',
                    drivingLicenceNum: '12548630',
                    drivingLicenceDate: new Date(Date.now()).toISOString(),
                }],
                phone: '54741589',
                postalCode: '5481',
                state: 'READY',
                agency: agencyId,
            }];
        tmpCar = [
            {
                num: '157TN5412',
                mark: 'mark',
                model: 'model',
                serialNum: '12345678901234567',
                dateFirstRegistration: new Date(Date.now()).toISOString(),
                exploitationCartDate: new Date(Date.now()).toISOString(),
                exploitationCartNum: '25470',
                agency: agencyId,
            }, {
                num: '157TN5410',
                mark: 'mark 2',
                model: 'model 2',
                serialNum: '12345678900234567',
                dateFirstRegistration: new Date(Date.now()).toISOString(),
                exploitationCartDate: new Date(Date.now()).toISOString(),
                exploitationCartNum: '20470',
                agency: agencyId,
            }];
        // save some data in the db
        tmpClient[0]._id = (await new Client(tmpClient[0]).save())._id.toString();
        tmpMonitor[0]._id = (await new Monitor(tmpMonitor[0]).save())._id.toString();
        tmpCar[0]._id = (await new Car(tmpCar[0]).save())._id.toString();
        await new Client(tmpClient[1]).save();
        await new Monitor(tmpMonitor[1]).save();
        await new Car(tmpCar[1]).save();
        // set the session template after saving the client, car, monitor in the db
        tmpSession = [
            {
                car: _.pick(tmpCar[0], ['_id', 'num', 'mark', 'model']),
                monitor: _.pick(tmpMonitor[0], ['_id', 'name', 'surname', 'certification']),
                client: _.pick(tmpClient[0], ['_id', 'name', 'surname', 'state', 'drivingLicenceType']),
                reservationDate: new Date(Date.now() + 25*60*60*1000).toISOString()  ,
                agency: agencyId,
            }, {
                car: _.pick(tmpCar[1], ['_id', 'num', 'mark', 'model']),
                monitor: _.pick(tmpMonitor[1], ['_id', 'name', 'surname', 'certification']),
                client: _.pick(tmpClient[1], ['_id', 'name', 'surname', 'state', 'drivingLicenceType']),
                reservationDate: new Date(Date.now() + 25*60*60*1000).toISOString()  ,
                agency: agencyId,
            }];
        done();
    });

    afterEach( async (done) => {
        await cleanDB();
        server.close();
        done();
    });

    describe('GET ALL Session', () => {
        let token;
        // Def the happy path
        // Mosh refactoring method
        beforeEach( async () => {
            // create authentication token
            token = jwt.sign({
                _id: new mongoose.Types.ObjectId,
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // add session to db
            await new Session(tmpSession[1]).save();
            await new Session(tmpSession[0]).save();

        });

        const exec = () => {
            return request(server)
                .get('/session')
                .set('Authorization', token);
        };

        it('should return the list of session in the giving agency', async () => {
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test the number of element in the request
            expect(res.body.length).toBe(2);
            // test the returned obj
            expect(res.body[0]).toMatchObject(tmpSession[1]);
            expect(res.body[1]).toMatchObject(tmpSession[0]);
        });
    });

    describe('GET Session By Id', () => {
        let token;
        let sessionId;
        let uri;
        // Def the happy path
        // Mosh refactoring method
        beforeEach( async () => {
            // create authentication token
            token = jwt.sign({
                _id: new mongoose.Types.ObjectId,
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // add session to db
            sessionId = (await new Session(tmpSession[0]).save())._id;
            // set the request uri
            uri = '/session/' + sessionId;
        });

        const exec = () => {
            return request(server)
                .get(uri)
                .set('Authorization', token);
        };

        it('should return the list of session in the giving agency', async () => {
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test the returned obj
            expect(res.body).toMatchObject(tmpSession[0]);
        });
    });

    describe('GET Monitor Session', () => {
        let token;
        let sessionId;
        let uri;
        // Def the happy path
        // Mosh refactoring method
        beforeEach( async () => {
            // create authentication token
            token = jwt.sign({
                _id: new mongoose.Types.ObjectId,
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // add session to db
            sessionId = (await new Session(tmpSession[0]).save())._id;
            // set the request uri
            uri = '/session/monitor/' + tmpMonitor[0]._id;
        });

        const exec = () => {
            return request(server)
                .get(uri)
                .set('Authorization', token);
        };

        it('should return the list of session in the giving agency', async () => {
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test the returned obj
            expect(res.body[0]).toMatchObject(tmpSession[0]);
        });
    });

    describe('GET Client Session', () => {
        let token;
        let sessionId;
        let uri;
        // Def the happy path
        // Mosh refactoring method
        beforeEach( async () => {
            // create authentication token
            token = jwt.sign({
                _id: new mongoose.Types.ObjectId,
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // add session to db
            sessionId = (await new Session(tmpSession[0]).save())._id;
            // set the request uri
            uri = '/session/client/' + tmpClient[0]._id;
        });

        const exec = () => {
            return request(server)
                .get(uri)
                .set('Authorization', token);
        };

        it('should return the list of session in the giving agency', async () => {
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test the returned obj
            expect(res.body[0]).toMatchObject(tmpSession[0]);
        });
    });

    describe('Request Session (as client)', () => {
        let token;
        let uri;
        let session;
        // Def the happy path
        // Mosh refactoring method
        beforeEach( async () => {
            // create authentication token
            token = jwt.sign({
                _id: tmpClient[0]._id,
                username: 'client',
                role: 'client',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            //set request body
            session = {
                clientId: tmpClient[0]._id,
                reservationDate: tmpSession[0].reservationDate,
            };
            // set the request uri
            uri = '/session/reserve';
        });

        const exec = () => {
            return request(server)
                .post(uri)
                .set('Authorization', token)
                .send(session);
        };

        it('should reserve a session', async () => {
            jest.setTimeout(1000000);
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test the returned obj
            expect(res.body).toMatchObject(_.omit(tmpSession[0], 'car', 'monitor'));
        });

        it('should return 400 if bad request', async () => {
            session = {};
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
        });

        it('should return 404 if agency not found', async () => {
            await Agency.deleteMany({}).exec();
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the request message
            expect(res.body.message).toContain('agency');
        });

        it('should return 404 if client not found', async () => {
            await Client.deleteMany({}).exec();
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the request message
            expect(res.body.message).toContain('client');
        });

        it('should return 423 if the profile of the client is not completed', async () => {
            // change the state of the client in the database
            const client = await Client.findOne({_id: tmpClient[0]});
            client.state = 'PROFILE_NOT_COMPLETED';
            await client.save();
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(423);
            // test the request message
            expect(res.body.message).toContain('profile');
        });

        it('should return 423 if the account of the client is verified', async () => {
            // change the state of the client in the database
            const client = await Client.findOne({_id: tmpClient[0]});
            client.state = 'UNVERIFIED';
            await client.save();
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(423);
            // test the request message
            expect(res.body.message).toContain('profile');
        });

        it('should return 400 if the client has already a session in the same date', async () => {
            // reserve the session for the first time
            await exec();
            // send the second request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
            // test the returned obj
            expect(res.body.message).toContain('already');
        });
    });

    describe('Request Session (monitor or admin)', () => {
        let token;
        let uri;
        let session;
        // Def the happy path
        // Mosh refactoring method
        beforeEach( async () => {
            // create authentication token
            token = jwt.sign({
                _id: tmpClient[0]._id,
                username: 'monitor',
                role: 'monitor',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            //set request body
            session = {
                clientId: tmpClient[0]._id,
                reservationDate: tmpSession[0].reservationDate,
                carId: tmpCar[0]._id,
                monitorId: tmpMonitor[0]._id,
            };
            // set the request uri
            uri = '/session/reserve';
        });

        const exec = () => {
            return request(server)
                .post(uri)
                .set('Authorization', token)
                .send(session);
        };

        it('should reserve a session (fullReservation', async () => {
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test the returned obj
            expect(res.body).toMatchObject(tmpSession[0]);
        });

        it('should return 404 if car not found', async () => {
            await Car.deleteMany({}).exec();
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the request message
            expect(res.body.message).toContain('car');
        });

        it('should return 404 if monitor not found', async () => {
            await Monitor.deleteMany({}).exec();
            // send the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the request message
            expect(res.body.message).toContain('monitor');
        });

        it('should return 400 if the car has already a session in the same date', async () => {
            // reserve the car for the first time
            tmpSession[1].car = _.pick(tmpCar[0], ['_id', 'num', 'mark', 'model']);
            await new Session(tmpSession[1]).save();
            // send the second request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
            // test the returned obj
            expect(res.body.message).toContain('car is not available');
        });

        it('should return 400 if the monitor has already a session in the same date', async () => {
            // reserve the monitor for the first time
            tmpSession[1].monitor = _.pick(tmpMonitor[0], ['_id', 'name', 'surname', 'certification']);
            await new Session(tmpSession[1]).save();
            // send the second request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
            // test the returned obj
            expect(res.body.message).toContain('monitor is not available');
        });

    });


});



