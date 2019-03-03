const Joi = require('joi');
// Joi.objectId = require('joi-objectid')(Joi);

const joiExtended = Joi.extend({
    base: Joi.string(),
    name: 'string',
    language: {
        mobile: 'needs to be a valid phone number according to E.164 international format',
        email: 'needs to be a valid email format',
        objectId: 'needs to be a valid ID'

    },
    rules: [{
        name: 'phone',
        validate(params, value, state, options) {
            const reg = RegExp(/^\+?[1-9]\d{1,14}$/);
            if (!reg.test(value)) {
                return this.createError('string.mobile', {v: value}, state, options);
            }
                return value
        }
    },{
        name: 'email',
        validate(params, value, state, options) {
            const reg = RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/);
            if (!reg.test(value)) {
                return this.createError('string.email', {v: value}, state, options);
            }
            return value;
        }
    },{
        name: 'objectId',
        validate(params, value, state, options) {
            const reg = RegExp(/^[0-9a-fA-F]{24}$/);
            if (!reg.test(value)) {
                return this.createError('string.objectId', {v: value}, state, options);
            }
            return value;
        }
    }]
});

module.exports = joiExtended;
