const redisClient = require('../../redis/client');

module.exports = (io, socket) => {
  const { roomId, role } = socket.user;

  socket.on('code:change', async ({ code, language }) => {
    await redisClient.set(`room:${roomId}:code`, code);
    await redisClient.set(`room:${roomId}:language`, language);

    socket.to(roomId).emit('code:update', { code, language, from: role });
  });

  socket.on('language:change', async ({ language }) => {
    await redisClient.set(`room:${roomId}:language`, language);
    io.to(roomId).emit('language:update', { language });
  });
};