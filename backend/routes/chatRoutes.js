const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all messages for an issue
router.get('/:issueId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ issueId: req.params.issueId })
      .sort({ timestamp: 1 })
      .populate('sender', 'username role');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active admins with online status
router.get('/active-admins', auth, async (req, res) => {
  try {
    const activeAdmins = await User.find({ 
      role: 'admin',
      isOnline: true, // Add this field to User model
      lastActive: { 
        $gte: new Date(Date.now() - 5 * 60 * 1000)
      }
    }).select('username districtCode isOnline lastActive');
    
    res.json(activeAdmins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active admins' });
  }
});

// Update admin online status
router.post('/admin-status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedAdmin = await User.findByIdAndUpdate(
      req.user._id,
      {
        isOnline: true,
        lastActive: new Date()
      },
      { new: true }
    );

    // Broadcast to all connected clients that admin status changed
    req.app.get('io').emit('adminStatusChange', {
      adminId: updatedAdmin._id,
      isOnline: true,
      username: updatedAdmin.username,
      districtCode: updatedAdmin.districtCode
    });

    res.json({ message: 'Admin status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating admin status' });
  }
});

module.exports = router;