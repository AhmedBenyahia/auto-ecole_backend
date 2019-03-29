const {Exame,validatescheduleed,succeedexam,faildeexam,exameSchema,exameState,validateUpdate} = require('../model/exame');
const {Agency} = require('../model/agency');
const {Client} = require('../model/client');
const {Monitor} = require('../model/monitor');
const {Car} = require('../model/car');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const _ = require('lodash');
const exameDebug = require('debug')('app:exame');
const DAY = 24*60*60*1000;


// GET ALL
router.get('/', async (req, res) => {
    res.send(await Exame.find({ agency: req.user.agency}));
});

// GET BY ID
router.get('/:id', validateObjectId, async (req, res) => {
    const exame = await Exame.findOne({_id: req.params.id, agency: req.user.agency});
    if (!exame) return res.status(404).send({message: ' The exame with the giving id was not found'});
    res.send(exame);
});

// GET Client exame

// GET Monitor exame


router.post('/scheduleed',  async (req, res) => {
    exameDebug('debugging /exame endpoint');
    // validate the request schema
    const {error} = validatescheduleed(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.user.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // verify that the client exist
    const client = await Client.findOne({_id: req.body.clientId, agency: req.user.agency});
    if (!client) return res.status(404).send(' The client with the giving id was not found');
    // verify that the client doesn't have a reservation in the same date and it's APPROVED
    const monitor = await Monitor.findOne({_id: req.body.monitorId, agency: req.user.agency});
    if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    // verifiey the car ..
     const car = await Car.findOne({_id: req.body.carId, agency: req.user.agency});
    if (!car) return res.status(404).send(' The car with the giving id was not found');
       
    // save the new exame
      let exame = new Exame({
        client: _.pick(client, ['_id','name', 'surname', 'state', 'drivingLicenceType']),
        monitor:_.pick(monitor, ['_id','name', 'surname', 'certification']),
        car:_.pick(car, ['_id','num', 'mark', 'model']),
        numexam:req.body.numexam,
        examDate: req.body.examDate,
        agency: req.body.agency,


    });
    await exame.save();
    res.send(exame);
});
router.patch('/succeed/:id', async (req, res) => {
    exameDebug('debugging /exame endpoint');
    // validate the request schema
    const {error} = succeedexam(req.body);
    if (error) return res.status(400).send({message: error.details[0].message});
    // verify that the session exist
    let exame = await Exame.findOne({ _id: req.params.id, agency: req.user.agency});
    if (!exame) return res.status(404).send(' The exame with the giving id was not found');
    // verify if the state of the session is REQUESTED
    exameDebug('  Exame State: ', exame.state);
    if (exame.state !== exameState[0]) return res.status(406).send('Only scheduleed exame state');
    // verify that the car exist
  
    

    
    // set the exame
    exame.examinateur = req.body.examinateur;  
    exame.state = exameState[1];
    await exame.save();
    res.send(exame);
});






router.patch('/failed/:id', async (req, res) => {
    exameDebug('debugging /exame endpoint');
    // validate the request schema
    const {error} = faildeexam(req.body);
    if (error) return res.status(400).send({message: error.details[0].message});
    // verify that the session exist
    let exame = await Exame.findOne({ _id: req.params.id, agency: req.user.agency});
    if (!exame) return res.status(404).send(' The exame with the giving id was not found');
    // verify if the state of the session is REQUESTED
   
    if (exame.state !== exameState[0]) return res.status(406).send('Only scheduleed exame state');
    
  
    

    
    // set the exame
    exame.examinateur = req.body.examinateur;  
    exame.state = exameState[2];
    await exame.save();
    res.send(exame);
});


router.patch('/reset/:id', async (req, res) => {
    exameDebug('debugging /exame endpoint');
    // validate the request schema
    
    // verify that the session exist
    let exame = await Exame.findOne({ _id: req.params.id, agency: req.user.agency});
    if (!exame) return res.status(404).send(' The exame with the giving id was not found');
    // verify if the state of the session is REQUESTED
   
    if (exame.state == exameState[0]) return res.status(406).send('Only  exame state for rest');

    
  
    

    
    // set the exame
    exame.state = exameState[0];
   
    await exame.save();
    res.send(exame);
});





// UPDATE Client
router.put('/:id', async (req, res) => {
    // validate the request schema
    const {error} = validateUpdate(req.body, false);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.body.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
// verify that the client exist
const client = await Client.findOne({_id: req.body.clientId});
if (!client) return res.status(404).send(' The Client with the giving id was not found');
// verify that the car exist
const car = await Car.findOne({_id: req.body.carId});
if (!car) return res.status(404).send(' The car with the giving id was not found');
// verify that the moniteur exist
const monitor = await Monitor.findOne({_id: req.body.monitorId});
if (!monitor) return res.status(404).send(' The monitor with the giving id was not found');
    

    // update the client with the giving id
    const exame = await Exame.findOneAndUpdate({ _id: req.params.id, agency: req.body.agency}, req.body, { new: true});
    // if the client wan not found return an error
    if (!exame) return res.status(404).send(' The exame with the giving id was not found');
    res.send(exame);
});



module.exports = router;


