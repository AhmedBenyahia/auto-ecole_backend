const mongoose = require('mongoose');
const Joi = require('joi');

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
        role: Joi.number().required()
    };
    return Joi.validate(manager, schema);
}

exports.managerSchema = managerSchema;
exports.Manager = Manager;
exports.validate = validateSchema;
