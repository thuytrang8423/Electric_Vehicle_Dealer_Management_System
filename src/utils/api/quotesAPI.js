import { apiClient } from '../apiConfig';

export const quotesAPI = {
  // Get all quotes
  getAll: async () => {
    const response = await apiClient.get('/api/quotes');
    return response.data;
  },

  // Get quote by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/quotes/${id}`);
    return response.data;
  },

  // Get quotes by user
  getByUser: async (userId) => {
    const response = await apiClient.get(`/api/quotes/user/${userId}`);
    return response.data;
  },

  // Get quotes by customer
  getByCustomer: async (customerId) => {
    const response = await apiClient.get(`/api/quotes/customer/${customerId}`);
    return response.data;
  },

  // Expire old quotes
  expireOld: async () => {
    const response = await apiClient.post('/api/quotes/expire-old');
    return response.data;
  },

  // Create quote
  create: async (quoteData) => {
    const response = await apiClient.post('/api/quotes', quoteData);
    return response.data;
  },

  // Update quote
  update: async (id, quoteData) => {
    const response = await apiClient.put(`/api/quotes/${id}`, quoteData);
    return response.data;
  },

  // Delete quote
  delete: async (id) => {
    const response = await apiClient.delete(`/api/quotes/${id}`);
    return response.data;
  }
};
