# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://shaanestate2025:shaanestate2025@cluster0.sflw4nm.mongodb.net/digitalasset

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SMS Hub India Configuration
SMSINDIAHUB_API_KEY=ooqCZWkeykGbpTK2bvvLQA
SMSINDIAHUB_SENDER_ID=SMSHUB
```

## Quick Setup

1. Copy the MongoDB URI provided:
   ```
   MONGODB_URI=mongodb+srv://shaanestate2025:shaanestate2025@cluster0.sflw4nm.mongodb.net/digitalasset
   ```

2. Add SMS Hub India credentials:
   ```
   SMSINDIAHUB_API_KEY=ooqCZWkeykGbpTK2bvvLQA
   SMSINDIAHUB_SENDER_ID=SMSHUB
   ```

3. Set a strong JWT_SECRET for production

4. Configure other services as needed

## Testing Connection

After setting up `.env`, test the connection:
```bash
cd backend
npm run dev
```

You should see:
- ✅ MongoDB Connected: cluster0.sflw4nm.mongodb.net
- 🚀 Server Started

