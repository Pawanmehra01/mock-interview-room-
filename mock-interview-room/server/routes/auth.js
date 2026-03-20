const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/join', async (req, res) => {
  try {
    const { roomId, name } = req.body;

    if (!roomId || !name) {
      return res.status(400).json({ error: 'roomId and name are required' });
    }

    const { rows } = await db.query(
      'SELECT * FROM rooms WHERE id = $1',
      [roomId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const token = jwt.sign(
      { name, role: 'candidate', roomId },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    res.json({ token, room: rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;