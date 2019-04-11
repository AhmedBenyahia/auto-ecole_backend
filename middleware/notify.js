const notifyDebug = require('debug')('app:notify');
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

module.exports.newClientNotif = (req, client) => {
    notifyDebug('newClientNotif');
    req.app.io.to('adminChannel#' + req.body.agency.slice(-4))
        .emit('news', {
            subject: 'un nouveau client a inscrit dans votre agence',
            data: client._id,
        });
};

module.exports.sessionReservationNotif = (req, session) => {
    notifyDebug('sessionReservationNotif');
    notifyDebug('send to channel: ' + 'adminChannel#' + req.body.agency.slice(-4));
    req.app.io.to('adminChannel#' + req.body.agency.slice(-4))
        .emit('news', {
            subject: 'une nouvelle demande de réservation a été ajouter par ' +
                ((!req.body.isFullReservation) ? 'un client' : 'un moniteur'),
            data: session._id,
        });
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



