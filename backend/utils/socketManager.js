const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.activeRooms = new Map();
    this.setupSocketAuth();
    this.setupEventHandlers();
  }

  setupSocketAuth() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          console.log('No token provided');
          throw new Error('Authentication required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        console.log('Socket authenticated:', decoded.id);
        next();
      } catch (error) {
        console.error('Socket auth error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New socket connection:', socket.id);

      socket.on('joinRoom', async ({ issueId }, callback) => {
        try {
          const roomId = `issue_${issueId}`;
          await socket.join(roomId);
          console.log(`Socket ${socket.id} joined room ${roomId}`);
          callback && callback();
        } catch (error) {
          console.error('Join room error:', error);
          callback && callback(error.message);
        }
      });

      socket.on('sendMessage', async (messageData) => {
        try {
          console.log('Received message data:', messageData);
          const { issueId, content, sender } = messageData;
          const roomId = `issue_${issueId}`;

          // Save to database
          const newMessage = await Chat.create({
            issueId,
            content,
            sender,
            senderName: socket.user.username || 'Anonymous',
            timestamp: new Date()
          });

          console.log('Message saved to DB:', newMessage._id);

          // Broadcast to room
          this.io.to(roomId).emit('newMessage', {
            _id: newMessage._id,
            content,
            sender,
            senderName: socket.user.username || 'Anonymous',
            timestamp: newMessage.timestamp
          });

          console.log('Message broadcasted to room:', roomId);
        } catch (error) {
          console.error('Error handling message:', error);
          socket.emit('messageError', { error: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });
  }
}

module.exports = SocketManager;