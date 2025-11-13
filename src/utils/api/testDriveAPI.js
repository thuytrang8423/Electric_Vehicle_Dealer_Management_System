import { apiClient } from '../apiConfig';

export const testDriveAPI = {

  getScheduleList: async (dealerId) => {
    const response = await apiClient.get('/api/test-drive/schedule-list', {
      params: { dealerId }
    });
    return response.data;
  },

  confirmRequest: async (requestId, payload = {}) => {
    const response = await apiClient.post(`/api/test-drive/${requestId}/confirm`, payload);
    return response.data;
  },

  rejectRequest: async (requestId, payload = {}) => {
    const response = await apiClient.post(`/api/test-drive/${requestId}/reject`, payload);
    return response.data;
  }
};

