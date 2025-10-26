import { apiClient } from '../apiConfig';

export const usersAPI = {
  // Get all users
  getAll: async () => {
    const response = await apiClient.get('/api/users');
    return response.data;
  },

  // Get user by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data;
  },

  // Create user
  create: async (userData) => {
    const response = await apiClient.post('/api/users', userData);
    return response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await apiClient.put(`/api/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await apiClient.delete(`/api/users/${id}`);
    return response.data;
  }
};
