const mongoose = require('mongoose');
const Joi = require('joi');
const DAY = 24*60*60*1000;
const joiExtended = require('../startup/validation');
const agencySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 4,
        maxLength: 255,
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
    email : {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxlength: 255,
        minlength: 5,
    },
    licenceExpirationDate: {
        type: Date,
        default: Date.now() + 365 * DAY,
    },
    state: {
        type: String, //TODO add enum for agency state
        trim: true,
        default: null,
    },  // TODO make the state enum
    logo: {
        type: String,
        minLength: 1,
        maxLength: 255
    }, //TODO add logo validation
});

const Agency = mongoose.model('Agency', agencySchema);

function validateSchema(agency) {
    // console.log("test:" + Joi.objectId);
    const schema = {
        title: Joi.string().min(4).max(55).required(),
        address: Joi.string().max(255).min(5),
        phone: joiExtended.string().phone().min(8).max(13).required(), //TO DO add phone function
        postalCode: Joi.string().min(4).max(10),
        state: Joi.string(), // TODO: add joi validation for state enum
        email: joiExtended.string().email().required(),
    };
    return Joi.validate(agency, schema);
}

exports.agencySchema = agencySchema;
exports.Agency = Agency;
exports.validate = validateSchema;
