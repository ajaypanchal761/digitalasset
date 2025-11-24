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
 * Get appropriate token (admin or user) based on current route
 * @param {string} pathname - Current pathname (optional, will use window.location if not provided)
 * @returns {string|null} Token string or null
 */
export const getSocketToken = (pathname = null) => {
  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  
  // Determine route type
  const isAdminRoute = currentPath.startsWith('/admin') || currentPath.startsWith('/admin-auth');
  
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('token');
  
  // On admin routes, use admin token; otherwise use user token
  if (isAdminRoute) {
    return adminToken || null;
  } else {
    return userToken || null;
  }
};

/**
 * Get user token specifically (for user chat)
 * @returns {string|null} User token or null
 */
export const getUserSocketToken = () => {
  return localStorage.getItem('token') || null;
};

/**
 * Get admin token specifically (for admin chat)
 * @returns {string|null} Admin token or null
 */
export const getAdminSocketToken = () => {
  return localStorage.getItem('adminToken') || null;
};


