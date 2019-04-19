const {Agency} = require('../../../model/agency');
const {Manager} = require('../../../model/manager');
const request = require('supertest');

let server;
const timeoutDelay = 100;
// clean the database
const cleanDB = async () => {
    await Agency.deleteMany({}).exec();
    await Manager.deleteMany({}).exec();
};
// !important NOTE: make sure to use done() every time we have async
// callback or Timeout FN, if not we will get unpredictable error in unpredictable place
describe('agency routes', () => {

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
    let agencyId;
    let tmp = [
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

    describe('GET ALL', () => {
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .get('/agency')
        };

        it('should return the list of the agency in the agency',  async (done) => {
            // add some agency to db
            let agency =  new Agency(tmp[0]);
            await agency.save();
            agency =  new Agency(tmp[1]);
            await agency.save();
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


    // NOTE: i am not going to validate the Joi schema because it's simple and doesn't need test
    // FUTURE: we can unit test the joi validation fn
    describe('ADD New', () => {
        let agency = tmp[0];
        // Mosh refactoring method
        const exec = () => {
            return request(server)
                .post('/agency')
                .send(agency);
        };
        // The happy path 1
        it('should save the giving agency in the db if everything is ok and return it',  async (done) => {
            // execute the request
            const res = await exec();
            // test the status of the request
            expect(res.status).toBe(200);
            // test is the body of the request is defined
            expect(res.body).toBeDefined();
            // test if it's the right result
            expect(res.body).toMatchObject(agency);
            // test if the agency is saved in the database
            setTimeout(async () => {
                expect(await Agency.estimatedDocumentCount()).toBe(1);
                done();
            },timeoutDelay)
        });
        // The happy path 2
        it('should generate a new Manager and save it in the database',  async (done) => {
            // execute the request
            const res = await exec();
            expect(res.status).toBe(200);
            setTimeout(async () => {
                const manager = await Manager.findOne({agency: res.body._id});
                expect(manager).toBeDefined();
                done();
            },timeoutDelay);

        });

    });


});
