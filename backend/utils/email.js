import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Digital Asset Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>OTP Verification</h2>
        <p>Your OTP for verification is:</p>
        <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetEmail = async (email, resetToken, userType = 'user') => {
  // Determine reset URL based on user type
  const resetPath = userType === 'admin' ? '/admin-auth/reset-password' : '/auth/reset-password';
  const resetUrl = `${env.FRONTEND_URL}${resetPath}?token=${resetToken}`;

  const mailOptions = {
    from: env.EMAIL_USER,
    to: email,
    subject: userType === 'admin' ? 'Admin Password Reset Request' : 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
            ${userType === 'admin' ? 'Admin Password Reset' : 'Password Reset'}
          </h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You requested to reset your password. Click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: #6366f1; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #6366f1; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; margin: 10px 0;">
            ${resetUrl}
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
            This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Password reset email sending error:', error);
    return { success: false, error: error.message };
  }
};

export const sendOfflineBuyerEmail = async ({ buyerEmail, buyerName, sellerName, sellerEmail, propertyTitle, investmentAmount }) => {
  const platformUrl = 'http://localhost:1573/';

  const mailOptions = {
    from: env.EMAIL_USER,
    to: buyerEmail,
    subject: 'Property Purchase Opportunity - Digital Asset Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
            Property Purchase Opportunity
          </h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Dear ${buyerName},
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You have been invited to purchase a property holding on our Digital Asset Platform.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Property Details:</h3>
            <p style="color: #374151; margin: 8px 0;"><strong>Property:</strong> ${propertyTitle}</p>
            <p style="color: #374151; margin: 8px 0;"><strong>Investment Amount:</strong> ₹${investmentAmount.toLocaleString('en-IN')}</p>
          </div>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Seller Details:</h3>
            <p style="color: #374151; margin: 8px 0;"><strong>Name:</strong> ${sellerName}</p>
            <p style="color: #374151; margin: 8px 0;"><strong>Email:</strong> ${sellerEmail}</p>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 20px;">
            To proceed with this purchase, please visit our platform and sign up for an account:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${platformUrl}" 
               style="display: inline-block; background: #6366f1; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Visit Platform
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
            Platform URL: <span style="color: #6366f1; word-break: break-all;">${platformUrl}</span>
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
            <strong>Important:</strong> After signing up and completing KYC verification, the property will be automatically transferred to your account.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Offline buyer email sending error:', error);
    return { success: false, error: error.message };
  }
};




