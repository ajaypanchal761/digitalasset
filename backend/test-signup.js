/**
 * Test script for user signup flow
 * Tests: Send OTP -> Verify OTP -> Register
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test user data
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  phone: '9876543210', // 10-digit phone number
};

console.log('🧪 Starting Signup Flow Test...\n');
console.log('Test User:', testUser);
console.log('API URL:', API_URL);
console.log('─'.repeat(50));

// Step 1: Send OTP
async function testSendOTP() {
  try {
    console.log('\n📨 Step 1: Sending OTP...');
    const response = await axios.post(`${API_URL}/auth/send-otp`, {
      email: testUser.email,
      phone: testUser.phone,
      purpose: 'registration',
    });

    console.log('✅ OTP Sent Successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send OTP');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Step 2: Get OTP from database (for testing)
async function getOTPFromDB() {
  try {
    // In a real scenario, you'd get this from SMS/Email
    // For testing, we'll query the database directly
    const mongoose = await import('mongoose');
    await mongoose.default.connect(process.env.MONGODB_URI);
    
    const OTP = mongoose.default.model('OTP', new mongoose.default.Schema({}, { strict: false }));
    const otpRecord = await OTP.findOne({
      phone: testUser.phone,
      isVerified: false,
    }).sort({ createdAt: -1 });

    if (otpRecord) {
      console.log('\n🔐 Found OTP in database:', otpRecord.otp);
      return otpRecord.otp;
    } else {
      console.log('\n⚠️  No OTP found in database. Using test OTP: 123456');
      return '123456';
    }
  } catch (error) {
    console.error('❌ Error getting OTP from DB:', error.message);
    console.log('⚠️  Using test OTP: 123456');
    return '123456';
  }
}

// Step 3: Register user with OTP
async function testRegister(otp) {
  try {
    console.log('\n📝 Step 2: Registering user with OTP...');
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: testUser.name,
      email: testUser.email,
      phone: testUser.phone,
      otp: otp,
    });

    console.log('✅ User Registered Successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.token) {
      console.log('\n🎉 Token received:', response.data.token.substring(0, 20) + '...');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to register user');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Main test function
async function runTest() {
  try {
    // Step 1: Send OTP
    const otpResponse = await testSendOTP();
    
    // Wait a bit for OTP to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Get OTP (from DB for testing, or use the one you received)
    const otp = await getOTPFromDB();
    
    // Step 3: Register with OTP
    const registerResponse = await testRegister(otp);
    
    console.log('\n' + '═'.repeat(50));
    console.log('✅ ALL TESTS PASSED!');
    console.log('═'.repeat(50));
    console.log('\nTest User Details:');
    console.log('  Name:', testUser.name);
    console.log('  Email:', testUser.email);
    console.log('  Phone:', testUser.phone);
    console.log('  Token:', registerResponse.token ? 'Received ✓' : 'Not received ✗');
    
  } catch (error) {
    console.log('\n' + '═'.repeat(50));
    console.error('❌ TEST FAILED');
    console.log('═'.repeat(50));
    process.exit(1);
  } finally {
    // Close database connection if opened
    try {
      const mongoose = await import('mongoose');
      if (mongoose.default.connection.readyState === 1) {
        await mongoose.default.connection.close();
      }
    } catch (e) {
      // Ignore
    }
    process.exit(0);
  }
}

// Run the test
runTest();

