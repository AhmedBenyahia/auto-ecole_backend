const express = require('express');
const router = express.Router();
const {Agency, validate} = require('../model/agency');
const {Manager} =require('../model/manager');
const  generator = require('generate-password');

router.get('/', async (req, res) => {
    res.send(await Agency.find());
});

router.post('/', async (req, res) => {
    // validate the request body
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // save the new agency
    const agency = new Agency(req.body);
    // TODO put this inside Task
    const manager = new Manager({
        username: agency.email,
        password: generator.generate({ // TODO hash the password
            length: 10,
            numbers: true
        }),
        role: "Admin"

    });
    // TODO add email plugin
    await agency.save();
    await manager.save();
    res.send(agency);
});


module.exports = router;
