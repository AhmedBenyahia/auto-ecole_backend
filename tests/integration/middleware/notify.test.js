const io = require('socket.io-client');
const notify = require('../../../middleware/notify');
const rewire = require('rewire');
const ioServer = rewire('../../../app').__get__('io');
const mongoose = require('mongoose');
const {Client} = require('../../../model/client');
let socket;

describe(' notify middleware', () => {
    // run the socket server
    beforeAll((done) => {
        notify.connect(ioServer, {'forceNew': true});
        done();
    });

    // close the socket server
    afterAll((done) => {
        ioServer.server.close();
        done();
    });

    describe('Socket server configuration', () => {

        // Setup fake client server
        beforeEach((done) => {
            const port = process.env.PORT || 3000;
            socket = io('http://localhost:' + port, { forceNew: true });
            done();
        });

        // Close fake client server
        afterEach((done) => {
            // Cleanup
            if (socket.connected) {
                console.log("disconnecting...");
                socket.disconnect();
            } else {
                console.log("no connection to break");
            }
            done()
        });

        it('should emit "connection" event',(done) => {
                socket.on('connection', (message) => {
                    console.log('connected to socket server');
                    expect(message).toBeDefined();
                    // expect(message).toMatch('connected_');
                    done();
                });
        });

        it('should emit "ping" event', (done) => {
            socket.on('ping', (data) => {
                console.log("Welcome the client");
                expect(data).toBeDefined();
                done();
            });
        });

        it('should save user info if the client emit "save-user" event', (done) => {
            let data = {
                _id: (new mongoose.Types.ObjectId).toString(),
                role: 'user',
                agency: (new mongoose.Types.ObjectId).toString(),
            };
            socket.emit('save-user', data);
            setTimeout(() => {
                // make sure we emit data && socketId is saved
                expect(ioServer.connectedUser[0]).toMatchObject(data);
                expect(ioServer.connectedUser[0].socketId).toBeDefined();
                // make sure we only have one user connected
                expect(ioServer.connectedUser.length).toBe(1);
                done();
            },100);
        });

        it('should join user to group channel based on his role and agency', (done) => {
            let data = {
                _id: (new mongoose.Types.ObjectId).toString(),
                role: 'user',
                agency: (new mongoose.Types.ObjectId).toString(),
            };
            socket.emit('save-user', data);
            setTimeout(() => {
                // get the user joined channel
                const userRooms = ioServer.sockets.connected[ioServer.connectedUser[0].socketId].rooms;
                // the channel that the user should be joining
                const userGroupChannel = data.role + 'Channel#' + data.agency.slice(-4);
                expect(Object.keys(userRooms).filter(c => c === userGroupChannel).length)
                    .toBe(1);
                done();
            },50);
        });

    });

    describe('Emit notification', () => {
        // we are supposing we have an admin log in
        // user is an ADMIN
        const userId = (new mongoose.Types.ObjectId).toString();
        const agencyId = (new mongoose.Types.ObjectId).toString();
        let data = {
            _id: userId,
            role: 'admin',
            agency: agencyId,
        };
        let req = { app: {io : ioServer}, user: {agency: agencyId} };
        let client = { _id: new mongoose.Types.ObjectId };

        // Setup fake client server
        beforeEach((done) => {
            // Setup fake client server
            const port = process.env.PORT || 3000;
            socket = io('http://localhost:' + port, { forceNew: true });
            console.log('connect to socket server');
            setTimeout(() => {
                console.log('emit "save-user"');
                socket.emit('save-user', data);
                done();
            },500);
        });

        // Close fake client server
        afterEach((done) => {
            // Cleanup
            if (socket.connected) {
                console.log("disconnecting...");
                socket.disconnect();
            } else {
                console.log("no connection to break");
            }
            done()
        });

        describe('newClientNotif', () => {

            afterEach((done) => {
                socket.on('news', (data) => {
                    console.log("newClientNotif");
                });
                done();
            });

            // beforeEach( async (done) => {
            //     await notify.newClientNotif(req, client);
            //     done();
            // });

            it('should connect', async (done) => {
                setTimeout(() => {
                    expect(ioServer.connectedUser.length).toBe(1);
                    done();
                }, 50);

            });

            it('should join user to group channel based on his role and agency', (done) => {
                setTimeout(() => {
                    // get the user joined channel
                    const userRooms = ioServer.sockets.connected[ioServer.connectedUser[0].socketId].rooms;
                    // the channel that the user should be joining
                    const userGroupChannel = data.role + 'Channel#' + data.agency.slice(-4);
                    expect(Object.keys(userRooms).filter(c => c === userGroupChannel).length)
                        .toBe(1);
                    done();
                },50);
            });

            it('should emit newClientNotif', async (done) => {
                socket.on('news', () => {
                    done();
                });
                await notify.newClientNotif(req, client);
                done();
            });
        });

    });
});

