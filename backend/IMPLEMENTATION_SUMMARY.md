# SMS Hub India OTP Implementation Summary

## Overview
Complete implementation of SMS Hub India OTP service for Digital Assets project with proper database storage and flow management.

## Implementation Details

### 1. OTP Model (`backend/models/OTP.js`)
- **Purpose**: Store OTPs in MongoDB database instead of in-memory
- **Features**:
  - Auto-expiration (10 minutes TTL)
  - Attempt tracking (max 5 attempts)
  - Verification status tracking
  - SMS/Email delivery status
  - Purpose-based OTPs (registration, login, password-reset, verification)
  - Indexes for fast lookups

### 2. SMS Hub India Service (`backend/utils/sms.js`)
- **Purpose**: Handle SMS OTP sending via SMS Hub India API
- **Features**:
  - Phone number normalization (Indian format: 91XXXXXXXXXX)
  - Error handling with specific error messages
  - Connection testing
  - Purpose-based message templates
  - Singleton pattern for service instance

### 3. Updated Auth Controller (`backend/controllers/auth.controller.js`)
- **Send OTP** (`POST /api/auth/send-otp`):
  - Generates 6-digit OTP
  - Stores in database with expiration
  - Sends via SMS (SMS Hub India) if phone provided
  - Sends via Email if email provided
  - Tracks delivery status
  
- **Verify OTP** (`POST /api/auth/verify-otp`):
  - Validates OTP from database
  - Checks expiration and attempts
  - Marks OTP as verified
  - Prevents reuse of verified OTPs

- **Register** (`POST /api/auth/register`):
  - Validates OTP if provided
  - Creates user with verified status
  - Auto-generates password if not provided

- **Login with OTP** (`POST /api/auth/login-otp`):
  - Verifies OTP
  - Creates user if doesn't exist
  - Updates verification status

### 4. Environment Configuration
- Added `SMSINDIAHUB_API_KEY` to env config
- Added `SMSINDIAHUB_SENDER_ID` to env config
- Updated `backend/config/env.js`

### 5. Package Dependencies
- Added `axios` for HTTP requests to SMS Hub India API

## API Keys Configuration

Add these to your `.env` file:

```env
SMSINDIAHUB_API_KEY=ooqCZWkeykGbpTK2bvvLQA
SMSINDIAHUB_SENDER_ID=SMSHUB
```

## Flow Diagram

### Registration Flow:
1. User enters: Full Name, Email, Phone
2. Frontend calls: `POST /api/auth/send-otp` with email & phone
3. Backend:
   - Generates 6-digit OTP
   - Stores in MongoDB (OTP model)
   - Sends SMS via SMS Hub India
   - Sends Email (fallback)
4. User enters OTP
5. Frontend calls: `POST /api/auth/verify-otp`
6. Backend verifies OTP from database
7. Frontend calls: `POST /api/auth/register` with OTP
8. Backend creates user with verified status
9. User auto-logged in

### Login Flow:
1. User enters: Phone number
2. Frontend calls: `POST /api/auth/send-otp` with phone & purpose='login'
3. Backend sends SMS OTP
4. User enters OTP
5. Frontend calls: `POST /api/auth/login-otp`
6. Backend verifies OTP and logs in user

## Database Schema

### OTP Collection:
```javascript
{
  phone: String (indexed),
  email: String (indexed),
  otp: String,
  purpose: String (enum: 'registration', 'login', 'password-reset', 'verification'),
  expiresAt: Date (auto-delete after 10 min),
  isVerified: Boolean,
  verifiedAt: Date,
  attempts: Number (max 5),
  smsSent: Boolean,
  emailSent: Boolean,
  smsMessageId: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

1. **OTP Expiration**: 10 minutes TTL
2. **Attempt Limiting**: Max 5 verification attempts
3. **One-time Use**: OTPs marked as verified cannot be reused
4. **Auto-cleanup**: Expired OTPs auto-deleted from database
5. **Rate Limiting**: Applied via middleware on auth routes

## Error Handling

- Invalid phone format
- OTP expired
- Maximum attempts exceeded
- OTP already used
- SMS/Email sending failures
- Network errors

## Testing

To test SMS service:
1. Ensure `.env` has correct API keys
2. Start backend server
3. Call `POST /api/auth/send-otp` with phone number
4. Check SMS on phone
5. Verify OTP using `POST /api/auth/verify-otp`

## Next Steps

1. Install dependencies: `npm install` in backend folder
2. Add environment variables to `.env`
3. Test the complete flow
4. Monitor SMS delivery in production
5. Consider adding SMS delivery status webhooks if available

