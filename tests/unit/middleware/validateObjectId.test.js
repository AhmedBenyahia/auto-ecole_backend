const validateObjectIdTest = require('../../../middleware/validateObjectId');
const mongoose = require('mongoose');
describe('validateObjectIdTest middleware', () => {
    it(' should return 404 if the is is invalid', async () => {
        // fake res obj
        const res = {
            status: (s) => {
                this.s = s;
                return { send: (m) => {this.m = m; return this} }
            },
            s: 200,
            m: 'OK',
        };
        const req = { params: { id: ' '} };
        const next = jest.fn();
        const objectIdHandler = validateObjectIdTest(req, res, next);
        expect(objectIdHandler).toMatchObject({s: 404, m: 'Invalid Id'});
    });

    it(' should call next() if the id is valid', async () => {
        // fake res obj
        const res = {
            status: (s) => {
                this.s = s;
                return { send: (m) => {this.m = m; return this} }
            },
            s: 200,
            m: 'OK',
        };
        const req = { params: { id: new mongoose.Types.ObjectId }};
        const next = () => 0;
        const objectIdHandler = validateObjectIdTest(req, res, next);
        expect(objectIdHandler).toBe(0);
    });
});
