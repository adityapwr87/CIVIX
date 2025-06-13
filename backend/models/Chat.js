const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true,
    index: true // Add index for better query performance
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true // Add index for sorting
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isAuthorityResponse: {
    type: Boolean,
    default: false
  }
});

// Add compound index for common queries
chatSchema.index({ issueId: 1, timestamp: 1 });

module.exports = mongoose.model('Chat', chatSchema);