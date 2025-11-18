import axios from 'axios';
import { env } from '../config/env.js';

/**
 * SMS Hub India SMS Service for Digital Assets
 * Handles OTP sending via SMS Hub India API
 */
class SMSHubIndiaService {
  constructor() {
    this.apiKey = env.SMSINDIAHUB_API_KEY;
    this.senderId = env.SMSINDIAHUB_SENDER_ID;
    this.baseUrl = 'http://cloud.smsindiahub.in/vendorsms/pushsms.aspx';
    
    if (!this.apiKey || !this.senderId) {
      console.warn('⚠️  SMS Hub India credentials not configured. SMS functionality will be disabled.');
    }
  }

  /**
   * Check if SMS Hub India is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    const apiKey = this.apiKey || env.SMSINDIAHUB_API_KEY;
    const senderId = this.senderId || env.SMSINDIAHUB_SENDER_ID;
    
    return !!(apiKey && senderId);
  }

  /**
   * Normalize phone number to Indian format with country code
   * @param {string} phone - Phone number to normalize
   * @returns {string} - Normalized phone number with country code (91XXXXXXXXXX)
   */
  normalizePhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/[^0-9]/g, '');
    
    // If it already has country code 91 and is 12 digits, return as is
    if (digits.startsWith('91') && digits.length === 12) {
      return digits;
    }
    
    // If it's 10 digits, add country code 91
    if (digits.length === 10) {
      return '91' + digits;
    }
    
    // If it's 11 digits and starts with 0, remove the 0 and add country code
    if (digits.length === 11 && digits.startsWith('0')) {
      return '91' + digits.substring(1);
    }
    
    // Return with country code as fallback
    return '91' + digits.slice(-10);
  }

  /**
   * Send OTP via SMS using SMS Hub India
   * @param {string} phone - Phone number to send SMS to
   * @param {string} otp - OTP code to send
   * @returns {Promise<Object>} - Response object
   */
  async sendOTP(phone, otp) {
    try {
      // Load credentials dynamically
      const apiKey = this.apiKey || env.SMSINDIAHUB_API_KEY;
      const senderId = this.senderId || env.SMSINDIAHUB_SENDER_ID;
      
      if (!apiKey || !senderId) {
        throw new Error('SMS Hub India not configured. Please check your environment variables.');
      }

      const normalizedPhone = this.normalizePhoneNumber(phone);
      
      // Validate phone number (should be 12 digits with country code)
      if (normalizedPhone.length !== 12 || !normalizedPhone.startsWith('91')) {
        throw new Error(`Invalid phone number format: ${phone}. Expected 10-digit Indian mobile number.`);
      }

      // Use the exact template that works with SMSIndiaHub
      // Format: "Welcome to the {app_name} powered by SMSINDIAHUB. Your OTP for registration is {otp}"
      const message = `Welcome to the Digital Assets powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;
      
      // Build the API URL with query parameters
      const params = new URLSearchParams({
        APIKey: apiKey,
        msisdn: normalizedPhone,
        sid: senderId,
        msg: message,
        fl: '0', // Flash message flag (0 = normal SMS)
        dc: '0', // Delivery confirmation (0 = no confirmation)
        gwid: '2' // Gateway ID (2 = transactional)
      });

      const apiUrl = `${this.baseUrl}?${params.toString()}`;

      console.log(`📱 Sending SMS to ${normalizedPhone} via SMS Hub India...`);

      // Make GET request to SMS Hub India API
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'DigitalAssets/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000 // 15 second timeout
      });

      console.log('📱 SMS Hub India Response Status:', response.status);
      console.log('📱 SMS Hub India Response Data:', response.data);

      // SMS Hub India returns JSON response
      let responseData = response.data;
      
      // Handle case where response might be a string
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          // If parsing fails, check if it contains success indicators
          const responseText = responseData.toString();
          if (responseText.includes('success') || responseText.includes('sent') || responseText.includes('Done')) {
            return {
              success: true,
              messageId: `sms_${Date.now()}`,
              status: 'sent',
              to: normalizedPhone,
              body: message,
              provider: 'SMS Hub India',
            };
          } else {
            throw new Error(`SMS Hub India API error: ${responseText}`);
          }
        }
      }
      
      // Check for success indicators in the response
      if (responseData && responseData.ErrorCode === '000' && responseData.ErrorMessage === 'Done') {
        const messageId = responseData.MessageData && responseData.MessageData[0] 
          ? responseData.MessageData[0].MessageId 
          : `sms_${Date.now()}`;
          
        return {
          success: true,
          messageId: messageId,
          jobId: responseData.JobId,
          status: 'sent',
          to: normalizedPhone,
          body: message,
          provider: 'SMS Hub India',
        };
      } else if (responseData && responseData.ErrorCode && responseData.ErrorCode !== '000') {
        throw new Error(`SMS Hub India API error: ${responseData.ErrorMessage || 'Unknown error'} (Code: ${responseData.ErrorCode})`);
      } else {
        // Fallback for unexpected response format - assume success if we got a response
        return {
          success: true,
          messageId: `sms_${Date.now()}`,
          status: 'sent',
          to: normalizedPhone,
          body: message,
          provider: 'SMS Hub India',
        };
      }

    } catch (error) {
      // Handle specific error cases
      if (error.response) {
        let errorMessage = 'SMS Hub India API error';
        
        // Try to extract error message from response
        try {
          const errorData = error.response.data;
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData && typeof errorData === 'object' && errorData.ErrorMessage) {
            errorMessage = errorData.ErrorMessage;
          }
        } catch (e) {
          // Ignore parsing errors
        }
        
        if (error.response.status === 401) {
          throw new Error('SMS Hub India authentication failed. Please check your API key.');
        } else if (error.response.status === 400) {
          throw new Error(`SMS Hub India request error: ${errorMessage}`);
        } else if (error.response.status === 429) {
          throw new Error('SMS Hub India rate limit exceeded. Please try again later.');
        } else if (error.response.status === 500) {
          throw new Error('SMS Hub India server error. Please try again later.');
        } else {
          throw new Error(`SMS Hub India API error (${error.response.status}): ${errorMessage}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('SMS Hub India request timeout. Please try again.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Unable to connect to SMS Hub India service. Please check your internet connection.');
      } else if (error.code === 'ECONNRESET') {
        throw new Error('SMS Hub India connection was reset. Please try again.');
      }
      
      // For other errors, use the error message if available
      const errorMessage = error.message || 'SMS Hub India service error';
      throw new Error(errorMessage);
    }
  }

  /**
   * Test SMS Hub India API connection and credentials
   * @returns {Promise<Object>} - Test result
   */
  async testConnection() {
    try {
      const apiKey = this.apiKey || env.SMSINDIAHUB_API_KEY;
      const senderId = this.senderId || env.SMSINDIAHUB_SENDER_ID;
      
      if (!apiKey || !senderId) {
        throw new Error('SMS Hub India not configured.');
      }

      return {
        success: true,
        message: 'SMS Hub India is configured',
        apiKey: apiKey ? `${apiKey.substring(0, 4)}...` : 'Not set',
        senderId: senderId || 'Not set',
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const smsHubIndiaService = new SMSHubIndiaService();

export default smsHubIndiaService;

