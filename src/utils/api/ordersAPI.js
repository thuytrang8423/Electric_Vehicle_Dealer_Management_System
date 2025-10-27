import { apiClient } from '../apiConfig';

export const ordersAPI = {
  // Get all orders
  getAll: async () => {
    const response = await apiClient.get('/api/orders');
    return response.data;
  },

  // Get order by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data;
  },

  // Get orders by user
  getByUser: async (userId) => {
    const response = await apiClient.get(`/api/orders/user/${userId}`);
    return response.data;
  },

  // Get orders by quote
  getByQuote: async (quoteId) => {
    const response = await apiClient.get(`/api/orders/quote/${quoteId}`);
    return response.data;
  },

  // Get orders by dealer
  getByDealer: async (dealerId) => {
    const response = await apiClient.get(`/api/orders/dealer/${dealerId}`);
    return response.data;
  },

  // Get orders by customer
  getByCustomer: async (customerId) => {
    const response = await apiClient.get(`/api/orders/customer/${customerId}`);
    return response.data;
  },

  // Create order
  create: async (orderData) => {
    const response = await apiClient.post('/api/orders', orderData);
    return response.data;
  },

  // Update order
  update: async (id, orderData) => {
    const response = await apiClient.put(`/api/orders/${id}`, orderData);
    return response.data;
  },

  // Delete order
  delete: async (id) => {
    const response = await apiClient.delete(`/api/orders/${id}`);
    return response.data;
  }
};
