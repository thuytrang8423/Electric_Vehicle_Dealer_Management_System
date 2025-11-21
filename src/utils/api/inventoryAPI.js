import { apiClient } from '../apiConfig';

export const inventoryAPI = {
  // ===== Factory Inventory =====
  getFactoryInventory: async () => {
    const response = await apiClient.get('/api/inventory/factory');
    return response.data;
  },

  createFactoryInventory: async ({ vehicleId, quantity }) => {
    const response = await apiClient.post('/api/inventory/factory', null, {
      params: { vehicleId, quantity }
    });
    return response.data;
  },

  checkFactoryAvailability: async ({ vehicleId, quantity }) => {
    const response = await apiClient.get('/api/inventory/factory/check', {
      params: { vehicleId, quantity }
    });
    return response.data;
  },

  // ===== Dealer Inventory =====
  getDealerInventory: async (dealerId) => {
    const response = await apiClient.get(`/api/inventory/dealer/${dealerId}`);
    return response.data;
  },

  createDealerInventory: async ({ dealerId, vehicleId, quantity }) => {
    const response = await apiClient.post('/api/inventory/dealer', null, {
      params: { dealerId, vehicleId, quantity }
    });
    return response.data;
  },
};
































