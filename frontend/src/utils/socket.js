import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Create and return a Socket.io connection
 * @param {string} token - JWT token for authentication
 * @returns {Socket} Socket.io instance
 */
export const createSocket = (token) => {
  if (!token) {
    console.error('❌ Cannot create socket: No token provided');
    return null;
  }

  const socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
  });

  return socket;
};

/**
 * Get appropriate token (admin or user)
 * @returns {string|null} Token string or null
 */
export const getSocketToken = () => {
  // Prioritize admin token if exists
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('token');
  
  return adminToken || userToken || null;
};


