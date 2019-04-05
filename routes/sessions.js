const {Session, validateReservation, validateApproving, validateUpdating, sessionState} = require('../model/session');
const {Agency} = require('../model/agency');
const {Client} = require('../model/client');
const {Monitor} = require('../model/monitor');
const {Car} = require('../model/car');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const _ = require('lodash');
const sessionDebug = require('debug')('app:session');
const DAY = 24*60*60*1000;
const isFullReservation = require('../middleware/isFullReservation');
sessionDebug('session debugging is enabled');

// GET ALL
router.get('/', async (req, res) => {
    res.send(await Session.find({ agency: req.user.agency}));
});

// GET BY ID
router.get('/:id', validateObjectId, async (req, res) => {
    const session = await Session.findOne({_id: req.params.id, agency: req.user.agency});
    if (!session) return res.status(404).send(' The session with the giving id was not found');
    res.send(session);
});

// GET Client Session
router.get('/client/:id', async (req, res) => {
    sessionDebug('debugging session/client/:id endpoint');
    res.send(await Session.find({ 'client._id': req.params.id}));
});

// GET Monitor Session
router.get('/monitor/:id', async (req, res) => {
    res.send(await Session.find({ 'monitor._id': req.params.id}));
});

// Request Session Reservation
router.post('/reserve', isFullReservation, async (req, res) => {
    sessionDebug('debugging /reserve endpoint');
    // validate the request schema
    const {error} = validateReservation(req.body);
    if (error) return res.status(400).send({message: error.details[0].message});
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.user.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // verify that the client exist
    const client = await Client.findOne({_id: req.body.clientId, agency: req.user.agency});
    if (!client) return res.status(404).send(' The client with the giving id was not found');
    // verify that the client doesn't have a reservation in the same date and it's APPROVED
    let session = await Session
        .find({
            reservationDate: req.body.reservationDate,
            'client._id': req.body.clientId, // safer than client: client
        })
        .or([
            {state: sessionState[0]},
            {state: sessionState[1]},
            {state: sessionState[4]}, // TODO: add undo canceling if session is re-reserved
        ]);
    sessionDebug('Duplicated reservation with the same client and same date:', session.length !== 0);
    if (session.length !== 0) {
        return res.status(400).send(' The giving client has already a session on the reservation date');
    }
    // add the client, reservation to the new session
    session = new Session({
        client: _.pick(client, ['_id', 'name', 'surname', 'state', 'drivingLicenceType']),
        reservationDate: req.body.reservationDate,
        agency: req.user.agency,
    });
    if (req.body.isFullReservation) {
        // verify that the car exist
        const car = await Car.findOne({_id: req.body.carId, agency: req.user.agency});
        if (!car) return res.status(404).send(' The car with the giving id was not found');
        // verify that the car is not reserved on the specified date
        let otherSession = await Session
            .find({
                reservationDate: session.reservationDate,
                'car._id': car._id
            })
            .or([
                {state: sessionState[0]},
                {state: sessionState[1]},
                {state: sessionState[4]},
            ]);
        sessionDebug('  Duplicated reservation with the same car and same date:',
            otherSession.length !== 0, " Nbre: ", otherSession.length);
        if (otherSession.length !== 0) return res.status(400).send('The giving car is not available on the reservation date');
        // verify that the monitor exist
        const monitor = await Monitor.findOne({_id: req.body.monitorId, agency: req.user.agency});
        if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
        // verify that the monitor is not reserved on the specified date
        otherSession = await Session
            .find({
                reservationDate: session.reservationDate,
                'monitor._id': monitor._id
            })
            .or([
                {state: sessionState[0]},
                {state: sessionState[1]},
                {state: sessionState[4]},
            ]);
        sessionDebug('  Duplicated reservation with the same monitor and same date:',
            otherSession.length !== 0, " Nbre: ", otherSession.length);
        if (otherSession.length !== 0) return res.status(400).send('The giving monitor is not available on the reservation date');

        // add the car and monitor if the session isFullReservation
        session.car = _.pick(car, ['_id', 'num', 'mark', 'model']);
        session.monitor = _.pick(monitor, ['_id', 'name', 'surname', 'certification']);
    }
    // save the new session
    await session.save();
    res.send(session);
});

// Approve Session Reservation
router.patch('/approve/:id', async (req, res) => {
    sessionDebug('debugging /approve endpoint');
    // validate the request schema
    const {error} = validateApproving(req.body);
    if (error) return res.status(400).send({message: error.details[0].message});
    // verify that the session exist
    let session = await Session.findOne({ _id: req.params.id, agency: req.user.agency});
    if (!session) return res.status(404).send(' The session with the giving id was not found');
    // verify if the state of the session is REQUESTED
    sessionDebug('  Session State: ', session.state);
    if (session.state !== sessionState[0]) return res.status(406).send('Only approve session with REQUESTED state');
    // verify that the car exist
    const car = await Car.findOne({_id: req.body.carId, agency: req.user.agency});
    if (!car) return res.status(404).send(' The car with the giving id was not found');
    // verify that the car is not reserved on the specified date
    let otherSession = await Session
        .find({
            reservationDate: session.reservationDate,
            'car._id': car._id
        })
        .or([
            {state: sessionState[1]},
            {state: sessionState[3]},
        ]);
    sessionDebug('  Duplicated reservation with the same car and same date:',
        otherSession.length !== 0," Nbre: ", otherSession.length);
    if (otherSession.length !== 0) return res.status(400).send('The giving car is not available on the reservation date');
    // verify that the monitor exist
    const monitor = await Monitor.findOne({_id: req.body.monitorId, agency: req.user.agency});
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    // verify that the monitor is not reserved on the specified date
     otherSession = await Session
        .find({
            reservationDate: session.reservationDate ,
            'monitor._id': monitor._id
        })
        .or([
            {state: sessionState[1]},
            {state: sessionState[4]},
        ]);
    sessionDebug('  Duplicated reservation with the same monitor and same date:',
        otherSession.length !== 0," Nbre: ", otherSession.length);
    if (otherSession.length !== 0) return res.status(400).send('The giving monitor is not available on the reservation date');

    // update the session
    session.car =  _.pick(car, ['_id','num', 'mark', 'model']);
    session.monitor = _.pick(monitor, ['_id','name', 'surname', 'certification']);
    session.state = sessionState[1];
    await session.save();
    res.send(session);
});
// TODO: Refactor this method
// UPDATE Session: change monitor, car or date
// NOTE: the patch will not pass unless all the passed value are verified
router.patch('/update/:id', validateObjectId, async (req, res) => {
    sessionDebug('Debugging /update/:id session endpoint');
    // validate the request schema
    const {error} = validateUpdating(req.body);
    if (error) return res.status(400).send({message: error.details[0].message});
    //verify the existence of the session
    let session = await Session.findOne({ _id: req.params.id, agency: req.user.agency});
    if (!session) return res.status(404).send(' The session with the giving id was not found');
    // verify if the state of the session is APPROVED, PENDING or FINISHED
    sessionDebug('  session state:', session.state);
    if (!([sessionState[1],sessionState[4],sessionState[5]].find(c => c === session.state))) {
        return res.status(406).send('Only update session with APPROVED, PENDING or FINISHED state');
    }
    // get the reservation date form the request body if provided, or from the session in the db
    let  reservationDate = (req.body.reservationDate)
        ? req.body.reservationDate
        : session.reservationDate;
    // get the monitor id from the request body if provided , or from the session in the db
    let  monitorId = (req.body.monitorId)
        ? req.body.monitorId
        : session.monitor._id;
    // get the car id from the request body if provided , or from the session in the db
    let  carId = (req.body.carId)
        ? req.body.carId
        : session.car._id;

    // verify that the car exist
    const car = await Car.findOne({_id: carId, agency: req.user.agency});
    sessionDebug('  we are updating the session with this car: ', carId);
    if (!car) return res.status(404).send(' The car with the giving id was not found');
    // verify that the car is not reserved on the reservation date
    let otherSession = await Session.find({
        reservationDate: reservationDate,
        'car._id': car._id
    });
    if (otherSession.length > 1) return res.status(400).send('The giving car is not available on the reservation date');

    // verify that the monitor exist
    const monitor = await Monitor.findOne({_id: monitorId, agency: req.user.agency});
    sessionDebug('  we are updating the session with this monitor: ', monitorId);
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    // verify that the monitor is not reserved on the reservation date
     otherSession = await Session.find({
        reservationDate: reservationDate,
        'monitor._id': monitor._id
    });
    if (otherSession.length > 1) return res.status(400).send({message: 'The giving monitor is not available on the reservation date'});

    // update the session if everything is OK
    sessionDebug('  we are updating the session with this dare: ', reservationDate);
    if (req.body.reservationDate) session.reservationDate = reservationDate;
    if (req.body.carId) session.car = _.pick(car, ['num', 'mark', 'model']);
    if (req.body.monitorId) session.monitor = _.pick(monitor, ['_id','name', 'surname', 'certification']);
    await session.save();
    res.send(session);
});

// REJECT Session
router.delete('/reject/:id', validateObjectId, async (req, res) => {
    sessionDebug('Debugging /session/reject/:id');
    const session = await Session.findOne({ _id: req.params.id, agency: req.user.agency });
    // if the session was not found return an error
    if (!session) return res.status(404).send(' The session with the giving id was not found');
    // if the status of the session is REQUESTED
    if (session.state === sessionState[0]){
        await session.delete();
        return res.send(session);
    }
    return res.status(409).send('deleting is allowed only if the session is in REQUESTING state ');
});

// CANCEL Session
router.patch('/cancel/:id', validateObjectId, async (req, res) => {
    // if the session wan not found return an error
    const session = await Session.findOne({_id: req.params.id, agency: req.user.agency});
    if (!session) return res.status(404).send(' The session with the giving id was not found');
    // if the status of the session is REQUESTED
    if (session.state === sessionState[0]) { // TODO: add forwarding
        await session.delete();
        return res.send(session);
    }
    // if the status of the session is APPROVED
    if (session.state === sessionState[1]) {
        // verify if we are 24H far from the date of the reservation
        sessionDebug('verifying time remaining before the session is greater than 24H: ', session.reservationDate - Date.now() > DAY," ",session.reservationDate - Date.now());
        if (session.reservationDate - Date.now() > DAY) {
            // if so change the state of the session to canceled
            session.state = sessionState[2];
            await session.save();
            return res.send(session);
        }
    }
    // if the session is already canceled
    if (session.state === sessionState[2]) {
        return res.status(409).send('session is already canceled');
    }
    return res.status(409).send('canceling is only allowed  if the session is REQUESTED or APPROVED');
});
module.exports = router;
