// imports modules
const express = require('express');
const router = express.Router();
const {Manager, validate} = require('../model/manager');
const _ = require('lodash');
const bcrypt = require("bcrypt");
const validateObjectId = require('../middleware/validateObjectId');
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
    const {error} = validate(req.body);
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

module.exports = router;

