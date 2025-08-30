import { io } from 'socket.io-client';
import { BACKEND_URL } from '../constants.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(BACKEND_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  registerUser(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('register', userId);
    }
  }

  sendMessage(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message:send', data);
    }
  }

  startTyping(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:start', data);
    }
  }

  stopTyping(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:stop', data);
    }
  }

  markMessageAsRead(messageId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message:read', { messageId, userId });
    }
  }

  // Event listeners
  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on('user:online', callback);
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('user:offline', callback);
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  }

  onMessage(callback) {
    if (this.socket) {
      this.socket.on('message:new', callback);
      this.socket.on('message:sent', callback);
    }
  }

  onTyping(callback) {
    if (this.socket) {
      this.socket.on('typing:start', (data) => callback({ userId: data.from, typing: true }));
      this.socket.on('typing:stop', (data) => callback({ userId: data.from, typing: false }));
    }
  }

  emitMessage(data) {
    this.sendMessage(data);
  }

  emitTyping(data) {
    if (data.typing) {
      this.startTyping({ from: data.userId, to: data.targetUserId });
    } else {
      this.stopTyping({ from: data.userId, to: data.targetUserId });
    }
  }

  onMessageSent(callback) {
    if (this.socket) {
      this.socket.on('message:sent', callback);
    }
  }

  onMessageError(callback) {
    if (this.socket) {
      this.socket.on('message:error', callback);
    }
  }

  onTypingStart(callback) {
    if (this.socket) {
      this.socket.on('typing:start', callback);
    }
  }

  onTypingStop(callback) {
    if (this.socket) {
      this.socket.on('typing:stop', callback);
    }
  }

  onMessageRead(callback) {
    if (this.socket) {
      this.socket.on('message:read', callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  get connected() {
    return this.isConnected && this.socket?.connected;
  }
}

export const socketService = new SocketService();
