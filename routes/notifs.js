const {Notif} = require('../model/notif');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', async (req, res) => {
    res.send(await Notif.find({agency: req.user.agency, userId: undefined}));
});

router.get('/client/:id', validateObjectId, async (req, res) => {
    res.send(await Notif.find({agency: req.user.agency, userId: req.params.id}));
});

router.get('/monitor/:id', validateObjectId, async (req, res) => {
    res.send(await Notif.find({agency: req.user.agency, userId: req.params.id}));
});

router.patch('/viewed/:id', validateObjectId, async (req, res) => {
    const notif = await Notif.findOne({agency: req.user.agency, _id: req.params.id});
    notif.isViewed = true;
    notif.save();
    res.send(notif);
});

module.exports = router;
