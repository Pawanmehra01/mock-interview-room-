const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
  try {
    const { question, language, interviewerName } = req.body;

    if (!question || !interviewerName) {
      return res.status(400).json({ error: 'question and interviewerName are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO rooms (question, language, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [question, language || 'javascript', interviewerName]
    );

    const room = rows[0];

    const token = jwt.sign(
      { name: interviewerName, role: 'interviewer', roomId: room.id },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    const joinLink = `http://localhost:5173/room/${room.id}`;

    res.json({ room, token, joinLink });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM rooms WHERE id = $1',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;