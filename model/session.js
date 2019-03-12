const mongoose = require('mongoose');
const Joi = require('joi');
const JoiExtended = require('../startup/validation');

    const sessionState = ['REQUESTED', 'APPROVED', 'CANCELED', 'CANCELLATION_REQUESTED', 'PENDING', 'FINISHED'];
const DAY = 24*60*60*1000;

const sessionSchema = new mongoose.Schema({

    client: {
        type: new mongoose.Schema({
            _id: mongoose.Types.ObjectId,
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
            _id: mongoose.Types.ObjectId,
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
            _id: mongoose.Types.ObjectId,
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

function validateReservationSchema(session) {
    const schema = {
        clientId: JoiExtended.string().objectId().required(),
        reservationDate: Joi.date().iso().min(Date.now()).min(Date.now() + DAY).required(),
        agency: JoiExtended.string().objectId().required(),
        // state: Joi.string().valid(sessionState),
        // isPayed: Joi.boolean(),
    };
    return Joi.validate(session, schema);
}

function validateApproveSchema(session) {
    const schema = {
        carId: JoiExtended.string().objectId().required(),
        monitorId: JoiExtended.string().objectId().required(),
    };
    return Joi.validate(session, schema);
}

function validateUpdateSchema(session) {
    const schema = {
        reservationDate: Joi.date().iso().min(Date.now()).max(Date.now() + DAY*30*6),
        carId: JoiExtended.string().objectId(),
        monitorId: JoiExtended.string().objectId(),
    };
    return Joi.validate(session, schema);
}

exports.sessionSchema = sessionSchema;
exports.Session = Session;
exports.validateReservation = validateReservationSchema;
exports.validateApproving = validateApproveSchema;
exports.validateUpdating = validateUpdateSchema;
exports.sessionState = sessionState;
