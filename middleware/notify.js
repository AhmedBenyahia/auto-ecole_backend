const notifyDebug = require('debug')('app:notify');
const {Notif} = require('../model/notif');

// socket server config, manage user connections
module.exports.connect = (io) => {
    // array to save connected user info
    io.connectedUser = [];
    // on user connection
    io.on('connection', function (socket) {

        notifyDebug("Socket established with id: " + socket.id);
        // notifyDebug("Connected User: ", io.connectedUser.length, ":");
        // io.connectedUser.forEach((c) => {
        //     notifyDebug("   Role: ", c.role, "SocketId:",c.socketId);
        // });
        // emit a connection event to client
        socket.emit('connection', 'connected');
        // say hello to our new client
        socket.emit('ping', {greeting: "hello world"});
        // catch the user connection event and save user info
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
        // on user disconnection
        socket.on('disconnect', function () {
            notifyDebug("Socket disconnected: " + socket.id);
            // delete user form connectedUser array
            io.connectedUser = io.connectedUser.filter(c => c.socketId !== socket.id);
            notifyDebug("Connected User: ", io.connectedUser.length, ":");
            io.connectedUser.forEach((c) => {
                notifyDebug("   Role: ", c.role, "SocketId:", c.socketId);
            });
        });
    })
};

/** Notif from client/monitor --> admin/manager  **/
// on client sign in
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
// on session request
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
// on session cancel (and not reject)
module.exports.sessionCancelingNotif = async (req, session) => {
    notifyDebug('sessionCancelingNotif');
    // build notif body
    const notif = new Notif({
        subject: (req.user.role === 'client') ?
            'un client a annuler l\'une de c\'est session' :
            'un monitor a annuler une session',
        action: 'CancelSession',
        data: session._id,
        agency: req.user.agency,
    });
    // save notif in db
    await notif.save();
    // emit notif to admin
    req.app.io.to('adminChannel#' + req.body.agency.slice(-4))
        .emit('news', notif);
};
// on new car breakdown
module.exports.carBreakdownNotif = async (req, breakdown) => {
    notifyDebug('carBreakdownNotif');
    // build notif body
    const notif = new Notif({
        subject: 'Le monitor' + breakdown.monitor.name + ' ' +
            breakdown.monitor.surname + ' a declarer une panne de voiture'
            + breakdown.car.mark + breakdown.car.num,
        action: 'carBreakdown',
        data: breakdown._id,
        agency: req.user.agency,
    });
    // save notif in db
    await notif.save();
    // emit notif to admin
    req.app.io.to('adminChannel#' + req.body.agency.slice(-4))
        .emit('news', notif);
};
// on new monitor absence
module.exports.monitorAbsenceNotif = async (req, absence) => {
    notifyDebug('monitorAbsenceNotif');
    // build notif body
    const notif = new Notif({
        subject: 'Le monitor' + absence.monitor.name + ' ' +
            absence.monitor.surname + ' a declarer une absence de' +
            absence.debDate + 'a' + absence.endDate,
        data: absence._id,
        agency: req.user.agency,
    });
    // save notif in db
    await notif.save();
    // emit notif to admin
    req.app.io.to('adminChannel#' + req.body.agency.slice(-4))
        .emit('news', notif);
};

/** Notif from admin --> client/monitor  **/
// on session approve
module.exports.sessionValidationNotif = async (req, session) => {
    notifyDebug('sessionValidationNotif');

    // send notification to monitor
    let notif = new Notif({
        subject: 'Vous avez une nouvelle session de traveil le ' +
            session.reservationDate,
        action: 'ApproveSession',
        data: session._id,
        userId: session.monitor._id,
        agency: req.user.agency,
    });
    //save notification in db
    await notif.save();
    // emit notif to the monitor if he is connected
    let userConnectionInfo = req.app.io.connectedUser
        .filter(c => c._id === session.monitor._id.toString());
    if (userConnectionInfo[0]) {
        req.app.io.to(userConnectionInfo[0].socketId)
            .emit('news', notif);
    }

    // send notification to client
    notif = new Notif({
        subject: 'votre demande de reservation de session le' +
            session.reservationDate + ' a ete approuvé', //TODO format date
        action: 'ApproveSession',
        data: session._id,
        userId: session.client._id,
        agency: req.user.agency,
    });
    //save notification in db
    await notif.save();
    // emit notif to the client if he is connected
    userConnectionInfo = req.app.io.connectedUser
        .filter(c => c._id === session.client._id.toString());
    if (userConnectionInfo) {
        req.app.io.to(userConnectionInfo[0].socketId)
            .emit('news', notif);
    }

};
// on session reject
module.exports.sessionRejectNotif = async (req, session) => {
    notifyDebug('sessionRejectNotif');
    // who post the reservation request
    const userId = (req.body.isFullReservation) ? session.monitor._id : session.client._id;
    // build the notification body
    const notif = new Notif({
        subject: 'Vous demande de reservation de session a ete rejecter par l\'admin, date session: ' +
            session.reservationDate,
        action: 'RejectSession',
        userId: userId,
        agency: req.user.agency,
    });
    // save the notification in db
    await notif.save();
    // send the notification to user
    const userConnectionInfo = req.app.io.connectedUser
        .filter(c => c._id === userId.toString());
    if (userConnectionInfo[0]) {
        req.app.io.to(userConnectionInfo[0].socketId)
            .emit('news', notif);
    }
};

