const mongoose = require('mongoose');
const Joi = require('joi');
const JoiExtended = require('../startup/validation');

const clientState = ['UNVERIFIED','PROFILE_NOT_COMPLETED','READY','LEARNING',
                     'DRIVING', 'INACTIVE', 'SUSPENDED', 'RETIRED'];
            //TODO: The client state should give you witch phase
           //TODO: the client has reach in his driving licence (code, conduite)

const clientSchema = new mongoose.Schema({
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
   name: {
       type: String,
       required: true,
       minLength: 4,
       maxLength: 55,
       trim: true,
   },
   cin: {
        type: String,
        minlength: 8,
        maxlength: 8,
        trim: true,
        required: true,
        unique: true,
    },
   cinDate: {
        type: Date,
        required: true,
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
   email : {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxlength: 255,
        minlength: 5,
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
   drivingLicenceType: {
       type: String, // TODO: add enum att
       minLength: 1,
       maxLength: 6,
       trim: true,
       default: null,
   },
   drivingLicenceNum: {
        type: String,
        minLength: 8,
        maxLength: 8,
        trim: true,
        default: null,
    },
   state: {
       type: String, //TODO add enum for client state
       trim: true,
       enum: clientState,
       default: clientState[0],
   },
   hasPack: {
       type: Boolean,
       default: false,
   },
   agency: mongoose.Types.ObjectId,
});

const Client = mongoose.model('Clients', clientSchema);

function validateSchema(client, newClient) {
    const schema = Joi.object().keys({
        username: Joi.string().min(4).max(55)
        .when('$condition', {
                is: Joi.boolean().valid(true),
                then: Joi.required()}),
        password: Joi.string().min(8).max(255)
        .when('$condition', {
                is: Joi.boolean().valid(true),
                then: Joi.required(),
                otherwise: Joi.forbidden()}),
        name: Joi.string().min(4).max(55)
        .when('$condition', {
                is: Joi.boolean().valid(true),
                then: Joi.required()}),
        surname: Joi.string().min(4).max(55)
        .when('$condition', {
                is: Joi.boolean().valid(true),
                then: Joi.required()}),
        cin: JoiExtended.string().cin()
            .when('$condition', {
                is: Joi.boolean().valid(true),
                then: Joi.required()}),
        cinDate: Joi.date()
            .when('$condition', {
                is: Joi.boolean().valid(true),
                then: Joi.required()}),
        phone: JoiExtended.string().phone()
        .when('$condition', {
                is: Joi.boolean().valid(true),
                then: Joi.required()}),
        email: JoiExtended.string().email()
        .when('$condition', {
                is: Joi.boolean().valid(true),
                then: Joi.required()}),
            agency: JoiExtended.string().objectId().required(),
        address: Joi.string().max(255).min(5),
        postalCode: Joi.string().min(4).max(10),
        drivingLicenceType: Joi.string().min(1).max(6), // TODO: add joi validation for driving licence type with enum
        drivingLicenceNum: Joi.string().length(8), // TODO add validation of num (number only)
    });
    return Joi.validate(client, schema, {context: {condition: newClient}});
}

exports.clientSchema = clientSchema;
exports.Client = Client;
exports.validate = validateSchema;
exports.clientState = clientState;
