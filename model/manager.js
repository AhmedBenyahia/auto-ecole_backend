const mongoose = require('mongoose');
const Joi = require('joi');
const JoiExtended = require('../startup/validation');
const managerSchema = new mongoose.Schema({
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
    email : {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxlength: 255,
        minlength: 5,
    },
    role: {
        type: String,
        required: true,
    },
    agency: mongoose.Types.ObjectId,
});

const Manager = mongoose.model('Managers', managerSchema);

function validateSchema(manager) {
    const schema = {
        username: Joi.string().min(4).max(55).required(),
        password: Joi.string().min(8).max(255).required(),
        email: JoiExtended.string().email().required(),
        role: Joi.string().required(), //TODO add manager role enum
        agency: JoiExtended.string().objectId().required(),
    };
    return Joi.validate(manager, schema);
}

exports.managerSchema = managerSchema;
exports.Manager = Manager;
exports.validate = validateSchema;
