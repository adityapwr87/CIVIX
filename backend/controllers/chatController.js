const Issue = require('../models/Issue');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const User = require('../models/User');

const setupChatWebSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

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
        if (!issue) return socket.emit('error', 'Issue not found');

        socket.join(`issue-${issueId}`);
        console.log(`User ${socket.userId} joined chat for issue ${issueId}`);
      } catch {
        socket.emit('error', 'Failed to join chat');
      }
    });

    socket.on('chatMessage', async ({ issueId, content }) => {
      try {
        const issue = await Issue.findById(issueId).populate('createdBy', 'role districtCode');
        if (!issue) return socket.emit('error', 'Issue not found');

        const user = await User.findById(socket.userId);
        const isAuthority = user.role === 'admin' && user.districtCode === issue.districtCode;

        await issue.addChatMessage(socket.userId, content, isAuthority);

        io.to(`issue-${issueId}`).emit('newMessage', {
          sender: socket.userId,
          content,
          isAuthorityResponse: isAuthority,
          timestamp: new Date(),
        });
      } catch {
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });
};

const getChatHistory = async (req, res) => {
  try {
    const { issueId } = req.params;
    const messages = await Chat.find({ issueId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { content } = req.body;
    const sender = req.user.id;

    const message = await Chat.create({
      issueId,
      content,
      sender,
      senderName: req.user.username,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

const getActiveChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const query = user.role === 'admin'
      ? { districtCode: user.districtCode }
      : { $or: [{ sender: userId }, { receiver: userId }] };

    const activeChats = await Chat.aggregate([
      { $match: query },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: '$issueId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$isRead', false] }, { $ne: ['$sender', userId] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $limit: 10 },
    ]);

    res.json(activeChats);
  } catch (error) {
    console.error('Error fetching active chats:', error);
    res.status(500).json({ message: 'Failed to fetch active chats', error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { issueId } = req.params;
    const messages = await Chat.find({ issueId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    await Chat.findByIdAndUpdate(messageId, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error marking message as read' });
  }
};

module.exports = {
  setupChatWebSocket,
  getChatHistory,
  sendMessage,
  getActiveChats,
  getMessages,
  markAsRead,
};
