import { authenticateSocket } from './socketAuth.js';
import Chat from '../models/Chat.js';
import Admin from '../models/Admin.js';

/**
 * Setup Socket.io handlers for real-time chat
 * @param {Server} io - Socket.io server instance
 */
const socketHandler = (io) => {
  // Socket authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.userType} - ${socket.userId}`);

    // Join user-specific room
    const userRoom = `${socket.userType}-${socket.userId}`;
    socket.join(userRoom);
    console.log(`📍 ${socket.userType} ${socket.userId} joined room: ${userRoom}`);

    // Handle admin joining admin room
    if (socket.userType === 'Admin') {
      socket.join('admin-room');
      console.log(`📍 Admin ${socket.userId} joined admin-room`);
    }

    // Handle: User/Admin joins a specific chat
    socket.on('join-chat', async ({ userId, adminId }) => {
      try {
        if (socket.userType === 'Admin') {
          // Admin joining chat with a specific user
          const chatRoom = `chat-${userId}-${adminId}`;
          socket.join(chatRoom);
          console.log(`📍 Admin ${socket.userId} joined chat room: ${chatRoom}`);
        } else {
          // User joining chat with admin
          const chatRoom = `chat-${userId}-${adminId}`;
          socket.join(chatRoom);
          console.log(`📍 User ${socket.userId} joined chat room: ${chatRoom}`);
        }
      } catch (error) {
        console.error('❌ Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle: Send message
    socket.on('send-message', async ({ message, userId, adminId }) => {
      try {
        if (!message || !message.trim()) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        let targetUserId, targetAdminId, senderType, senderId;

        if (socket.userType === 'Admin') {
          // Admin sending to user
          senderType = 'Admin';
          senderId = socket.userId;
          targetUserId = userId;
          targetAdminId = adminId || socket.userId;
        } else {
          // User sending to admin
          senderType = 'User';
          senderId = socket.userId;
          targetUserId = socket.userId;
          
          // Get admin ID (use provided or find first admin)
          if (adminId) {
            targetAdminId = adminId;
          } else {
            const admin = await Admin.findOne({ role: 'admin' });
            if (!admin) {
              socket.emit('error', { message: 'No admin found' });
              return;
            }
            targetAdminId = admin._id;
          }
        }

        // Find or create chat
        const chat = await Chat.findOrCreateChat(targetUserId, targetAdminId);

        // Add message to database
        await chat.addMessage(senderId, senderType, message.trim());

        // Populate user/admin info for response
        await chat.populate('userId', 'name email phone avatarUrl');
        await chat.populate('adminId', 'name email');

        // Get the last message (the one we just added)
        const lastMessage = chat.messages[chat.messages.length - 1];

        // Format message for client
        const messageData = {
          id: lastMessage._id,
          senderId: lastMessage.senderId.toString(),
          senderType: lastMessage.senderType,
          message: lastMessage.message,
          isRead: lastMessage.isRead,
          createdAt: lastMessage.createdAt,
        };

        // Determine chat room
        const chatRoom = `chat-${targetUserId}-${targetAdminId}`;

        // Emit to both parties in the chat room
        io.to(chatRoom).emit('receive-message', {
          chatId: chat._id.toString(),
          message: messageData,
        });

        // Also emit conversation update to both parties
        const conversationUpdate = {
          chatId: chat._id.toString(),
          userId: chat.userId._id.toString(),
          userName: chat.userId.name,
          userEmail: chat.userId.email,
          userPhone: chat.userId.phone,
          userAvatar: chat.userId.avatarUrl,
          lastMessage: messageData.message,
          lastMessageAt: messageData.createdAt,
          unreadCount: chat.unreadCount,
        };

        // Notify admin about new message
        if (senderType === 'User') {
          io.to('admin-room').emit('conversation-updated', conversationUpdate);
          io.to(`${socket.userType}-${socket.userId}`).emit('conversation-updated', conversationUpdate);
          
          // Emit chat notification to all admins
          const chatNotification = {
            type: 'chat-message',
            title: 'New chat message',
            message: `${chat.userId.name}: ${messageData.message}`,
            userInfo: {
              id: chat.userId._id.toString(),
              name: chat.userId.name,
              email: chat.userId.email,
            },
            chatInfo: {
              chatId: chat._id.toString(),
              userId: chat.userId._id.toString(),
            },
            timestamp: new Date().toISOString(),
            icon: 'chat-message',
            link: `/admin/chat`,
          };
          
          io.to('admin-room').emit('new-chat-message', chatNotification);
          console.log('📢 Chat notification sent to admins');
        } else {
          // Admin sent message, notify user
          io.to(`User-${targetUserId}`).emit('conversation-updated', conversationUpdate);
          io.to(`${socket.userType}-${socket.userId}`).emit('conversation-updated', conversationUpdate);
        }

        console.log(`💬 Message sent: ${senderType} ${senderId} -> Chat ${chatRoom}`);
      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle: Mark messages as read
    socket.on('mark-read', async ({ userId, adminId }) => {
      try {
        let targetUserId, targetAdminId;

        if (socket.userType === 'Admin') {
          targetUserId = userId;
          targetAdminId = adminId || socket.userId;
        } else {
          targetUserId = socket.userId;
          if (!adminId) {
            const admin = await Admin.findOne({ role: 'admin' });
            if (!admin) return;
            targetAdminId = admin._id;
          } else {
            targetAdminId = adminId;
          }
        }

        const chat = await Chat.findOne({ userId: targetUserId, adminId: targetAdminId });
        if (chat) {
          await chat.markAsRead(socket.userId, socket.userType);
          
          // Notify the other party that messages were read
          const chatRoom = `chat-${targetUserId}-${targetAdminId}`;
          io.to(chatRoom).emit('messages-read', {
            chatId: chat._id.toString(),
            readBy: socket.userId,
            readByType: socket.userType,
          });
        }
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    });

    // Handle: Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.userType} - ${socket.userId}`);
    });

    // Handle: Error
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.userType} ${socket.userId}:`, error);
    });
  });
};

export default socketHandler;


