import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

import { initDb } from './db/db.js';
import { seedDbIfEmpty } from './routes/questionRoutes.js';
import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import { setupGameSocket } from './socket/gameServer.js';
import { authenticateSocket } from './middleware/auth.js';

const app = express();
const server = http.createServer(app);

// CORS configuration for frontend and live game sockets
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  ...(process.env.CLIENT_URL || '').split(',').map(origin => origin.trim())
].filter(Boolean);

if (process.env.NODE_ENV === 'production' && !(process.env.CLIENT_URL || '').trim()) {
  throw new Error('CLIENT_URL must include the production frontend origin.');
}

const isAllowedOrigin = origin => (
  !origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)
);

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) callback(null, true);
    else callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.IO Setup
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error('Origin is not allowed by CORS.'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

io.use(authenticateSocket);

// Setup Real-time Game Engine
setupGameSocket(io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/social', socialRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'LogicRush Multiplayer Arena',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Initialize Database & Seed data
async function startServer() {
  try {
    await initDb();
    await seedDbIfEmpty();

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 LOGICRUSH SERVER RUNNING ON PORT ${PORT}`);
      console.log(`⚡ Live Multiplayer WebSocket Arena Ready`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export { app, server, io };
