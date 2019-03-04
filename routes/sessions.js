const {Session, validateReservation, validateApproving, sessionState} = require('../model/session');
const {Agency} = require('../model/agency');
const {Client} = require('../model/client');
const {Monitor} = require('../model/monitor');
const {Car} = require('../model/car');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const _ = require('lodash');
// GET ALL
router.get('/', async (req, res) => {
    res.send(await Session.find());
});

// GET BY ID
router.get('/:id', validateObjectId, async (req, res) => {
    const session = await Session.findOne({_id: req.params.id});
    if (!session) return res.status(404).send(' The session with the giving id was not found');
    res.send(session);
});

// Request Session Reservation
router.post('/reserve', async (req, res) => {
    // validate the request schema
    const {error} = validateReservation(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.body.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // verify that the client exist
    const client = await Client.findOne({_id: req.body.clientId});
    if (!client) return res.status(404).send(' The client with the giving id was not found');
    // verify that the client doesn't have a reservation in the same date
    let session = await Session.find({
        reservationDate: req.body.reservationDate,
        client: client
    });
    if (session) return res.status(400).send(' The giving client has already a session on the reservation date');
    // save the new session
     session = new Session({
        client: _.pick(client, ['_id','name', 'surname', 'state', 'drivingLicence']),
        reservationDate: req.body.reservationDate,
        agency: req.body.agency,
    });
    await session.save();
    res.send(session);
});
// Approve Session Reservation
router.patch('/approve/:id', async (req, res) => {
    // validate the request schema
    const {error} = validateApproving(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the session exist
    let session = await Session.findOne({ _id: req.params.id});
    if (!session) return res.status(404).send(' The session with the giving id was not found');
    // verify that the car exist
    const car = await Car.findOne({_id: req.body.carId});
    if (!car) return res.status(404).send(' The car with the giving id was not found');
    // verify that the car is not reserved on the specified date
    const oldSession = await Session.findOne({
        reservationDate: session.reservationDate,
        car: car
    });
    if (oldSession) return res.status(400).send('The giving car is not available on the reservation date');
    // verify that the monitor exist
    const monitor = await Monitor.findOne({_id: req.body.monitorId});
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    // verify that the monitor is not reserved on the specified date
    const oldMonitor = await Monitor.findOne({
        reservationDate: session.reservationDate,
        monitor: monitor
    });
    if (oldMonitor) return res.status(400).send('The giving monitor is not available on the reservation date');

    // update the session
    session.car =  _.pick(car, ['_id','num', 'mark', 'model']);
    session.monitor = _.pick(monitor, ['_id','name', 'surname', 'certification']);
    session.state = sessionState[1];
    await session.save();
    res.send(session);
});

// UPDATE Session
router.put('/:id', validateObjectId, async (req, res) => {
    // validate the request schema
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.body.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // verify that the client exist
    const client = await Client.findOne({_id: req.body.clientId});
    if (!client) return res.status(404).send(' The client with the giving id was not found');
    // verify that the car exist
    const car = await Car.findOne({_id: req.body.carId});
    if (!car) return res.status(404).send(' The car with the giving id was not found');
    // verify that the monitor exist
    const monitor = await Monitor.findOne({_id: req.body.monitorId});
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    // update the session with the giving id
    const session = await Session.findOneAndUpdate(req.params.id, {
        client: _.pick(client, ['name', 'surname', 'state', 'drivingLicence']),
        car: _.pick(car, ['num', 'mark', 'model']),
        monitor: _.pick(monitor, ['name', 'surname', 'certification']),
        reservationDate: req.body.reservationDate,
        agency: req.body.agency,
        state: req.body.state,
    }, { new: true});
    // if the session wan not found return an error
    if (!session) return res.status(404).send(' The session with the giving id was not found');
    res.send(session);
});

// DELETE Session
router.delete('/:id', validateObjectId, async (req, res) => {
    const session = await Session.findOneAndDelete(req.params.id);
    // if the session wan not found return an error
    if (!session) return res.status(404).send(' The session with the giving id was not found');
    res.send(session);
});
module.exports = router;
