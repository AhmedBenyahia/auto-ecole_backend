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
    username: {
        type: String,
        required: true,
        minLength: 4,
        maxLength: 55,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 255,
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
    agency: mongoose.Types.ObjectId,
});

const Monitor = mongoose.model('Monitor', monitorSchema);

function validateSchema(monitor) {
    const schema = {
        name: Joi.string().min(4).max(55).required(),
        surname: Joi.string().min(4).max(55).required(),
        email: Joi.string().min(5).max(255).regex(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
            .required().label("the email provided us invalid"),
        password: Joi.string().min(8).max(255).required(),
        address: Joi.string().max(255).min(5),
        phone: Joi.string().min(8).max(13).required(),
        postalCode: Joi.string().min(4).max(10),
        certification: Joi.string().min(1).max(6).required(), // TODO: add joi validation for monitor certification  type with enum
        state: Joi.string(), // TODO: add joi validation for state enum
        agency: Joi.objectId().required(),

};
    return Joi.validate(monitor, schema);
}

exports.monitorSchema = monitorSchema;
exports.Monitor = Monitor;
exports.validate = validateSchema;
