const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  isAuthorityResponse: { 
    type: Boolean, 
    default: false 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

const issueSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    images: [String],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: [Number],
      address: String,
    },
    districtCode: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "reported" },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: Date,
      },
    ],
    // Add chat functionality
    chatMessages: [chatMessageSchema],
    lastChatActivity: { 
      type: Date,
      default: Date.now 
    },
    chatParticipants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    hasUnreadMessages: {
      type: Boolean,
      default: false
    },
    solvedAt: Date
  },
  { timestamps: true }
);

// Add index for chat queries
issueSchema.index({ "chatMessages.timestamp": -1 });
issueSchema.index({ "lastChatActivity": -1 });

// Helper method to add chat message
issueSchema.methods.addChatMessage = async function(senderId, content, isAuthority) {
  this.chatMessages.push({
    sender: senderId,
    content,
    isAuthorityResponse: isAuthority,
    timestamp: new Date()
  });

  this.lastChatActivity = new Date();
  this.hasUnreadMessages = true;

  if (!this.chatParticipants.includes(senderId)) {
    this.chatParticipants.push(senderId);
  }

  return this.save();
};

module.exports = mongoose.model("Issue", issueSchema);
