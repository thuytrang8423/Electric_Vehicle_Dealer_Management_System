import { apiClient } from '../apiConfig';

export const dealersAPI = {
  // Get all dealers
  getAll: async () => {
    const response = await apiClient.get('/api/dealers');
    return response.data;
  },

  // Get dealer by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/dealers/${id}`);
    return response.data;
  },

  // Create dealer
  create: async (dealerData) => {
    const response = await apiClient.post('/api/dealers', dealerData);
    return response.data;
  },

  // Update dealer
  update: async (id, dealerData) => {
    const response = await apiClient.put(`/api/dealers/${id}`, dealerData);
    return response.data;
  },

  // Delete dealer
  delete: async (id) => {
    const response = await apiClient.delete(`/api/dealers/${id}`);
    return response.data;
  }
};
