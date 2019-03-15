const {Monitor, validate} = require('../model/monitor');
const {Agency} = require('../model/agency');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const usernameGenerator = require('username-generator');
const  passwordGenerator = require('generate-password');

const _ = require('lodash');
const bcrypt = require("bcrypt");
const Joi =require('joi');

// GET ALL
router.get('/', async (req, res) => {
    res.send(await Monitor.find({ agency: req.user.agency}));
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
    const {error} = validate(req.body, true);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = await Agency.find({_id: req.body.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // save the new monitor
    const monitor = new Monitor(req.body);
        //generate a username
    monitor.username = usernameGenerator.generateUsername("-");
    const salt = await bcrypt.genSalt(10);
        // generate a password and hash it
    const password = passwordGenerator.generate({length: 8, numbers: true});
    monitor.password = await bcrypt.hash(password, salt);
        // save in the db
    await monitor.save();
    // send the new monitor object to the client with the password in plain  text
    monitor.password = password;
    res.send(monitor);
});

// UPDATE the password
router.patch('/password/:id', validateObjectId, async (req, res) => {
    // validate the request schema
    const {error} = Joi.validate(req.body, {
        newPassword: Joi.string().min(8).max(255).required(),
        oldPassword: Joi.string().min(8).max(255).required()
    });
    if (error) return res.status(400).send(error.details[0].message);
    // verify if monitor exist
    let monitor = await Monitor.findOne({ _id: req.params.id });
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    // verify if the old password is valid
    if (await bcrypt.compare(req.body.oldPassword, monitor.password)) {
        const salt = await bcrypt.genSalt(10);
        monitor.password = await bcrypt.hash(req.body.newPassword, salt);
        // update the monitor password
        await monitor.save();
        return res.send(monitor);
    }
    // the password is incorrect
    res.status(401).send(" Incorrect password!! ");
});

// UPDATE Monitor
router.put('/:id', validateObjectId, async (req, res) => {
    // validate the request schema
    const {error} = validate(req.body, false);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.body.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // update the monitor with the giving id
    const monitor = await Monitor.findOneAndUpdate({ _id: req.params.id}, req.body, { new: true});
    // if the monitor wan not found return an error
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    res.send(monitor);
});

// DELETE Monitor
router.delete('/:id', validateObjectId, async (req, res) => {
    const monitor = await Monitor.findOneAndDelete({ _id: req.params.id});
    // if the monitor wan not found return an error
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    res.send(monitor);
});
module.exports = router;
