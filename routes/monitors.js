const {Monitor, validate} = require('../model/monitor');
const {Agency} = require('../model/agency');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');

// GET ALL
router.get('/', async (req, res) => {
    res.send(await Monitor.find());
});

// GET BY ID
router.get('/:id', validateObjectId, async (req, res) => {
    const monitor = await Monitor.findOne({_id: req.params.id});
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    res.send(monitor);
});

// ADD New Monitor
router.post('/', async (req, res) => {
    // validate the request schema
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = Agency.find({_id: req.body.agency});
    if (!agency) if (!monitor) return res.status(404).send(' The agency with the giving id was not found');
    // save the new monitor
    const monitor = new Monitor(req.body);
    await monitor.save();
    res.send(monitor);
});

// UPDATE Monitor
router.post('/:id', validateObjectId, async (req, res) => {
    // validate the request schema
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = Agency.find({_id: req.body.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // update the monitor with the giving id
    const monitor = await Monitor.findOneAndUpdate(req.body._id, req.body);
    // if the monitor wan not found return an error
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    res.send(monitor);
});

// DELETE Monitor
router.delete('/:id', validateObjectId, async (req, res) => {
    const monitor = await Monitor.findOneAndDelete(req.params.id);
    // if the monitor wan not found return an error
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    res.send(monitor);
});
module.exports = router;
