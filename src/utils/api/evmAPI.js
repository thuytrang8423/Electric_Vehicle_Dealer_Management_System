import { apiClient } from '../apiConfig';

export const evmAPI = {
  // Get system status (order status counts and total sales)
  // Params: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
  getSystemStatus: async (params = {}) => {
    const response = await apiClient.get('/api/evm/system-status', { params });
    return response.data;
  },

  // Get dealer performance (list of dealers with sales and orders)
  // Params: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
  getDealerPerformance: async (params = {}) => {
    const response = await apiClient.get('/api/evm/dealer-performance', { params });
    return response.data;
  }
};

