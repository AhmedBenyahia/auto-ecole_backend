const mongoose = require('mongoose');
const Joi = require('joi');

const monitorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 4,
        maxLength: 55,
        trim: true,
    },
    surname: {
        type: String,
        required: true,
        minLength: 4,
        maxLength: 55,
        trim: true,
    },
    address: {
        type: String,
        maxLength: 255,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        minLength: 8,
        maxLength: 13,
        trim: true,
    },
    postalCode: {
        type: String,
        minLength: 4,
        maxLength: 10,
    },
    certification: {
        type: String, // TODO: add enum att to certification
        minLength: 1,
        maxLength: 6,
        trim: true,
        required: true,
    },
    state: {
        type: String, //TODO add enum for monitor state
        required: true,
        trim: true,
        default: null,
    },
});

const Monitor = mongoose.model('Monitor', monitorSchema);

function validateSchema(monitor) {
    const schema = {
        name: Joi.string().min(4).max(55).required(),
        surname: Joi.string().min(4).max(55).required(),
        address: Joi.string().max(255).min(5),
        phone: Joi.string().min(8).max(13).required(),
        postalCode: Joi.string().min(4).max(10),
        certification: Joi.string().min(1).max(6).required(), // TODO: add joi validation for monitor certification  type with enum
        state: Joi.string(), // TODO: add joi validation for state enum
    };
    return Joi.validate(monitor, schema);
}

exports.monitorSchema = monitorSchema;
exports.Monitor = Monitor;
exports.validate = validateSchema;
