const usernameGenerator = require('username-generator');
const {Car} = require('../../../model/car');
const {Agency} = require('../../../model/agency');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
let server;
const timeoutDelay = 100;
// clean the database
const cleanDB = async () => {
    await Car.deleteMany({}).exec();
    await Agency.deleteMany({}).exec();
};
// !important NOTE:make sure to use done() every time we have async
// callback or Timeout FN, if not we will get unpredictable error in unpredictable place
describe('car routes', () => {

    beforeEach(async (done) => {
        server = require('../../../app');
        await cleanDB();
        tmp = [
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
        done();
    });

    afterEach( async (done) => {
        await cleanDB();
        server.close();
        done();
    });

    // Global test var
    let agencyId = (new mongoose.Types.ObjectId).toString();
    let tmp;

    describe('GET ALL', () => {
        // we need the agency id to add new car and to create the token
        // We need the jwt token to access the route
        let token;
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .get('/car')
                .set('Authorization', token);
        };

        it('should return the list of the cars in the agency',  async (done) => {
            // create authentication token
            token = jwt.sign({
                _id: new mongoose.Types.ObjectId,
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // add some cars to db
            await new Car(tmp[0]).save();
            await new Car(tmp[1]).save();
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
        let uri = '/car';

        const exec = () => {
            return request(server)
                .get(uri)
                .set('Authorization', token);
        };

        it('should return the car with the giving id',  async () => {
            // create authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            const car =  new Car(tmp[0]);
            await car.save();
            // append the car id to request uri
            uri = uri + '/' + car._id;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test the if it's the right result
            expect(res.body).toMatchObject(tmp[0]);// the date need re-formatting
        });

        it('should return 404 if car id is invalid',  async () => {
            // create authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // append the car id to request uri
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
        let car;
        let token;
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
            // create authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agency._id,
            }, config.get('jwtPrivateKey').toString());
            // set the agency of the car we are adding to the created agency id
            tmp[0].agency = agency._id.toString();
            car = tmp[0];
        });
        const exec = () => {
            return request(server)
                .post('/car')
                .set('Authorization', token)
                .send(car);
        };
        // The happy path 1
        it('should save the giving car in the db if everything is ok and return it',  async (done) => {
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test if the body of the request is defined
            expect(res.body).toBeDefined();
            // test  if it's the right result
            expect(res.body).toMatchObject(car);// the date need re-formatting
            // test the state of the car match
            expect(res.body.state).toMatch('ACTIVE');
            // test if the car is saved in the database
            setTimeout(async () => {
                expect(await Car.estimatedDocumentCount()).toBe(1);
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
            car.num = '';
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(400);
        });

    });

    describe('UPDATE Car ', () => {
        // We need the jwt token to access the route
        let token = '';
        let uri = '/car';
        let car;
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
            // set the tmp car agency id to the created agency id
            tmp[1].agency = agency._id.toString();
            // generate authentication token
            token = jwt.sign({
                _id: (new mongoose.Types.ObjectId).toString(),
                username: 'admin',
                role: 'admin',
                agency: agencyId,
            }, config.get('jwtPrivateKey').toString());
            // create the req object
            car = tmp[1];
            // set the uri
            uri = '/car';
        });

        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .put(uri)
                .set('Authorization', token)
                .send(car);
        };
        // The happy path 1
        it('should update the car with the giving att && return the update car',  async (done) => {
            // add new car do db
            const carObj = await new Car(tmp[1]).save();
            // change some att in car obj
            car.model = 'model updated';
            car.mark = 'mark updated';
            // add the car id to request uri
            uri = uri + '/' + carObj._id;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if it's the right result
            expect(res.body).toMatchObject(car);
            // test if the car is saved in the database
            setTimeout(async () => {
                expect(await Car.estimatedDocumentCount()).toBe(1);
                done();
            },timeoutDelay);
            // test if the car is updated in the db
            setTimeout(async () => {
                const carFromDb = await Car.findOne({_id: carObj._id});
                expect(carFromDb.model).toMatch(car.model);
                expect(carFromDb.mark).toMatch(car.mark);
                done();
            },timeoutDelay);
        });
        // Other bad path 1
        it('should return 404 if agency not found',  async () => {
            // append the car id to request uri
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
        it('should return 404 if the car not found',  async () => {
            // append the car id to request uri
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('car') > -1 > -1).toBeTruthy();
        });

    });

    describe('DELETE Car', () => {
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
            // add a car to db with the agencyId we have just created
            tmp[1].agency = agency._id.toString();
            uri = '/car';
        });
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .delete(uri)
                .set('Authorization', token);
        };
        // The happy path 1
        it('should delete the car with the giving id',  async (done) => {
            const carId = (await new Car(tmp[1]).save())._id;
            // add the car id to request uri
            uri = uri + '/' + carId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if the car is deleted from the db
            setTimeout(async () => {
                const carFromDb = await Car.findOne({_id: carId});
                expect(carFromDb).toBeNull();
                done();
            },timeoutDelay);
        });
        // Other bad path 1
        it('should return 404 if the car not found',  async () => {
            uri = uri + '/' + new mongoose.Types.ObjectId;
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(404);
            // test the message.
            expect(res.body.message.indexOf('car') > -1 > -1).toBeTruthy();
        });

    });

});
