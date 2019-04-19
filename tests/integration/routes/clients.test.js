const usernameGenerator = require('username-generator');
const passwordGenerator = require('generate-password');
const {Client, VerificationToken} = require('../../../model/client');
const {Agency} = require('../../../model/agency');
const {Notif} = require('../../../model/notif');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const _ = require('lodash');

let server;
const timeoutDelay = 100;
// clean the database
const cleanDB = async () => {
    await Client.deleteMany({}).exec();
    await Agency.deleteMany({}).exec();
    await VerificationToken.deleteMany({}).exec();
    await Notif.deleteMany({}).exec();
};
// !important NOTE:make sure to use done() every time we have async
// callback or Timeout FN, if not we will get unpredictable error in unpredictable place
describe('client routes', () => {

    beforeEach(async () => {
        server = require('../../../app');
        await cleanDB();
    });

    afterEach( async (done) => {
        await cleanDB();
        server.close();
        done();
    });

    // Global test var
    let agencyId = (new mongoose.Types.ObjectId).toString();
    let tmp = [
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
            agency: agencyId,
        }];

    describe('GET ALL', () => {
        // we need the agency id to add new client and to create the token
        // We need the jwt token to access the route
        let token;
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .get('/client')
                .set('Authorization', token);
        };

        it('should return the list of the clients in the agency',  async (done) => {
            // create authentication token
            token = jwt.sign({
                _id: new mongoose.Types.ObjectId,
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // add some clients to db
            let client =  new Client(tmp[0]);
            await client.save();
            client =  new Client(tmp[1]);
            await client.save();
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
        let uri = '/client';

        const exec = () => {
            return request(server)
                .get(uri)
                .set('Authorization', token);
        };

        it('should return the client with the giving id',  async () => {
            // create authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // add a client to db
            const client =  new Client(tmp[0]);
            await client.save();
            // append the client id to request uri
            uri = uri + '/' + client._id;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test the if it's the right result
            expect(res.body).toMatchObject(tmp[0]);// the date need re-formatting
        });

        it('should return 404 if client id is invalid',  async () => {
            // create authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // append the client id to request uri
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
        let client;
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .post('/client')
                .send(client);
        };
        // The happy path 1
        it('should save the giving client in the db if everything is ok and return it',  async (done) => {
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
            // the client we are adding
            tmp[0].agency = agency._id.toString();
            client = tmp[0];
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test the if it's the right result
            expect(res.body).toMatchObject(_.omit(client, 'password'));// the date need re-formatting
            // test If the password match
            expect(res.body.state).toMatch('UNVERIFIED');
            // test If the password match
            expect(await bcrypt.compare(client.password, res.body.password)).toBeTruthy();
            // test if the client is saved in the database
            setTimeout(async () => {
                expect(await Client.estimatedDocumentCount()).toBe(1);
                done();
            },timeoutDelay)
        });
        // The happy path 2
        it('should generate a new VerificationToken and save it in the database',  async (done) => {
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
            // the client we are adding
            tmp[0].agency = agency._id.toString();
            client = tmp[0];
            // execute the request
            const res = await exec();
            expect(res.status).toBe(200);
            setTimeout(async () => {
                const nbreDoc = await VerificationToken.find();
                expect(nbreDoc.length).toBe(1);
                done();
            },timeoutDelay);

        });
        // agency not found
        it('should return 404 if the agency doesn\'t exist',  async () => {
            // the client we are adding
            tmp[0].agency = agencyId;
            client = tmp[0];
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
        });
 
    });

    describe('UPDATE Client (password is not included)', () => {
        // We need the jwt token to access the route
        let token = '';
        let uri = '/client';
        let client;
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
            // set the tmp client agency id to the created agency id
            tmp[1].agency = agency._id.toString();
            // generate authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // create the req object
            client = _.omit(tmp[1], 'password');
            // set the uri
            uri = '/client';
        });

        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .put(uri)
                .set('Authorization', token)
                .send(client);
        };
        // The happy path 1
        it('should update the client with the giving att && return the update client',  async (done) => {
            const clientObj = await new Client(tmp[1]).save();
            // change some att in client obj
            client.surname = 'surname updated';
            client.name = 'name updated';
            // remove also some other att to make sure the update doesn't need all the att
            client = _.omit(client, 'email');
            // add the client id to request uri
            uri = uri + '/' + clientObj._id;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if it's the right result
            expect(res.body).toMatchObject(_.omit(client, 'password')); // the date need re-formatting
            // test if the client is saved in the database
            setTimeout(async () => {
                expect(await Client.estimatedDocumentCount()).toBe(1);
                done();
            },timeoutDelay);
            // test if the client is updated in the db
            setTimeout(async () => {
                const clientFromDb = await Client.findOne({_id: clientObj._id});
                expect(clientFromDb.surname).toMatch(client.surname);
                expect(clientFromDb.name).toMatch(client.name);
                done();
            },timeoutDelay);
        });
        // Other bad path 1
        it('should return 404 if agency not found',  async () => {
            // append the client id to request uri
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // agency not found
            await Agency.deleteMany({}).exec();
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message).toContain('agency');
        });
        // Other bad path 2
        it('should return 404 if the client not found',  async () => {
            // append the client id to request uri
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('client') > -1 > -1).toBeTruthy();
        });
        // Other bad path 3
        it('should return 400 if we try to update the password',  async () => {
            const clientObj = await new Client(tmp[1]).save();
            // change some att in client obj
            client.surname = 'surname updated';
            client.name = 'name updated';
            client.password = 'i am a password';
            // add the client id to request uri
            uri = uri + '/' + clientObj._id;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
            // test the message
            expect(res.body.message).toContain('"password" is not allowed');
        });

    });

    describe('UPDATE Client password ', () => {
        // We need the jwt token to access the route
        let token = '';
        let uri = '';
        let updatePassword = {};

        //NOTE always make sure to clean up
        /** your mother isn't here so clean up after yourself **/
        // Mosh refactoring method
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
            // save the id of the created agency
            agencyId = agency._id;
            // generate authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // set the tmp client agency id to the created agency id
            tmp[1].agency = agency._id.toString();
            // save the pass plain text
            updatePassword.oldPassword = tmp[1].password;
            updatePassword.newPassword = '123456789';
            // hash the tmp client pass
            tmp[1].password = await bcrypt.hash(tmp[1].password, await bcrypt.genSalt(10));
            uri = '/client/password';
        });
        const exec = () => {
            return request(server)
                .patch(uri)
                .set('Authorization', token)
                .send(updatePassword);
        };
        // The happy path 1
        it('should update the client password when the old password is provided',  async (done) => {
            const clientId = (await new Client(tmp[1]).save())._id;
            // add the client id to request uri
            uri = uri + '/' + clientId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if the client is updated in the db
            setTimeout(async () => {
                const clientFromDb = await Client.findOne({_id: clientId});
                expect(await bcrypt.compare(updatePassword.newPassword, clientFromDb.password)).toBeTruthy();
                done();
            }, timeoutDelay);
        });
        // Other bad path 1
        it('should return 404 if the client not found',  async () => {
            // append the client id to request uri
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('client') > -1).toBeTruthy();
        });
        // Other bad path 2
        it('should return 401 if password is incorrect',  async () => {
            const clientId = (await new Client(tmp[1]).save())._id;
            // add the client id to request uri
            uri = uri + '/' + clientId;
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

    describe('DELETE Client', () => {
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
            // add a client to db with the agencyId we have just created
            tmp[1].agency = agency._id.toString();
            uri = '/client';
        });
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .delete(uri)
                .set('Authorization', token);
        };
        // The happy path 1
        it('should delete the client with the giving id',  async (done) => {
            const clientId = (await new Client(tmp[1]).save())._id;
            // add the client id to request uri
            uri = uri + '/' + clientId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if the client is deleted from the db
            setTimeout(async () => {
                const clientFromDb = await Client.findOne({_id: clientId});
                expect(clientFromDb).toBeNull();
                done();
            },timeoutDelay);
        });
        // Other bad path 1
        it('should return 404 if the client not found',  async () => {
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('client') > -1 > -1).toBeTruthy();
        });

    });

    describe('SUSPEND Client Account', () => {
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
            // add a client to db with the agencyId we have just created
            tmp[1].agency = agency._id.toString();
            uri = '/client/suspended';
        });
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .put(uri)
                .set('Authorization', token);
        };
        // The happy path
        it('should suspend the client with the giving id',  async (done) => {
            const clientId = (await new Client(tmp[1]).save())._id;
            // add the client id to request uri
            uri = uri + '/' + clientId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if the state of the client is changed in the db
            setTimeout(async () => {
                const clientFromDb = await Client.findOne({_id: clientId});
                expect(clientFromDb.state).toMatch('SUSPENDED');
                done();
            },timeoutDelay);
        });
        // Other bad path
        it('should return 404 if the client not found',  async () => {
            // append the client id to request uri
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('client') > -1).toBeTruthy();
        });

    });

    describe('CONFIRM Client Account', () => {
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
            // add a client to db with the agencyId we have just created
            tmp[1].agency = agency._id.toString();
            uri = '/client/confirmation';
        });
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .get(uri)
                .set('Authorization', token);
        };
        // The happy path
        it('should confirm the client account',  async (done) => {
            const clientId = (await new Client(tmp[1]).save())._id;
            // generate a token for the created client
            const validationToken = new VerificationToken({
                _clientId: clientId,
                token: crypto.randomBytes(12).toString('hex')
            });
            await validationToken.save();
            // add the token to request params
            uri = uri + '/' + validationToken.token;
            // execute the request
            const res = await exec();
            // console.log(res);
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if the state of the client is changed in the db
            setTimeout(async () => {
                const clientFromDb = await Client.findOne({_id: clientId});
                expect(clientFromDb.state).toMatch('PROFILE_NOT_COMPLETED');
                done();
            },timeoutDelay);
        });
        // Other bad path
        it('should return 404 if the client not found',  async () => {
            const clientId = new mongoose.Types.ObjectId;
            // generate a token for the created client
            const validationToken = new VerificationToken({
                _clientId: clientId,
                token: crypto.randomBytes(12).toString('hex')
            });
            await validationToken.save();
            // append the client id to request uri
            uri = uri + '/' + validationToken.token;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('client') > -1).toBeTruthy();
        });
        // Other bad path 2
        it('should return 404 if the token not found',  async () => {
            // append the token id to request uri (we are simulating the token with object id)
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('token') > -1).toBeTruthy();
        });

        it('should return 400 if the client account is already verified',  async (done) => {
            tmp[1].state = 'PROFILE_NOT_COMPLETED';
            const clientId = (await new Client(tmp[1]).save())._id;
            // generate a token for the created client
            const validationToken = new VerificationToken({
                _clientId: clientId,
                token: crypto.randomBytes(12).toString('hex')
            });
            await validationToken.save();
            // add the token to request params
            uri = uri + '/' + validationToken.token;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test the res message
            expect(res.body.message.indexOf('verified') > -1).toBeTruthy();
            done();
        });

    });

    describe('REQUEST Client Password reset', () => {
        // We need the jwt token to access the route
        let token = '';
        let uri = '';
        let email = '';
        //NOTE always make sure to clean up
        /** your mother isn't here so clean up after yourself **/
        beforeEach(async () => {
            // generate authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'client',
                role: 'client',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
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
            // assign the client to the created agency
            tmp[1].agency = agency._id.toString();
            // set the user email
            email = tmp[1].email;
            // set the request uri
            uri = '/client/password/reset';
        });
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .post(uri)
                .set('Authorization', token)
                .send({email: email})
        };
        // The happy path
        it('should create a reset password token',  async (done) => {
            // add a client to db with the agencyId we have just created
            const clientId = (await new Client(tmp[1]).save())._id;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if the token has been saved in the database
            setTimeout(async () => {
                const nbreDoc = await VerificationToken.find({_clientId: clientId});
                expect(nbreDoc.length).toBe(1);
                done();
            }, timeoutDelay);

        });
        // Other bad path
        it('should return 400 if the email is not provided',  async () => {
            // add a client to db with the agencyId we have just created
            await new Client(tmp[1]).save();
            // the email is not provided
            email = '';
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            expect(res.body.message.indexOf('email') > -1).toBeTruthy();
        });
        // Other bad path 2
        it('should return 404 if the client not found',  async () => {
            // the email is not provided
            email = 'test@test.test';
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            expect(res.body.message.indexOf('client') > -1).toBeTruthy();
        });

    });

    describe('RESET Client Password', () => {
        // We need the jwt token to access the route
        let token = '';
        let uri = '';
        let email = '';
        let resetPassToken = '';
        let password = '';
        //NOTE always make sure to clean up
        /** your mother isn't here so clean up after yourself **/
        // Mosh refactoring method
        beforeEach(async () => {
            // generate authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'client',
                role: 'client',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
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
            // assign the client to the created agency
            tmp[1].agency = agency._id.toString();
            // rest the reset token
            resetPassToken = '';
            // set the pass
            password = '123456789';
            // set the request uri
            uri = '/client/password/reset';
        });
        const exec = () => {
            return request(server)
                .patch(uri)
                .set('Authorization', token)
                .send({password: password})
        };
        // The happy path
        it('should Reset client password',  async (done) => {
            // add a client to db with the agencyId we have just created
            const clientId = (await new Client(tmp[1]).save())._id;
            // create a token for password reset in the database
            resetPassToken = (await new VerificationToken({
                _clientId: clientId,
                token: crypto.randomBytes(12).toString('hex')
            }).save()).token;
            // append the token to uri
            uri = uri + '/' + resetPassToken;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test the password is updated
            setTimeout(async () => {
                const clientFromDb = await Client.findOne({_id: clientId});
                expect(await bcrypt.compare(password, clientFromDb.password)).toBeTruthy();
                done();
            }, timeoutDelay);
        });
        // Other bad path
        it('should return 404 if reset pass token is not provided',  async () => {
            // add a client to db with the agencyId we have just created
            const clientId = (await new Client(tmp[1]).save())._id;
            // create a token for password reset in the database
            resetPassToken = (await new VerificationToken({
                _clientId: clientId,
                token: crypto.randomBytes(12).toString('hex')
            }).save()).token;
            // we are simulating the token with object id
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test the message
            expect(res.body.message.indexOf('token') > -1).toBeTruthy();
        });
        // Other bad path 2
        it('should return 400 if password not provided',  async () => {
            // add a client to db with the agencyId we have just created
            const clientId = (await new Client(tmp[1]).save())._id;
            // create a token for password reset in the database
            resetPassToken = (await new VerificationToken({
                _clientId: clientId,
                token: crypto.randomBytes(12).toString('hex')
            }).save()).token;
            // append the token to uri
            uri = uri + '/' + resetPassToken;
            // password is not provided
            password = '';
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test the message
            expect(res.body.message.indexOf('password') > -1).toBeTruthy();
        });

    });

});
