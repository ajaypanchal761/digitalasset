# Digital Asset Investment Platform - Backend API

Backend API for the Digital Asset Investment Platform built with Node.js, Express.js, and MongoDB.

## Features

- User authentication with JWT and OTP verification
- Property management (CRUD operations)
- Investment and holdings management
- Wallet operations and transaction tracking
- Payment gateway integration (Razorpay)
- Withdrawal request system
- Admin panel API
- File upload (images and documents)

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Razorpay** - Payment gateway
- **Cloudinary** - File storage
- **Nodemailer** - Email service

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration values

4. Start the development server:
```bash
npm run dev
```

5. Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/forgot-password` - Forgot password
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create property (Admin)
- `PUT /api/properties/:id` - Update property (Admin)
- `DELETE /api/properties/:id` - Delete property (Admin)

### Holdings
- `GET /api/holdings` - Get user holdings
- `GET /api/holdings/:id` - Get holding detail
- `POST /api/holdings` - Create investment

### Wallet
- `GET /api/wallet` - Get wallet balance
- `GET /api/wallet/transactions` - Get transactions

### Payment
- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/verify` - Verify payment

### Withdrawals
- `POST /api/withdrawals` - Create withdrawal request
- `GET /api/withdrawals` - Get user withdrawals

### Profile
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/kyc` - Submit KYC

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/withdrawals` - Get all withdrawals
- `PUT /api/admin/withdrawals/:id/approve` - Approve withdrawal

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── middleware/      # Middleware functions
│   ├── utils/           # Utility functions
│   ├── scripts/         # Utility scripts
│   ├── app.js           # Express app
│   └── server.js        # Server entry point
├── .env.example         # Environment variables template
└── package.json         # Dependencies
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

ISC



