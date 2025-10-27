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
  },

  // Update vehicle versions and colors
  updateVersionsColors: async (id, data) => {
    const response = await apiClient.patch(`/api/vehicles/${id}/versions-colors`, data);
    return response.data;
  },

  // Update vehicle price configuration
  updatePriceConfig: async (id, data) => {
    const response = await apiClient.patch(`/api/vehicles/${id}/price-config`, data);
    return response.data;
  },




  
  // ===== Vehicle Type Management =====
  // Get all vehicle types
  getAllTypes: async () => {
    const response = await apiClient.get('/api/vehicle-types');
    return response.data;
  },

  // Get vehicle type by ID
  getTypeById: async (id) => {
    const response = await apiClient.get(`/api/vehicle-types/${id}`);
    return response.data;
  },

  // Create vehicle type
  createType: async (typeData) => {
    const response = await apiClient.post('/api/vehicle-types', typeData);
    return response.data;
  },

  // Update vehicle type
  updateType: async (id, typeData) => {
    const response = await apiClient.put(`/api/vehicle-types/${id}`, typeData);
    return response.data;
  },

  // Delete vehicle type
  deleteType: async (id) => {
    const response = await apiClient.delete(`/api/vehicle-types/${id}`);
    return response.data;
  }
};
