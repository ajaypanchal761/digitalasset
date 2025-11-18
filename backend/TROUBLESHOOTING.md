# OTP Troubleshooting Guide

## Common Issues and Solutions

### 1. "Something went wrong" Error

**Possible Causes:**
- SMS Hub India API not configured
- Database connection issue
- OTP model validation error
- Network error

**Solutions:**
1. Check `.env` file has:
   ```env
   SMSINDIAHUB_API_KEY=ooqCZWkeykGbpTK2bvvLQA
   SMSINDIAHUB_SENDER_ID=SMSHUB
   ```

2. Check backend console logs for detailed error messages

3. Verify MongoDB connection is working

4. Check if SMS service is configured:
   - Look for warning: "⚠️ SMS Hub India not configured"
   - If SMS fails, email should still work

### 2. OTP Not Received

**Check:**
1. Backend logs should show:
   - `📨 Send OTP request received`
   - `🔐 Generated OTP: XXXXXX`
   - `💾 Creating OTP record in database...`
   - `✅ OTP record created`
   - `📱 Attempting to send SMS...`
   - `✅ SMS OTP sent` OR `❌ SMS sending failed`

2. If SMS fails, check:
   - API key is correct
   - Phone number format (should be 10 digits)
   - SMS Hub India service status

3. Check database for OTP record:
   ```javascript
   db.otps.find().sort({createdAt: -1}).limit(1)
   ```

### 3. Database Validation Errors

**If you see validation errors:**
- Ensure either phone OR email is provided
- Phone should be 10 digits (normalized)
- Email should be valid format

### 4. Testing Steps

1. **Check Backend Logs:**
   ```bash
   npm run dev
   ```
   Look for detailed console logs

2. **Test API Directly:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phone":"1234567890","email":"test@example.com"}'
   ```

3. **Check Database:**
   - Verify OTP record is created
   - Check `smsSent` and `emailSent` flags
   - Verify `expiresAt` is set correctly

### 5. SMS Service Issues

**If SMS is not working:**
1. Verify API credentials in `.env`
2. Check SMS Hub India dashboard for balance
3. Test with a known working phone number
4. Check network connectivity
5. Email OTP should work as fallback

### 6. Frontend Error Handling

The frontend now shows actual error messages from backend. Check browser console for:
- API Error details
- Response status codes
- Error messages

## Debug Checklist

- [ ] Backend server is running
- [ ] MongoDB is connected
- [ ] `.env` file has SMS credentials
- [ ] Phone number is 10 digits
- [ ] Email is valid format
- [ ] Backend logs show OTP generation
- [ ] OTP record exists in database
- [ ] SMS/Email sending attempted
- [ ] No validation errors in console

