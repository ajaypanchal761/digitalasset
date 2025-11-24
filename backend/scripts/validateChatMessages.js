import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { env } from '../config/env.js';

/**
 * Script to validate and optionally fix chat messages with incorrect senderType
 * 
 * Usage:
 *   node backend/scripts/validateChatMessages.js [--fix]
 * 
 * Without --fix: Only reports issues
 * With --fix: Attempts to fix incorrect senderTypes based on senderId
 */

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const validateChatMessages = async (fix = false) => {
  try {
    console.log('🔍 Starting chat message validation...\n');
    
    const chats = await Chat.find({ isActive: true }).populate('userId', '_id').populate('adminId', '_id');
    let totalMessages = 0;
    let incorrectMessages = 0;
    const issues = [];

    for (const chat of chats) {
      const userId = chat.userId?._id?.toString();
      const adminId = chat.adminId?._id?.toString();

      if (!userId || !adminId) {
        console.warn(`⚠️  Chat ${chat._id} has missing userId or adminId, skipping...`);
        continue;
      }

      for (const message of chat.messages) {
        totalMessages++;
        const messageSenderId = message.senderId?.toString();
        const messageSenderType = message.senderType;

        // Determine what the senderType should be
        let expectedSenderType = null;
        if (messageSenderId === userId) {
          expectedSenderType = 'User';
        } else if (messageSenderId === adminId) {
          expectedSenderType = 'Admin';
        } else {
          // SenderId doesn't match either userId or adminId - this is a data integrity issue
          issues.push({
            chatId: chat._id.toString(),
            messageId: message._id.toString(),
            senderId: messageSenderId,
            currentSenderType: messageSenderType,
            expectedSenderType: 'UNKNOWN (senderId does not match userId or adminId)',
            userId,
            adminId,
            message: message.message?.substring(0, 50),
            createdAt: message.createdAt,
          });
          incorrectMessages++;
          continue;
        }

        // Check if senderType is incorrect
        if (messageSenderType !== expectedSenderType) {
          incorrectMessages++;
          const issue = {
            chatId: chat._id.toString(),
            messageId: message._id.toString(),
            senderId: messageSenderId,
            currentSenderType: messageSenderType,
            expectedSenderType,
            userId,
            adminId,
            message: message.message?.substring(0, 50),
            createdAt: message.createdAt,
          };

          issues.push(issue);

          // Fix if requested
          if (fix) {
            try {
              // Update the message in the chat
              const messageIndex = chat.messages.findIndex(
                m => m._id.toString() === message._id.toString()
              );
              
              if (messageIndex !== -1) {
                chat.messages[messageIndex].senderType = expectedSenderType;
                await chat.save();
                console.log(`✅ Fixed message ${message._id} in chat ${chat._id}`);
              }
            } catch (error) {
              console.error(`❌ Failed to fix message ${message._id}:`, error.message);
            }
          }
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total messages checked: ${totalMessages}`);
    console.log(`Incorrect messages found: ${incorrectMessages}`);
    console.log(`Correct messages: ${totalMessages - incorrectMessages}`);
    
    if (issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:\n');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. Chat: ${issue.chatId}`);
        console.log(`   Message ID: ${issue.messageId}`);
        console.log(`   Sender ID: ${issue.senderId}`);
        console.log(`   Current senderType: ${issue.currentSenderType}`);
        console.log(`   Expected senderType: ${issue.expectedSenderType}`);
        console.log(`   Message: "${issue.message}"`);
        console.log(`   Created: ${issue.createdAt}`);
        console.log('');
      });

      if (!fix) {
        console.log('💡 To fix these issues, run: node backend/scripts/validateChatMessages.js --fix');
      } else {
        console.log('✅ Fixes applied. Please run the script again without --fix to verify.');
      }
    } else {
      console.log('\n✅ All messages have correct senderType!');
    }

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error validating chat messages:', error);
    throw error;
  }
};

const main = async () => {
  const fix = process.argv.includes('--fix');
  
  if (fix) {
    console.log('⚠️  FIX MODE ENABLED - This will modify the database!\n');
  }

  await connectDB();
  await validateChatMessages(fix);
  await mongoose.connection.close();
  console.log('✅ Validation complete. Database connection closed.');
  process.exit(0);
};

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

