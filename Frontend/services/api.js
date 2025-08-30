import { BACKEND_URL } from '../constants.js';

class ApiService {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async login(data) {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  }

  async register(data) {
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  }

  async getCurrentUser() {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch current user');
    }

    return response.json();
  }

  async getUsers() {

    const response = await fetch(`${BACKEND_URL}/auth/users`, {
      headers: this.getHeaders(),
    });


    if (!response.ok) {
      const error = await response.json();
      console.error('API: Error response:', error);
      throw new Error(error.error || 'Failed to fetch users');
    }

    const data = await response.json();
    return data;
  }

  async getMessages(otherUserId) {
    const response = await fetch(`${BACKEND_URL}/messages/${otherUserId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch messages');
    }

    return response.json();
  }

  async markMessagesAsRead(otherUserId) {
    const response = await fetch(`${BACKEND_URL}/messages/${otherUserId}/mark-read`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark messages as read');
    }
  }
}

export const apiService = new ApiService();
