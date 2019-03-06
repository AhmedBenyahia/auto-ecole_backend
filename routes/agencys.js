const express = require('express');
const router = express.Router();
const {Agency, validate} = require('../model/agency');
const {Manager} =require('../model/manager');
const  generator = require('generate-password');
const bcrypt = require("bcrypt");

router.get('/', async (req, res) => {
    res.send(await Agency.find());
});

router.post('/', async (req, res) => {
    // validate the request body
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // save the new agency
    const agency = new Agency(req.body);
    const password = generator.generate({
        length: 10,
        numbers: true
    });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const manager = new Manager({
        username: agency.title,
        email: agency.email,
        password: passwordHash,
        role: "Admin",
        agency: agency._id
    });
    // TODO add email plugin
    // TODO put this inside Task
    await agency.save();
    await manager.save();
    res.send(agency + " \n admin password:" + password);
});


module.exports = router;
