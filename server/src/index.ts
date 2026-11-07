import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from './config/db.js';
import { RoomManager } from './managers/roomManager.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || '*';

// Middlewares
app.use(
  cors({
    origin: CLIENT_URL === '*' ? '*' : [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());

// Socket.IO Server configuration
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL === '*' ? '*' : [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize Room Manager & Socket Handlers
const roomManager = new RoomManager();
setupSocketHandlers(io, roomManager);

// REST API Endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1
  });
});

app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = roomManager.getRoom(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  return res.json({
    code: room.code,
    status: room.status,
    playerCount: Object.values(room.players).filter((p) => p.isConnected).length,
    selectedGame: room.selectedGame,
    maxPlayers: room.maxPlayers,
  });
});

app.get('/api/games', (req, res) => {
  res.json({
    games: [
      {
        id: 'SECRET_AGENT',
        title: 'Secret Agent',
        tagline: 'Deceive your friends. Fulfill covert sabotage missions.',
        minPlayers: 2,
        maxPlayers: 10,
        badge: 'Social Deduction',
      },
      {
        id: 'FAKE_ANSWER',
        title: 'Fake Answer',
        tagline: 'Invent ridiculous fake facts and fool the room.',
        minPlayers: 2,
        maxPlayers: 10,
        badge: 'Trivia Bluff',
      },
      {
        id: 'QUICK_DRAW',
        title: 'Quick Draw',
        tagline: 'Synchronized live sketch battle with lightning guessing.',
        minPlayers: 2,
        maxPlayers: 10,
        badge: 'Drawing',
      },
      {
        id: 'WHO_KNOWS_ME',
        title: 'Who Knows Me Best?',
        tagline: 'Predict your friend’s wildest thoughts and dark habits.',
        minPlayers: 2,
        maxPlayers: 10,
        badge: 'Party Quiz',
      },
      {
        id: 'SURVIVAL_VOTE',
        title: 'Survival Vote',
        tagline: 'Vote on hilarious dilemmas to survive chaotic apocalypses.',
        minPlayers: 2,
        maxPlayers: 10,
        badge: 'Dilemmas',
      },
      {
        id: 'REACTION_BATTLE',
        title: 'Reaction Battle',
        tagline: 'Test your reflexes against millisecond timers and red stop decoys.',
        minPlayers: 2,
        maxPlayers: 10,
        badge: 'High Speed',
      },
    ],
  });
});

// Start Server
async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🎮 CHAOS CLUB Server running on port ${PORT}`);
    console.log(`📡 Realtime Socket.IO initialized`);
  });
}

start();

export { app, server, roomManager };
