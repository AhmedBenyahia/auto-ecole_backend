const mongoose = require('mongoose');


const notifSchema = new mongoose.Schema({
    subject: {
        type: String,
        maxlength: 255,
        required: true,
        trim: true,
    },
    data: {
        type: String,
        maxlength: 55,
        required: true,
        trim: true,
    },
    isViewed: {
        type: Boolean,
        default: false,
    },
    action: {
        type: String //TODO add enumeration
    },
    userId: mongoose.Types.ObjectId,
    agency: mongoose.Types.ObjectId,
});

const Notif = mongoose.model('Notif', notifSchema);

exports.Notif = Notif;
