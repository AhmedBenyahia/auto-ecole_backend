const {Client, validate} = require('../model/client');
const {Agency} = require('../model/agency');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const _ = require('lodash');
const bcrypt = require("bcrypt");

// GET ALL
router.get('/', async (req, res) => {
    res.send(await Client.find());
});

// GET BY ID
router.get('/:id', validateObjectId, async (req, res) => {
    const client = await Client.findOne({_id: req.params.id});
    if (!client) return res.status(404).send(' The client with the giving id was not found');
    res.send(client);
});

// ADD New Client
router.post('/', async (req, res) => {
    // validate the request schema
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.body.agency});
    if (!agency) if (!client) return res.status(404).send(' The agency with the giving id was not found');
    // save the new client
    const client = new Client(_.omit(req.body,['password']));
    const salt = await bcrypt.genSalt(10);
    client.password = await bcrypt.hash(req.body.password, salt);
    await client.save();
    res.send(client);
});

// UPDATE Client
router.put('/:id', validateObjectId, async (req, res) => {
    // validate the request schema
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.body.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // verify if we are updating the password
    // update the client with the giving id
    const client = await Client.findOneAndUpdate(req.params.id, req.body, { new: true});
    // if the client wan not found return an error
    if (!client) return res.status(404).send(' The client with the giving id was not found');
    res.send(client);
});

// DELETE Client
router.delete('/:id', validateObjectId, async (req, res) => {
    const client = await Client.findOneAndDelete(req.params.id);
    // if the client wan not found return an error
    if (!client) return res.status(404).send(' The client with the giving id was not found');
    res.send(client);
});
module.exports = router;
