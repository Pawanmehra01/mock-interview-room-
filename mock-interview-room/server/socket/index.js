const socketAuth = require('./middleware');
const roomHandler = require('./handlers/roomHandler');
const codeHandler = require('./handlers/codeHandler');
const aiHandler = require('./handlers/aiHandler');

module.exports = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.user.name} (${socket.user.role})`);

    roomHandler(io, socket);
    codeHandler(io, socket);
    aiHandler(io, socket);

    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.user.name}`);
    });
  });
};
