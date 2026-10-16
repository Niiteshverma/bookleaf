import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { initSocket } from './socket/socketHandler.js';
import prisma from './config/prisma.js';


const PORT = process.env.PORT || 5000;

// Create standard Node.js HTTP server wrapping Express
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin.includes('localhost') || origin.endsWith('.vercel.app') || origin === process.env.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
});

// Attach socket handlers
initSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 BookLeaf Support API Server is running on port ${PORT}`);
  console.log(`📡 Real-time Socket.IO initialized`);
  console.log(`🔗 Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
async function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('✅ Prisma client disconnected.');
    } catch (err) {
      console.error('Error disconnecting Prisma client:', err);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { server, io };
