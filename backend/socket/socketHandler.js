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

        // Validate socket authentication
        if (!socket.userType || !socket.userId) {
          console.error('❌ BACKEND SOCKET - Invalid socket authentication:', {
            hasUserType: !!socket.userType,
            hasUserId: !!socket.userId,
            userType: socket.userType,
            userId: socket.userId,
          });
          socket.emit('error', { message: 'Authentication error: Invalid socket session' });
          return;
        }

        // Validate userType is either 'Admin' or 'User'
        if (socket.userType !== 'Admin' && socket.userType !== 'User') {
          console.error('❌ BACKEND SOCKET - Invalid userType:', {
            userType: socket.userType,
            userId: socket.userId,
            expectedTypes: ['Admin', 'User'],
          });
          socket.emit('error', { message: 'Authentication error: Invalid user type' });
          return;
        }

        let targetUserId, targetAdminId, senderType, senderId;

        // Determine senderType based on who is sending
        console.log('🔴 BACKEND SOCKET - Processing send-message:', {
          socketUserType: socket.userType,
          socketUserId: socket.userId,
          receivedUserId: userId,
          receivedAdminId: adminId,
          message: message.substring(0, 30),
        });
        
        if (socket.userType === 'Admin') {
          // Admin is sending to user
          senderType = 'Admin';
          senderId = socket.userId;
          targetUserId = userId;
          targetAdminId = adminId || socket.userId;
          
          // Validation: Ensure we have a target user
          if (!targetUserId) {
            console.error('❌ BACKEND SOCKET - Admin sending message without target userId');
            socket.emit('error', { message: 'User ID is required when sending as admin' });
            return;
          }
          
          console.log('🔴 BACKEND SOCKET - Admin sending message:', {
            senderType,
            senderId,
            targetUserId,
            targetAdminId,
            validation: '✅ Admin authenticated, sending as Admin',
          });
        } else {
          // User is sending to admin
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
          
          console.log('🔴 BACKEND SOCKET - User sending message:', {
            senderType,
            senderId,
            targetUserId,
            targetAdminId,
            validation: '✅ User authenticated, sending as User',
          });
        }

        // Final validation: Ensure senderType matches socket.userType
        if (senderType !== socket.userType) {
          console.error('❌ BACKEND SOCKET - CRITICAL: senderType mismatch!', {
            socketUserType: socket.userType,
            determinedSenderType: senderType,
            socketUserId: socket.userId,
            message: message.substring(0, 30),
          });
          socket.emit('error', { message: 'Internal error: Sender type mismatch' });
          return;
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

        // Validate saved message has correct senderType
        if (lastMessage.senderType !== senderType) {
          console.error('❌ BACKEND SOCKET - CRITICAL: Database senderType mismatch!', {
            expectedSenderType: senderType,
            actualSenderType: lastMessage.senderType,
            messageId: lastMessage._id,
            socketUserType: socket.userType,
          });
        }

        // Format message for client
        const messageData = {
          id: lastMessage._id,
          senderId: lastMessage.senderId.toString(),
          senderType: lastMessage.senderType,
          message: lastMessage.message,
          isRead: lastMessage.isRead,
          createdAt: lastMessage.createdAt,
        };

        // Final validation log
        const validationPassed = 
          messageData.senderType === senderType && 
          messageData.senderType === socket.userType;

        console.log('🔴 BACKEND SOCKET - Message saved to database:', {
          messageId: messageData.id,
          senderType: messageData.senderType,
          senderTypeType: typeof messageData.senderType,
          senderId: messageData.senderId,
          message: messageData.message.substring(0, 30),
          socketUserType: socket.userType,
          expectedSenderType: senderType,
          validation: validationPassed ? '✅ PASSED' : '❌ FAILED',
          expectedForUser: messageData.senderType === 'User' ? 'RIGHT (blue - SENT)' : 'LEFT (grey - RECEIVED)',
          expectedForAdmin: messageData.senderType === 'Admin' ? 'RIGHT (blue - SENT)' : 'LEFT (grey - RECEIVED)',
        });

        if (!validationPassed) {
          console.error('❌ BACKEND SOCKET - VALIDATION FAILED - Message senderType does not match socket userType!');
        }

        // Determine chat room and emit to both parties
        const chatRoom = `chat-${targetUserId}-${targetAdminId}`;
        console.log('🔴 BACKEND SOCKET - Emitting to chat room:', {
          chatRoom,
          targetUserId,
          targetAdminId,
          messageData,
        });
        
        io.to(chatRoom).emit('receive-message', {
          chatId: chat._id.toString(),
          message: messageData,
        });
        
        console.log('🔴 BACKEND SOCKET - Message emitted successfully');

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


