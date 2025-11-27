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

  createDealerInventory: async ({ dealerId, vehicleId }) => {
    const response = await apiClient.post('/api/inventory/dealer', null, {
      params: { dealerId, vehicleId }
    });
    return response.data;
  },

  getDealerInventorySummary: async (dealerId) => {
    const response = await apiClient.get(`/api/inventory/dealer/${dealerId}/summary`);
    return response.data;
  },

  getDealerInventoryDetails: async (dealerId) => {
    const response = await apiClient.get(`/api/inventory/dealer/${dealerId}/details`);
    return response.data;
  },
};






































