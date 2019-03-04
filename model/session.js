const mongoose = require('mongoose');
const Joi = require('joi');
const JoiExtended = require('../startup/validation');

const sessionState = ['REQUESTED', 'APPROVED', 'CANCELED', 'CANCELLATION_REQUESTED', 'PENDING', 'FINISHED'];

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
            },
            drivingLicence: {
                type: String, // TODO: add enum att and num licence if exist
                minLength: 1,
                maxLength: 6,
                trim: true,
                default: null,
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
    },
    reservationDate: {
        type: Date,
        required: true
    },
    state: {
        type: String, //TODO add enum for session state
        enum: sessionState,
        trim: true,
        default: sessionState[0],
    },
    isPayed: {
        type: Boolean,
        default: false,
    },
    agency: mongoose.Types.ObjectId,
});

const Session = mongoose.model('Session', sessionSchema);

function validateSchema(session) {
    const schema = {
        clientId: JoiExtended.string().objectId().required(),
        carId: JoiExtended.string().objectId(),
        monitorId: JoiExtended.string().objectId(),
        reservationDate: Joi.string().isoDate().required(),
        state: Joi.string().valid(sessionState),
        agency: JoiExtended.string().objectId().required(),
        isPayed: Joi.boolean(),
    };
    return Joi.validate(session, schema);
}

exports.sessionSchema = sessionSchema;
exports.Session = Session;
exports.validate = validateSchema;
exports.sessionState = sessionState;
