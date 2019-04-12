const mongoose = require('mongoose');
const Joi = require('joi');
const JoiExtended = require('../startup/validation');
const breakdownstate = ['announced', 'fixed'];


let breakdownSchema = new mongoose.Schema({
   
    

    raisonbreakdown:{
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
    iscritical: {
        type: Boolean,
        default:false
    },
    state: {
        type: String, //TODO 
        enum: breakdownstate,
        trim: true,
        default: breakdownstate[0],
    },


    


});
const Breakdown = mongoose.model('breakdown', breakdownSchema);


function validatebreakdownSchema(breakdown) {
    const schema = Joi.object().keys({
        
        raisonbreakdown: Joi.string().required(),
        carId: JoiExtended.string().objectId(),
        monitorId: JoiExtended.string().objectId(),
        agency: JoiExtended.string().objectId().required(),
    });
    return Joi.validate(breakdown, schema);
}





exports.Breakdown=Breakdown;
exports.validatebreakdownSchema=validatebreakdownSchema;
exports.breakdownstate=breakdownstate