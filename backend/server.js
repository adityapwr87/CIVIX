require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const SocketManager = require('./utils/socketManager');

const server = http.createServer(app);

// Configure Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ["Authorization", "Content-Type", "x-refresh-token"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Initialize Socket Manager
const socketManager = new SocketManager(io);

// Database connection with retry
const connectWithRetry = async (retries = 5) => {
  try {
    await connectDB();
    console.log('MongoDB Connected');
  } catch (err) {
    if (retries > 0) {
      console.log(`MongoDB connection failed. Retrying... (${retries} attempts left)`);
      setTimeout(() => connectWithRetry(retries - 1), 5000);
    } else {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    }
  }
};

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal');
  
  io.close(() => {
    console.log('Socket.IO connections closed');
    
    server.close(() => {
      console.log('HTTP server closed');
      
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
};

// Error handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  gracefulShutdown();
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown();
});

// Start server
const startServer = async () => {
  await connectWithRetry();
  const PORT = process.env.PORT || 5000;
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO server ready for connections`);
  });
};

startServer();

module.exports = { server, io };
