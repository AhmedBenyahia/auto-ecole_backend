// imports modules
const express = require('express');
const router = express.Router();
const {Manager, validate} = require('../model/manager');
const _ = require('lodash');
const bcrypt = require("bcrypt");
const validateObjectId = require('../middleware/validateObjectId');
const Joi = require('joi');
// const auth = require('../middleware/auth');

// GET ALL
router.get('/', async (req, res) => {
    res.send(await Manager.find());
});

// GET BY ID
router.get('/:id', validateObjectId, async (req, res) => {
    const manager = await Manager.findOne({_id: req.params.id});
    if (!manager) return res.status(404).send(' The manager with the giving id was not found');
    res.send(manager);
});

// * Create new manager
router.post('/', async (req, res) => {
    // validate request body
    const {error} = validate(req.body, true);
    if (error) return res.status(400).send(error.details[0].message);

    // verify if the manager is already registered
    let manager = await Manager.findOne({ username: req.body.username });
    if (manager) return res.status(400).send('Manager already registered !');

    // create and save the new manager
    manager = new Manager(_.omit(req.body,['password']));
    const salt = await bcrypt.genSalt(10);
    manager.password = await bcrypt.hash(req.body.password, salt);
    await manager.save();
    res.send(manager);
});

// UPDATE the password
router.patch('/password/:id', validateObjectId, async (req, res) => {
    // validate the request schema
    const {error} = Joi.validate(req.body, {
        newPassword: Joi.string().min(8).max(255).required(),
        oldPassword: Joi.string().min(8).max(255).required()
    });
    if (error) return res.status(400).send(error.details[0].message);
    // verify if manager exist
    let manager = await Manager.findOne({ _id: req.params.id });
    if (!manager) return res.status(404).send(' The manager with the giving id was not found');
    // verify if the old password is valid
    if (await bcrypt.compare(req.body.oldPassword, manager.password)) {
        const salt = await bcrypt.genSalt(10);
        manager.password = await bcrypt.hash(req.body.newPassword, salt);
        // update the manager password
        await manager.save();
        return res.send(manager);
    }
    // the password is incorrect
    res.status(401).send(" Incorrect password!! ");
});

module.exports = router;

