const { streamAIResponse } = require('../../ai/streamer');
const redisClient = require('../../redis/client');
const db = require('../../db');

module.exports = (io, socket) => {
  socket.on('ai:ask', async ({ userQuery }) => {
    const { role, roomId, name } = socket.user;

    try {
      const code = await redisClient.get(`room:${roomId}:code`) || '';
      const language = await redisClient.get(`room:${roomId}:language`) || 'javascript';

      const roomResult = await db.query(
        'SELECT question FROM rooms WHERE id = $1',
        [roomId]
      );

      if (roomResult.rows.length === 0) {
        return socket.emit('ai:error', { message: 'Room not found' });
      }

      const question = roomResult.rows[0].question;

      await db.query(
        `INSERT INTO session_events (room_id, role, event_type, payload)
         VALUES ($1, $2, 'ai_ask', $3)`,
        [roomId, role, JSON.stringify({ userQuery, code })]
      );

      await streamAIResponse(socket, {
        role,
        question,
        code,
        language,
        userQuery
      });

    } catch (err) {
      console.error('aiHandler error:', err.message);
      socket.emit('ai:error', { message: 'Something went wrong' });
    }
  });
};