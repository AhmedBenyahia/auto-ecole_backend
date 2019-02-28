const mongoose = require('mongoose');
const Joi = require('joi');

const clientSchema = new mongoose.Schema({
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
   drivingLicence: {
       type: String, // TODO: add enum att
       minLength: 1,
       maxLength: 6,
       trim: true,
       default: null,
       required: true,
   },
   state: {
       type: String, //TODO add enum for client state
       required: true,
       trim: true,
       default: null,
   },
   hasPack: {
       type: Boolean,
       required: true,
       default: false,
   }
});

const Client = mongoose.model('Clients', clientSchema);

function validateSchema(client) {
    const schema = {
        name: Joi.string().min(4).max(55).required(),
        surname: Joi.string().min(4).max(55).required(),
        address: Joi.string().max(255).min(5),
        phone: Joi.string().min(8).max(13).required(),
        postalCode: Joi.string().min(4).max(10),
        drivingLicence: Joi.string().min(1).max(6), // TODO: add joi validation for driving licence type with enum
        state: Joi.string(), // TODO: add joi validation for state enum
        hasPack: Joi.boolean(),
    };
    return Joi.validate(client, schema);
}

exports.clientSchema = clientSchema;
exports.Client = Client;
exports.validate = validateSchema;
