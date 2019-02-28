const mongoose = require('mongoose');
const Joi = require('joi');

const sessionSchema = new mongoose.Schema({

    client: {
        type: new mongoose.Schema({
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
            state: {
                type: String, //TODO add enum for client state
                required: true,
                trim: true,
            }
        }),
        required: true,
    },
    monitor: {
        type: new mongoose.Schema({
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
            certification: {
                type: String, // TODO: add enum att to certification
                minLength: 1,
                maxLength: 6,
                trim: true,
                required: true,
            },
        }),
        required: true,
    },
    car: {
        type: new mongoose.Schema({
            num: {
                type: String,
                required: true,
                trim: true,
                length: 11,
            },
            mark: {
                type: String,
                required: true,
                trim: true,
                minLength: 3,
                maxLength: 15
            },
            model: {
                type: String,
                required: true,
                trim: true,
                minLength: 1,
                maxLength: 25

            },
        }),
        required: true,
    },
    reservationDate: {
        type: Date,
        required: true
    },
    state: {
        type: String, //TODO add enum for session state
        required: true,
        trim: true,
        default: "Pending"
    },
    isPayed: {
        type: Boolean,
        default: false,
        required: true,
    }
});

const Session = mongoose.model('Session', sessionSchema);

function validateSchema(session) {
    const schema = {
        clientId: Joi.objectId().required(),
        carId: Joi.objectId().required(),
        monitorId: Joi.objectId().required(),
        state: Joi.string(), // TODO: add joi validation for state enum
    };
    return Joi.validate(session, schema);
}

exports.sessionSchema = sessionSchema;
exports.Session = Session;
exports.validate = validateSchema;
