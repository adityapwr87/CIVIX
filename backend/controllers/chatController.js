const Issue = require('../models/Issue');
const jwt = require('jsonwebtoken');

const setupChatWebSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    socket.on('joinIssueChat', async (issueId) => {
      try {
        const issue = await Issue.findById(issueId);
        if (!issue) {
          socket.emit('error', 'Issue not found');
          return;
        }

        socket.join(`issue-${issueId}`);
        console.log(`User ${socket.userId} joined chat for issue ${issueId}`);
      } catch (error) {
        socket.emit('error', 'Failed to join chat');
      }
    });

    socket.on('chatMessage', async ({ issueId, content }) => {
      try {
        const issue = await Issue.findById(issueId)
          .populate('createdBy', 'role districtCode');

        if (!issue) {
          socket.emit('error', 'Issue not found');
          return;
        }

        const user = await User.findById(socket.userId);
        const isAuthority = user.role === 'admin' && 
                          user.districtCode === issue.districtCode;

        await issue.addChatMessage(socket.userId, content, isAuthority);

        io.to(`issue-${issueId}`).emit('newMessage', {
          sender: socket.userId,
          content,
          isAuthorityResponse: isAuthority,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });
};

module.exports = { setupChatWebSocket };