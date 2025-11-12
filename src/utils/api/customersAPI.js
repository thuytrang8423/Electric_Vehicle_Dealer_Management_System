import { apiClient } from '../apiConfig';

export const customersAPI = {
  // Get all customers
  getAll: async () => {
    const response = await apiClient.get('/api/customers');
    return response.data;
  },

  // Get customer by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/customers/${id}`);
    return response.data;
  },

  // Get customers by dealer
  getByDealer: async (dealerId) => {
    const response = await apiClient.get(`/api/customers/dealer/${dealerId}`);
    return response.data;
  },

  // Create customer
  create: async (customerData) => {
    const response = await apiClient.post('/api/customers', customerData);
    return response.data;
  },

  // Update customer
  update: async (id, customerData) => {
    const response = await apiClient.put(`/api/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer
  delete: async (id) => {
    const response = await apiClient.delete(`/api/customers/${id}`);
    return response.data;
  },

  // Book test drive
  bookTestDrive: async (testDriveData) => {
    const response = await apiClient.post('/api/test-drive/schedule', testDriveData);
    return response.data;
  }
};
