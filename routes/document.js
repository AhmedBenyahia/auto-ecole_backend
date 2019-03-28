const {Client} = require('../model/client');
const {Monitor} = require('../model/monitor');
const express = require('express');
const router = express.Router();


let user ;


router.post('/upload/cin/:id', async function(req, res) {
    let user;
    if (Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    
if (req.user.role ==='client'){
     user = await Client.findOne({_id: req.body.clientId});
}
 
if (req.user.role ==='monitor'){
     user = await Monitor.findOne({_id: req.params.id});
}

// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile;

    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(`./upload/cin/${user.cin}`, function(err) {
        if (!err)  {
            console.log('ok, file has been uploaded') ;
            return res.send('File uploaded!');
        } else {
            console.log('no, The file has not been uploaded!!');
            return res.status(500).send(err);
        }
    });

});


router.post('/upload/license/:id', async function(req, res) {
    
    if (Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    
if (req.user.role ==='client'){
    const user = await Client.findOne({_id: req.params.id, agency: req.body.agency});
}
 
if (req.user.role ==='monitor'){
    const user = await Monitor.findOne({_id: req.params.id, agency: req.body.agency});
}

// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile;

    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(`./upload/permi/${user.drivingLicenceNum}`, function(err) {
        if (!err)  {
            console.log('ok, file has been uploaded');
            return res.send('File uploaded!');
        } else {
            console.log('no, The file has not been uploaded!!');
            return res.status(500).send(err);
        }
    });

});

module.exports = router;









