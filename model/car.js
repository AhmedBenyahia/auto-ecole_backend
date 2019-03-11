const mongoose = require('mongoose');
const JoiExtended = require('../startup/validation');

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
            type: String,
            required: true,
            trim: true,
            minLength: 1,
            maxLength: 25
    },
    state: {
        type: String, //TODO add enum for car state
        trim: true,
        default: "Active",
    },
    agency: mongoose.Types.ObjectId,
});

const Car = mongoose.model('Cars', carSchema);

function validateSchema(car) {
    const schema = {
        num: JoiExtended.string().length(11).required(),
        mark: JoiExtended.string().min(3).max(15).required(),
        model: JoiExtended.string().min(1).max(25).required(),
        // state: JoiExtended.string(), // TODO: add joi validation for state enum
        agency: JoiExtended.string().objectId().required()
    };
    return JoiExtended.validate(car, schema);
}

exports.carSchema = carSchema;
exports.Car = Car;
exports.validate = validateSchema;
