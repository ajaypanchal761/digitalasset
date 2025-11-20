import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType',
  },
  senderType: {
    type: String,
    required: true,
    enum: ['User', 'Admin'],
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Admin',
    index: true,
  },
  messages: [messageSchema],
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
chatSchema.index({ userId: 1, adminId: 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ 'messages.createdAt': -1 });

// Method to add a message
chatSchema.methods.addMessage = function(senderId, senderType, message) {
  this.messages.push({
    senderId,
    senderType,
    message,
  });
  this.lastMessage = message;
  this.lastMessageAt = new Date();
  
  // Update unread count if message is from user (for admin)
  if (senderType === 'User') {
    this.unreadCount += 1;
  }
  
  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(readerId, readerType) {
  // Mark all unread messages from the other party as read
  this.messages.forEach(msg => {
    if (msg.senderId.toString() !== readerId.toString() && !msg.isRead) {
      msg.isRead = true;
      msg.readAt = new Date();
    }
  });
  
  // Reset unread count if admin is reading
  if (readerType === 'Admin') {
    this.unreadCount = 0;
  }
  
  return this.save();
};

// Static method to find or create chat
chatSchema.statics.findOrCreateChat = async function(userId, adminId) {
  let chat = await this.findOne({ userId, adminId });
  
  if (!chat) {
    chat = await this.create({
      userId,
      adminId,
      messages: [],
    });
  }
  
  return chat;
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;

