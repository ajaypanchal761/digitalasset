/**
 * Socket.io instance helper
 * This allows controllers to access the Socket.io instance to emit events
 */

let ioInstance = null;

export const setSocketInstance = (io) => {
  ioInstance = io;
};

export const getSocketInstance = () => {
  return ioInstance;
};

