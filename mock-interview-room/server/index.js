require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const auth = require('./middleware/auth');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://mock-interview-room-gold.vercel.app/',
      process.env.CLIENT_URL
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://mock-interview-room-gold.vercel.app/',
    process.env.CLIENT_URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/auth', require('./routes/auth'));

app.get('/api/me', auth, (req, res) => {
  res.json({ message: 'Token is valid', user: req.user });
});

app.get('/', (req, res) => {
  res.json({ message: 'Interview Room API is running' });
});

require('./socket')(io);

httpServer.listen(process.env.PORT, () => {
  console.log('Server running on port ' + process.env.PORT);
});
