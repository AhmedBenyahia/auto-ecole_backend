const error = require('../../../middleware/error');

describe('error middleware', () => {
    it(' should return 500 if there is unhandled error', async () => {
        const res = {
            status: (c) => {this.c = c; return {send: (s) => {this.s = s; return this}}} ,
            c: 200,
            s: 'OK',
        };
        const req = {};
        const next = jest.fn();
        const err = () => {
            throw new Error()
        };
        const errorHandler = error(err, req, res, next);
        expect(errorHandler).toMatchObject({c: 500, s: 'Something failed'});
    });
});
