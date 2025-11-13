import { apiClient } from '../apiConfig';

export const contractsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/api/contracts');
    return response.data;
  },

  getByDealer: async (dealerId) => {
    const response = await apiClient.get(`/api/contracts/dealer/${dealerId}`);
    return response.data;
  },

  searchByCustomerName: async (customerName) => {
    const response = await apiClient.get('/api/contracts/search', {
      params: { customerName },
    });
    return response.data;
  },

  getById: async (contractId) => {
    const response = await apiClient.get(`/api/contracts/${contractId}`);
    return response.data;
  },

  getOrderByContract: async (contractId) => {
    const response = await apiClient.get(`/api/contracts/${contractId}/order`);
    return response.data;
  },

  create: async (contractData) => {
    const response = await apiClient.post('/api/contracts', contractData);
    return response.data;
  },
};























