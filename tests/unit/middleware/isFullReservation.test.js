const isFullReservation = require('../../../middleware/isFullReservation');

describe(' isFullReservation middleware', () => {
    it('make "isFullReservation = false" in the req body if "req.user.role" is "client"', () => {
        let req = {
            user: { role: 'client'},
            body: {}
        };
        let res ={};
        const next = jest.fn();
        isFullReservation(req, res, next);
        expect(req.body.isFullReservation).toBeFalsy();
    });

    it('make "isFullReservation = true" in the req.body if "req.user.role" is not "client"', () => {
        let req = {
            user: { role: 'monitor'},
            body: {}
        };
        let res ={};
        const next = jest.fn();
        isFullReservation(req, res, next);
        expect(req.body.isFullReservation).toBeTruthy();
    })
});
