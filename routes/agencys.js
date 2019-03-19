const express = require('express');
const router = express.Router();
const {Agency, validate} = require('../model/agency');
const {Manager} =require('../model/manager');
const bcrypt = require("bcrypt");
const usernameGenerator = require('username-generator');
const  passwordGenerator = require('generate-password');
const sendMail = require('../startup/mailer');

router.get('/', async (req, res) => {
    res.send(await Agency.find());
});

router.post('/', async (req, res) => {
    // validate the request body
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // save the new agency
    const agency = new Agency(req.body);
    const password = passwordGenerator.generate({ length: 10, numbers: true });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const manager = new Manager({
        username: usernameGenerator.generateUsername('-'),
        email: agency.email,
        password: passwordHash,
        role: "admin",
        agency: agency._id
    });
    sendMail(agency.email,
        'Ajout d\' un nouveau moniteur',
        'Un nouveau agence auto-ecole a ete ajouter, the admin information are: <br>' +
        `Title: ${agency.title}, email: ${agency.email} <br>` +
        `Username: ${manager.username} Password: ${password} <br>`);
    // TODO put this inside Task
    await agency.save();
    await manager.save();
    agency.password = password;
    res.send(agency);
});


module.exports = router;
