import { apiClient } from '../apiConfig';

const auditLogsAPI = {
  // Lấy tất cả audit logs
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/audit-logs', {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          sort: params.sort || 'createdAt,desc',
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  // Lấy lịch sử thay đổi của entity
  getByEntity: async (entityType, entityId, params = {}) => {
    try {
      const response = await apiClient.get(`/api/audit-logs/entity/${entityType}/${entityId}`, {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          sort: params.sort || 'createdAt,desc',
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching entity audit logs:', error);
      throw error;
    }
  },

  // Lấy logs theo loại entity
  getByEntityType: async (entityType, params = {}) => {
    try {
      const response = await apiClient.get(`/api/audit-logs/entity-type/${entityType}`, {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          sort: params.sort || 'createdAt,desc',
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching entity type audit logs:', error);
      throw error;
    }
  },

  // Lấy logs theo action
  getByAction: async (action, params = {}) => {
    try {
      const response = await apiClient.get(`/api/audit-logs/action/${action}`, {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          sort: params.sort || 'createdAt,desc',
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching action audit logs:', error);
      throw error;
    }
  },

  // Lấy chi tiết audit log
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/api/audit-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit log details:', error);
      throw error;
    }
  },

  // Tìm kiếm audit logs
  search: async (searchParams = {}) => {
    try {
      const response = await apiClient.get('/api/audit-logs/search', {
        params: {
          page: searchParams.page || 0,
          size: searchParams.size || 20,
          sort: searchParams.sort || 'createdAt,desc',
          ...searchParams
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching audit logs:', error);
      throw error;
    }
  },

  // Lấy thống kê audit logs
  getStats: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/audit-logs/stats', {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          entityType: params.entityType,
          action: params.action,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit log stats:', error);
      throw error;
    }
  }
};

export default auditLogsAPI;
