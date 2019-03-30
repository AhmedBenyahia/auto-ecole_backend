const mongoose = require('mongoose');
const Joi = require('joi');
const JoiExtended = require('../startup/validation');
const DAY = 24 * 60 * 60 * 1000;

let absenceSchema = new mongoose.Schema({});
