const redisClient = require('../../redis/client');

module.exports = (io, socket) => {
  const { roomId, name, role } = socket.user;

  socket.join(roomId);

  io.to(roomId).emit('room:user_joined', { name, role });

  redisClient.get(`room:${roomId}:code`).then(code => {
    redisClient.get(`room:${roomId}:language`).then(language => {
      socket.emit('room:state', {
        code: code || '',
        language: language || 'javascript'
      });
    });
  });

  socket.on('disconnect', () => {
    io.to(roomId).emit('room:user_left', { name, role });
  });
};