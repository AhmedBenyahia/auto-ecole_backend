const notifyDebug = require('debug')('app:notify');
const {Notif} = require('../model/notif');

module.exports.connect = (io) => {
    io.connectedUser = [];
    io.on('connection', function (socket) {

        notifyDebug("Socket established with id: " + socket.id);
        // notifyDebug("Connected User: ", io.connectedUser.length, ":");
        // io.connectedUser.forEach((c) => {
        //     notifyDebug("   Role: ", c.role, "SocketId:",c.socketId);
        // });

        socket.emit('connection', 'connected');
        socket.emit('ping', {greeting: "hello world"});

        socket.on('save-user', function (data) {
            notifyDebug("User (" + data.role + ")connection channel saved: " + socket.id);
            notifyDebug("joining user to channel: " + data.role + "Channel#" +
                data.agency.slice(-4));
            if (!io.connectedUser.find(c => c.socketId === socket.id)) {
                data.socketId = socket.id;
                io.connectedUser.push(data); //TODO add jwt validation
                // notifyDebug('socket.client obj: ', io.connectedUser[data._id]);
            }
            notifyDebug("Connected User: ", io.connectedUser.length, ":");
            io.connectedUser.forEach((c) => {
                notifyDebug("   Role: ", c.role, "SocketId:", c.socketId);
            });
            if (data.role === 'admin') {
                socket.join('adminChannel#' + data.agency.slice(-4))
            } else if (data.role === 'monitor') {
                socket.join('monitorChannel#' + data.agency.slice(-4))
            } else socket.join('clientChannel#' + data.agency.slice(-4));

            socket.to('adminChannel#' + data.agency.slice(-4))
                .emit('news', 'New player has joined the game');
        });
        socket.on('disconnect', function () {
            notifyDebug("Socket disconnected: " + socket.id);
            io.connectedUser = io.connectedUser.filter(c => c.socketId !== socket.id);
            notifyDebug("Connected User: ", io.connectedUser.length, ":");
            io.connectedUser.forEach((c) => {
                notifyDebug("   Role: ", c.role, "SocketId:", c.socketId);
            });
        });
    })
};

module.exports.newClientNotif = async (req, client) => {
    notifyDebug('newClientNotif');
    const notif = new Notif({
        subject: 'un nouveau client a inscrit dans votre agence',
        data: client._id,
        action: 'ClientRegistered',
        agency: req.user.agency,
    });
    await notif.save();
    req.app.io.to('adminChannel#' + req.body.agency.slice(-4))
        .emit('news', notif);

};

module.exports.sessionReservationNotif = async (req, session) => {
    notifyDebug('sessionReservationNotif');
    notifyDebug('send to channel: ' + 'adminChannel#' + req.body.agency.slice(-4));
    const notif = new Notif({
        subject: 'une nouvelle demande de réservation a été ajouter par ' +
            ((!req.body.isFullReservation) ? 'un client' : 'un moniteur'),
        action: 'RequestSession',
        data: session._id,
        agency: req.user.agency,
    });
    await notif.save();
    req.app.io.to('adminChannel#' + req.body.agency.slice(-4))
        .emit('news', notif);
};

module.exports.sessionCancelingNotif = (req, session) => {
    notifyDebug('sessionCancelingNotif');
    req.app.io.to('adminChannel#' + req.body.agency.slice(-4))
        .emit('news', {
            subject: (req.user.role === 'client') ?
                'un client a annuler l\'une de c\'est session' :
                'un monitor a annuler une session',
            data: {sessionId: session._id, userId: req.user._id}
        });
};

module.exports.carBreakdownNotif = (req, breakdown) => {
    notifyDebug('carBreakdownNotif');
    req.app.io.to('adminChannel#' + req.body.agency.slice(-4))
        .emit('news', {
            subject: 'Le monitor' + breakdown.monitor.name + ' ' +
                breakdown.monitor.surname + ' a declarer une panne de voiture'
                + breakdown.car.mark + breakdown.car.num,
            data: breakdown._id,
        });
};

module.exports.monitorAbsenceNotif = (req, absence) => {
    notifyDebug('monitorAbsenceNotif');
    req.app.io.to('adminChannel#' + req.body.agency.slice(-4))
        .emit('news', {
            subject: 'Le monitor' + absence.monitor.name + ' ' +
                absence.monitor.surname + ' a declarer une absence de' +
                absence.debDate + 'a' + absence.endDate,
            data: absence._id,
        });
};

module.exports.sessionValidationNotif = async (req, session) => {
    notifyDebug('sessionValidationNotif');
    notifyDebug('send to channel: ' + 'clientChannel#' + req.body.agency.slice(-4));
    notifyDebug('send to channel: ' + 'monitorChannel#' + req.body.agency.slice(-4));
    // send notification to monitor
    let notif = new Notif({
        subject: 'Vous avez une nouvelle session de traveil le ' +
            session.reservationDate,
        action: 'ApproveSession',
        data: session._id,
        userId: session.monitor._id,
        agency: req.user.agency,
    });
    await notif.save();
    req.app.io.to(req.app.io.connectedUser.filter
    (c => c._id === session.monitor._id.toString())[0].socketId)
        .emit('news', notif);
    // send notification to client
    notif = new Notif({
        subject: 'votre demande de reservation de session le' +
            session.reservationDate + ' a ete approuvé', //TODO format date
        action: 'ApproveSession',
        data: session._id,
        userId: session.client._id,
        agency: req.user.agency,
    });
    await notif.save();
    req.app.io.to(req.app.io.connectedUser.filter(
        c => c._id === session.client._id.toString())[0].socketId)
        .emit('news', notif);
};


