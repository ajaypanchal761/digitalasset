import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

// @desc    Get all chats for admin (list of users with chat history)
// @route   GET /api/admin/chat/conversations
// @access  Private (Admin)
export const getAdminConversations = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get all chats for this admin, sorted by last message time
    const chats = await Chat.find({ adminId, isActive: true })
      .populate('userId', 'name email phone avatarUrl')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Format conversations with user info and last message
    const conversations = chats
      .filter(chat => chat.userId !== null && chat.userId !== undefined) // Filter out chats with deleted users
      .map(chat => {
        const user = chat.userId;
        const lastMessage = chat.messages && chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1]
          : null;

        // Safety check: if user is null/undefined, skip this chat
        if (!user || !user._id) {
          return null;
        }

        return {
          chatId: chat._id?.toString() || chat._id,
          userId: user._id?.toString() || user._id,
          userName: user.name || 'Unknown User',
          userEmail: user.email || '',
          userPhone: user.phone || '',
          userAvatar: user.avatarUrl || null,
          lastMessage: lastMessage?.message || chat.lastMessage || 'No messages yet',
          lastMessageAt: lastMessage?.createdAt || chat.lastMessageAt || chat.createdAt,
          unreadCount: chat.unreadCount || 0,
          isRead: lastMessage ? lastMessage.isRead : true,
        };
      })
      .filter(conv => conv !== null); // Remove any null entries

    res.json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    console.error('❌ Get admin conversations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch conversations',
    });
  }
};

// @desc    Get messages for a specific chat
// @route   GET /api/admin/chat/messages/:userId
// @access  Private (Admin)
export const getChatMessages = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;

    // Find or create chat (userId comes from params, ensure it's a valid ObjectId)
    let chat = await Chat.findOne({ userId, adminId, isActive: true })
      .populate('userId', 'name email phone avatarUrl')
      .populate('adminId', 'name email');

    if (!chat) {
      // Create new chat if doesn't exist
      chat = await Chat.create({
        userId,
        adminId,
        messages: [],
      });
      await chat.populate('userId', 'name email phone avatarUrl');
      await chat.populate('adminId', 'name email');
    }

    // Mark messages as read (admin is reading)
    await chat.markAsRead(adminId, 'Admin');

    // Check if user exists (might be deleted)
    if (!chat.userId || !chat.userId._id) {
      return res.status(404).json({
        success: false,
        message: 'User not found for this chat',
      });
    }

    // Format messages
    const messages = chat.messages.map(msg => ({
      id: msg._id,
      senderId: msg.senderId,
      senderType: msg.senderType,
      message: msg.message,
      isRead: msg.isRead,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
    }));

    res.json({
      success: true,
      data: {
        chatId: chat._id,
        user: {
          id: chat.userId._id,
          name: chat.userId.name || 'Unknown User',
          email: chat.userId.email || '',
          phone: chat.userId.phone || '',
          avatarUrl: chat.userId.avatarUrl || null,
        },
        messages,
        unreadCount: 0, // Reset after reading
      },
    });
  } catch (error) {
    console.error('❌ Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch messages',
    });
  }
};

// @desc    Send message from admin to user
// @route   POST /api/admin/chat/messages/:userId
// @access  Private (Admin)
export const sendAdminMessage = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Find or create chat
    let chat = await Chat.findOrCreateChat(userId, adminId);
    
    // Add message
    await chat.addMessage(adminId, 'Admin', message.trim());

    // Populate user info
    await chat.populate('userId', 'name email phone avatarUrl');

    // Get the last message
    const lastMessage = chat.messages[chat.messages.length - 1];

    res.json({
      success: true,
      data: {
        id: lastMessage._id,
        senderId: lastMessage.senderId,
        senderType: lastMessage.senderType,
        message: lastMessage.message,
        isRead: lastMessage.isRead,
        createdAt: lastMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Send admin message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message',
    });
  }
};

// @desc    Get user conversations (for user side)
// @route   GET /api/chat/conversations
// @access  Private
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get chat for this user
    const chat = await Chat.findOne({ userId, isActive: true })
      .populate('adminId', 'name email')
      .sort({ lastMessageAt: -1 })
      .lean();

    if (!chat) {
      return res.json({
        success: true,
        data: {
          chatId: null,
          adminName: 'Admin',
          lastMessage: 'No messages yet',
          lastMessageAt: null,
          unreadCount: 0,
        },
      });
    }

    const lastMessage = chat.messages && chat.messages.length > 0
      ? chat.messages[chat.messages.length - 1]
      : null;

    // Count unread messages (messages from admin that user hasn't read)
    const unreadCount = chat.messages.filter(msg => 
      msg.senderType === 'Admin' && !msg.isRead
    ).length;

    res.json({
      success: true,
      data: {
        chatId: chat._id,
        adminName: chat.adminId?.name || 'Admin',
        lastMessage: lastMessage?.message || chat.lastMessage || 'No messages yet',
        lastMessageAt: lastMessage?.createdAt || chat.lastMessageAt || chat.createdAt,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('❌ Get user conversations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch conversations',
    });
  }
};

// @desc    Get messages for user
// @route   GET /api/chat/messages
// @access  Private
export const getUserMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find chat (should have adminId)
    const chat = await Chat.findOne({ userId, isActive: true })
      .populate('adminId', 'name email');

    if (!chat) {
      return res.json({
        success: true,
        data: {
          chatId: null,
          admin: {
            name: 'Admin',
            email: '',
          },
          messages: [],
        },
      });
    }

    // Mark messages as read (user is reading)
    await chat.markAsRead(userId, 'User');

    // Check if admin exists (might be deleted)
    if (!chat.adminId || !chat.adminId._id) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found for this chat',
      });
    }

    // Format messages
    const messages = chat.messages.map(msg => ({
      id: msg._id,
      senderId: msg.senderId,
      senderType: msg.senderType,
      message: msg.message,
      isRead: msg.isRead,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
    }));

    res.json({
      success: true,
      data: {
        chatId: chat._id,
        admin: {
          id: chat.adminId._id,
          name: chat.adminId.name || 'Admin',
          email: chat.adminId.email || '',
        },
        messages,
      },
    });
  } catch (error) {
    console.error('❌ Get user messages error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch messages',
    });
  }
};

// @desc    Send message from user to admin
// @route   POST /api/chat/messages
// @access  Private
export const sendUserMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, adminId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Get first admin (or use provided adminId)
    let targetAdminId = adminId;
    if (!targetAdminId) {
      const admin = await Admin.findOne({ role: 'admin' });
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'No admin found',
        });
      }
      targetAdminId = admin._id;
    }

    // Find or create chat
    let chat = await Chat.findOrCreateChat(userId, targetAdminId);
    
    // Add message
    await chat.addMessage(userId, 'User', message.trim());

    // Get the last message
    const lastMessage = chat.messages[chat.messages.length - 1];

    res.json({
      success: true,
      data: {
        id: lastMessage._id,
        senderId: lastMessage.senderId,
        senderType: lastMessage.senderType,
        message: lastMessage.message,
        isRead: lastMessage.isRead,
        createdAt: lastMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Send user message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message',
    });
  }
};

