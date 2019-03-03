'use strict';

var assert = require('assert');

module.exports = function joiPhone(Joi) {
    assert(Joi && Joi.isJoi, 'you must pass Joi as an argument');

    return function phone() {
        return Joi.string().regex(/^[+][0-9]{11}$/)
            .label('the phone form should be:');
    };
};
