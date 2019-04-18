const express = require('express');
const router = express.Router();
const {Client} = require('../model/client');
const {Monitor} = require('../model/monitor');
const {Manager} = require('../model/manager');
const bcrypt = require("bcrypt");
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');
const authenticationDebug = require('debug')('app:authentication');
// * user login
router.post('/login', async (req, res) => {
    authenticationDebug('Debugging /login');
    // validate request body
    const {error} = validate(req.body);
    if (error) return res.status(400).send({message: error.details[0].message});

    // verify if it's a client
    const client = await Client.findOne({ username: req.body.username });
    if (client && await bcrypt.compare(req.body.password, client.password)) {
         client.role = 'client';
         return res.send(generateAuthToken(client));
    }
    // verify if it's a monitor
    const monitor = await Monitor.findOne({ username: req.body.username });
    if (monitor && await bcrypt.compare(req.body.password, monitor.password)) {
        monitor.role = 'monitor';
        return res.send(generateAuthToken(monitor));
    }
    // verify if it's a manager
    const manager = await Manager.findOne({ username: req.body.username });
    if (manager && await bcrypt.compare(req.body.password, manager.password)) {
        return res.send(generateAuthToken(manager));
    }
    return res.status(400).send({message: 'Invalid username or password'});
});

// information about the login user
router.get('/whoami', async (req, res) => {
    // const user = await Manager.findOne({ _id: req.body.user._id}).select('-password');
    // res.send(manager);
});


//

function validate(req) {
    const schema = {
        username: Joi.string().min(4).max(55).required(),
        password: Joi.string().min(8).max(255).required()
    };
    return Joi.validate(req, schema);
}

function generateAuthToken(user) {
    return jwt.sign({
            _id: user._id,
            username: user.username,
            role: user.role,
            agency: user.agency,
        }, config.get('jwtPrivateKey').toString()
    );
}

module.exports = router;

