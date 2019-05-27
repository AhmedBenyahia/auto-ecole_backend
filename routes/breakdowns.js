const {Breakdown,validatebreakdownSchema,breakdownstate} = require('../model/breakdown');
const {Agency} = require('../model/agency');
const {Monitor} = require('../model/monitor');
const {Car,carState} = require('../model/car');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const _ = require('lodash');
const breakdownDebug = require('debug')('app:breakdown');


// GET ALL
router.get('/', async (req, res) => {
    res.send(await Breakdown.find({ agency: req.user.agency}));
});

// GET BY ID
router.get('/:id', validateObjectId, async (req, res) => {
    const breakdown = await Breakdown.findOne({_id: req.params.id, agency: req.user.agency});
    if (!breakdown) return res.status(404).send({message: ' The breakdown with the giving id was not found'});
    res.send(breakdown);
});

router.post('/announced',  async (req, res) => {
    breakdownDebug('debugging /announced endpoint');
    breakdownDebug('    breakdown reason:', req.body.raisonbreakdown);
    // validate the request schema
    const {error} = validatebreakdownSchema(req.body);
    if (error) return res.status(400).send({message: error.details[0].message});
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.user.agency});
    if (!agency) return res.status(404).send({message: ' The agency with the giving id was not found'});
    // verify that the monitor exist
    if (req.body.monitorId){
        const monitor = await Monitor.findOne({_id: req.body.monitorId, agency: req.user.agency});
        if (!monitor) return res.status(404).send({message: ' The MONITEUR with the giving id was not found'});
    }
    // verify that the car doesn't have a reservation in the same date and it's APPROVED
    const car = await Car.findOne({_id: req.body.carId, agency: req.user.agency});
    if (!car) return res.status(404).send({message: ' The car with the giving id was not found'});
     

    breakdown = new Breakdown({
        raisonbreakdown: req.body.raisonbreakdown,
        car:_.pick(car, ['_id', 'num', 'mark','model','state']),
        agency: req.user.agency,
    });

    if (req.body.monitor) {
        breakdown.monitor = _.pick(monitor, ['_id', 'name', 'surname']);
    }

    // save the new session
    await breakdown.save();
    return res.send(breakdown);
});

router.delete('/:id',  async (req, res) => {
    const breakdown = await Breakdown.findOneAndDelete({ _id: req.params.id, agency: req.body.agency});
    // if the car wan not found return an error
    if (!breakdown) return res.status(404).send({message: ' The breakdown objcet  with the giving id was not found'});
    res.send(breakdown);
});

router.patch('/fixed/:id', async (req, res) => {
    breakdownDebug('debugging /fixed endpoint');
    // validate the request schema
    let breakdown = await Breakdown.findOne({_id: req.params.id, agency: req.body.agency});
    if (!breakdown) return res.status(404)
        .send({message: ' The breakdown with the giving id was not found'});
    // if (breakdown.state !== breakdownstate[0]) return res.status(406).send({message: 'Only annoced exam state'});
    const car = await Car.findOne({_id: breakdown.car._id, agency: req.body.agency});
    if (breakdown.iscritical === true) {
        car.state = carState[0];
        await car.save();
    }
    breakdown.state = breakdownstate[1];
    await breakdown.save();
    res.send(breakdown);
});

router.patch('/iscritical/:id', async (req, res) => {
    breakdownDebug('debugging /is critical endpoint');
    // validate the request schema
    let breakdown = await Breakdown.findOne({_id: req.params.id, agency: req.body.agency});
    if (!breakdown) return res.status(404).send({message: ' The breakdown with the giving id was not found'});
    const car = await Car.findOne({_id: breakdown.car._id, agency: req.body.agency});
    car.state = carState[1];
    await car.save();
    breakdown.iscritical = true;
    breakdown.state=breakdownstate[0];
    await breakdown.save();
    res.send(breakdown);
});


module.exports = router;

