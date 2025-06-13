const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getChatHistory,
  sendMessage,
  getActiveChats,
  getMessages,
  markAsRead
} = require('../controllers/chatController');

router.get('/history/:issueId', protect, getChatHistory);
router.post('/message/:issueId', protect, sendMessage);
router.get('/active', protect, getActiveChats);
router.get('/:issueId', protect, getMessages);
router.put('/read/:messageId', protect, markAsRead);

// Add new route for active users count
router.get('/active-users', protect, async (req, res) => {
  try {
    const [activeUsers, activeAdmins] = await Promise.all([
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ role: 'admin', isActive: true })
    ]);

    res.json({ activeUsers, activeAdmins });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active users' });
  }
});

module.exports = router;