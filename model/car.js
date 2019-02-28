const mongoose = require('mongoose');
const Joi = require('joi');

const carSchema = new mongoose.Schema({
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
        type: {
            type: String,
            required: true,
            trim: true,
            minLength: 1,
            maxLength: 25
        }
    },
    state: {
        type: String, //TODO add enum for car state
        required: true,
        trim: true,
        default: null,
    },
});

const Car = mongoose.model('Cars', carSchema);

function validateSchema(car) {
    const schema = {
        num: Joi.string().length(11).required(),
        mark: Joi.string().min(3).max(15).required(),
        model: Joi.string().min(1).max(25).required(),
        state: Joi.string(), // TODO: add joi validation for state enum
    };
    return Joi.validate(car, schema);
}

exports.carSchema = carSchema;
exports.Car = Car;
exports.validate = validateSchema;
