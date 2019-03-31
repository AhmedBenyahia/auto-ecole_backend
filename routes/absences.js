const {absenceSchema,Absenc,validateReservationSchema} = require('../model/absence');
const {Agency} = require('../model/agency');
const {Monitor} = require('../model/monitor');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const _ = require('lodash');
const absencDebug = require('debug')('app:Absenc');
const DAY = 24*60*60*1000;

absencDebug('absenc debugging is enabled');


router.get('/', async (req, res) => {
    res.send(await Absenc.find({ agency: req.user.agency}));
});


router.get('/:id', validateObjectId, async (req, res) => {
    const absenc = await Absenc.findOne({_id: req.params.id, agency: req.user.agency});
    if (!absenc) return res.status(404).send(' The Absenc with the giving id was not found');
    res.send(absenc);
});


router.post('/reserve',  async (req, res) => {
    absencDebug('debugging /reserve endpoint');
    // validate the request schema
    const {error} = validateReservationSchema(req.body);
    if (error) return res.status(400).send({message: error.details[0].message});
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.user.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // verify that the client exist
    const monitor = await Monitor.findOne({_id: req.body.monitorId, agency: req.user.agency});
    if (!monitor) return res.status(404).send(' The MONITEUR with the giving id was not found');
    // verify that the client doesn't have a reservation in the same date and it's APPROVED
    
        
    
    // add the client, reservation to the new session
    absenc = new Absenc({
        monitor:_.pick(monitor, ['_id', 'name', 'surname']),
        debDate: req.body.debDate,
        endDate:req.body.endDate,
        raison:req.body.raison,
        agency: req.user.agency,
    });
   
    // save the new session
    await absenc.save();
    res.send(absenc);
});


router.delete('/:id',  async (req, res) => {
    const absenc = await Absenc.findOneAndDelete({ _id: req.params.id, agency: req.body.agency});
    // if the car wan not found return an error
    if (!absenc) return res.status(404).send(' The Absenc objcet  with the giving id was not found');
    res.send(absenc);
});

module.exports = router;


