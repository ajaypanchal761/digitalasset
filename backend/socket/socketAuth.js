import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

/**
 * Authenticate socket connection using JWT token
 * @param {Object} socket - Socket.io socket object
 * @param {Function} next - Next middleware function
 */
export const authenticateSocket = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Determine if it's admin or user based on token payload
    // Try to find user first
    let user = await User.findById(decoded.id).select('-password');
    let userType = 'User';

    // If not found, try admin
    if (!user) {
      user = await Admin.findById(decoded.id).select('-password');
      userType = 'Admin';
    }

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user info to socket
    socket.userId = user._id.toString();
    socket.userType = userType;
    socket.user = user;

    // Log authentication for debugging
    console.log('🔐 SOCKET AUTH - Authenticated:', {
      userId: socket.userId,
      userType: socket.userType,
      userModel: userType === 'Admin' ? 'Admin' : 'User',
      hasUser: !!user,
    });

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};


