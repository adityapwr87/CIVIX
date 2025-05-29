require("dotenv").config();
const express = require('express');
const http = require("http");
const connectDB = require("./config/db");
const app = require('./app');
const { Server } = require('socket.io');
const { setupChatWebSocket } = require('./controllers/chatController');

// Create HTTP server first
const server = http.createServer(app);

// Initialize Socket.IO with the server instance
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Setup WebSocket handlers
setupChatWebSocket(io);

// Connect to MongoDB
connectDB();

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});
