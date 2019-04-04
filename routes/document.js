const {Session, sessionState} = require('../model/session');
const {Client} = require('../model/client');
const {Monitor} = require('../model/monitor');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const PDFDocument = require('../middleware/pdfkit-tables');
const moment = require('moment');
const docDebug = require('debug')('app:doc');
const Joi = require('joi');
const __dir__ = __dirname + '/../';
resolve = require('path').resolve;

router.post('/upload/cin/:id', async function(req, res) {
    let user;
    if (Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    if (req.user.role === 'client') {
        user = await Client.findOne({_id: req.params.id});
    }

    if (req.user.role === 'monitor') {
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
    let user;
    
    if (Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    if (req.user.role === 'client') {
        user = await Client.findOne({_id: req.params.id});
    }

    if (req.user.role === 'monitor') {
        user = await Monitor.findOne({_id: req.params.id});
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

router.get('/history/monitor/:id', async (req, res) => {
    docDebug('Debugging /history/monitor/:id');
    // create new PDF document
    const doc = new PDFDocument();
    // create writer stream to save the pdf on disk , the file name is the monitor id
    const path = './download/' + req.params.id + '.pdf';
    const ws = fs.createWriteStream('download/' + req.params.id + '.pdf');
    doc.pipe(ws);
    // define the table structure
    let tab = {
        headers: ['Date', 'Client', 'Car'],
        rows: []
    };
    // find the monitor session
    // TODO: add date selection
    const sessions = await Session.find({'monitor._id': req.params.id});
    // add monitor session to the table
    sessions.forEach((c) => {
        if (c.state === sessionState[3])
            tab.rows.push([
                moment(c.reservationDate).format("dddd, MMMM Do YYYY, h:mm a"),
                c.client.name + ' ' + c.client.surname,
                c.car.mark + ' ' + c.car.model
            ])
    });
    // def a title for the document
    doc
        .fontSize(20)
        .text('La Liste des session de traveil', 170, 100);
    // set table font type and size
    doc.moveDown().table(tab, 70, 200, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(13),
        prepareRow: (row, i) => {
            doc.font('Helvetica').fontSize(13);
        },
        cellWidth: [0, 0.2, 0.1]
    });
    //save doc
    doc.end();
    docDebug('      The PDF is ready to be send to client !! \n      sending...');
    // prepare the header of the response
    const file = fs.createReadStream(resolve(path));
    const stat = fs.statSync(resolve(path));
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + req.params + '.pdf');
    // send the file when the write stream on disk end
    ws.on('close', () => {
        res.download(resolve(path))
    });
});

router.get('/timetable/client/:id', async (req, res) => {
    docDebug('Debugging /timetable/client/:id');
    // create new PDF document
    const doc = new PDFDocument();
    // create writer stream to save the pdf on disk , the file name is the monitor id
    const path = './download/' + req.params.id + '.pdf';
    const ws = fs.createWriteStream('download/' + req.params.id + '.pdf');
    doc.pipe(ws);
    // define the table structure
    let tab = {
        headers: ['Date', 'Monitor', 'Car'],
        rows: []
    };
    // find the monitor session
    // TODO: add date selection
    const sessions = await Session.find({'client._id': req.params.id}).sort('reservationDate');
    // add monitor session to the table
    sessions.forEach((c) => {
        if (c.state === sessionState[1])
            tab.rows.push([
                moment(c.reservationDate).format("dddd, MMMM Do YYYY, h:mm a"),
                c.monitor.name + ' ' + c.monitor.surname,
                c.car.mark + ' ' + c.car.model
            ])
    });
    // def a title for the document
    doc.fontSize(20)
        .text('Emploi du temps', 170, 100);
    // set table font type and size
    doc.moveDown().table(tab, 70, 200, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(13),
        prepareRow: (row, i) => {
            doc.font('Helvetica').fontSize(13);
        },
        cellWidth: [0, 0.2, 0.1]
    });
    //save doc
    doc.end();
    docDebug('      The PDF is ready to be send to client !! \n      sending...');
    // prepare the header of the response
    const file = fs.createReadStream(resolve(path));
    const stat = fs.statSync(resolve(path));
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + req.params.id + '.pdf');
    // send the file when the write stream on disk end
    ws.on('close', () => {
        res.download(resolve(path))
    });
});

module.exports = router;









