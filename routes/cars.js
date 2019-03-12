const {Car, validate} = require('../model/car');
const {Agency} = require('../model/agency');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const debugCars = require('debug')('app:cars');

// GET ALL
router.get('/', async (req, res) => {
    res.send(await Car.find());
});

// GET BY ID
router.get('/:id', validateObjectId, async (req, res) => {
    const car = await Car.findOne({_id: req.params.id});
    if (!car) return res.status(404).send(' The car with the giving id was not found');
    res.send(car);
});

// ADD New Car
router.post('/', async (req, res) => {
    // validate the request schema
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.body.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // save the new car
    const car = new Car(req.body);
    await car.save();
    res.send(car);
});

// UPDATE Car
router.put('/:id', validateObjectId, async (req, res) => {
    debugCars("Debugging PUT:/car/:id");
    debugCars("    the car id is:", req.params.id);
    // validate the request schema
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    // verify that the agency exist
    const agency = await Agency.findOne({_id: req.body.agency});
    if (!agency) return res.status(404).send(' The agency with the giving id was not found');
    // update the car with the giving id
    const car = await Car.findOneAndUpdate({ _id: req.params.id}, req.body, { new: true});
    // if the car wan not found return an error
    if (!car) return res.status(404).send(' The car with the giving id was not found');
    res.send(car);
});

// DELETE Car
router.delete('/:id', validateObjectId, async (req, res) => {
    const car = await Car.findOneAndDelete({ _id: req.params.id}.id);
    // if the car wan not found return an error
    if (!car) return res.status(404).send(' The car with the giving id was not found');
    res.send(car);
});
module.exports = router;
