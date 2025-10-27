import { apiClient } from '../apiConfig';

export const vehiclesAPI = {
  // Get all vehicles
  getAll: async () => {
    const response = await apiClient.get('/api/vehicles');
    return response.data;
  },

  // Get vehicle by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/vehicles/${id}`);
    return response.data;
  },

  // Create vehicle
  create: async (vehicleData) => {
    const response = await apiClient.post('/api/vehicles', vehicleData);
    return response.data;
  },

  // Update vehicle
  update: async (id, vehicleData) => {
    const response = await apiClient.put(`/api/vehicles/${id}`, vehicleData);
    return response.data;
  },

  // Delete vehicle
  delete: async (id) => {
    const response = await apiClient.delete(`/api/vehicles/${id}`);
    return response.data;
  }
};
