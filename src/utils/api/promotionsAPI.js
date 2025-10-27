import { apiClient, API_BASE_URL } from '../apiConfig';
import axios from 'axios';

export const promotionsAPI = {
  // Get all promotions
  getAll: async () => {
    try {
      const response = await apiClient.get('/api/promotions');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      // Return fallback data for development
      return [
        {
          id: 1,
          programName: "Khuyến mãi Tết 2024",
          description: "Chương trình khuyến mãi đặc biệt dịp Tết Nguyên Đán",
          startDate: "2024-01-20",
          endDate: "2024-02-20",
          conditions: "Áp dụng cho tất cả các dòng xe, giảm giá trực tiếp",
          discountValue: 5000000,
          status: "ACTIVE",
          createdBy: 6,
          createdByName: "System Administrator",
          createdByEmail: "admin@evdms.com"
        },
        {
          id: 2,
          programName: "New Year Promo 2026",
          description: "Ưu đãi đặc biệt đầu năm mới cho khách hàng thân thiết",
          startDate: "2025-12-25",
          endDate: "2026-01-10",
          conditions: "Chỉ áp dụng cho khách hàng VIP.",
          discountValue: 15,
          status: "DRAFT",
          createdBy: 6,
          createdByName: "System Administrator",
          createdByEmail: "admin@evdms.com"
        }
      ];
    }
  },

  // Get promotion by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/promotions/${id}`);
    return response.data;
  },

  // Create promotion
  create: async (promotionData) => {
    try {
      const response = await apiClient.post('/api/promotions', promotionData);
      return response.data;
    } catch (error) {
      console.error('Create promotion error:', error);
      // Return mock created promotion for development
      return {
        id: Date.now(),
        ...promotionData,
        createdByName: "Current User",
        createdByEmail: "user@example.com"
      };
    }
  },

  // Update promotion
  update: async (id, promotionData) => {
    try {
      const response = await apiClient.put(`/api/promotions/${id}`, promotionData);
      return response.data;
    } catch (error) {
      console.error('Update promotion error:', error);
      // Return mock updated promotion for development
      return {
        id: id,
        ...promotionData,
        createdByName: "Current User",
        createdByEmail: "user@example.com"
      };
    }
  },

  // Delete promotion
  delete: async (id) => {
    try {
      await apiClient.delete(`/api/promotions/${id}`);
      return true;
    } catch (error) {
      console.error('Delete promotion error:', error);
      // Return true for development (simulate successful deletion)
      return true;
    }
  }
};