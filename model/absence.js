const mongoose = require('mongoose');
const Joi = require('joi');
const JoiExtended = require('../startup/validation');
const DAY = 24 * 60 * 60 * 1000;

let absenceSchema = new mongoose.Schema({
    debDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    raison:{
        type: String ,
        required:true
    },
    agency: mongoose.Types.ObjectId,
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
          
        }),
    },


});
const Absenc = mongoose.model('Absenc', absenceSchema);

function validateReservationSchema(absenc) {
    const schema = Joi.object().keys({
        
        debDate: Joi.date().iso().min(Date.now()).min(Date.now() + DAY).required(),
        endDate:Joi.date().iso().min(Date.now()).min(Date.now() + (2*DAY)).required(),
        monitorId:JoiExtended.string().objectId().required(),
        agency: JoiExtended.string().objectId().required(),
        raison: Joi.string(),
    });
    return Joi.validate(absenc, schema);
}

exports.absenceSchema = absenceSchema;
exports.Absenc = Absenc;
exports.validateReservationSchema = validateReservationSchema ;

