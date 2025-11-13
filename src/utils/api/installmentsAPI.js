import { apiClient } from '../apiConfig';

export const installmentsAPI = {
  /**
   * Tạo gói trả góp cho một Payment
   * API: POST /api/installments/create
   * Body: { paymentId, totalAmount, months, annualInterestRate, firstDueDate }
   */
  create: async (payload) => {
    const response = await apiClient.post('/api/installments/create', payload);
    return response.data;
  },

  /**
   * Xem danh sách các kỳ trả góp của một Payment
   * API: GET /api/installments/{paymentId}
   */
  getByPayment: async (paymentId) => {
    const response = await apiClient.get(`/api/installments/${paymentId}`);
    return response.data;
  },

  /**
   * Đánh dấu kỳ trả góp đã thanh toán
   * API: POST /api/installments/{transactionId}/pay?method=INSTALLMENT
   */
  payInstallment: async (transactionId, method = 'INSTALLMENT') => {
    const response = await apiClient.post(`/api/installments/${transactionId}/pay?method=${method}`);
    return response.data;
  },

  // ========== CÁC API CŨ (Giữ lại để tương thích) ==========
  
  /**
   * Xem trước kế hoạch trả góp (Preview)
   * API: POST /api/installments/preview
   */
  preview: async (payload) => {
    const response = await apiClient.post('/api/installments/preview', payload);
    return response.data;
  },

  /**
   * Tạo lịch trả góp cho đơn hàng
   * API: POST /api/installments/{orderId}/generate
   */
  generate: async (orderId, payload) => {
    const response = await apiClient.post(`/api/installments/${orderId}/generate`, payload);
    return response.data;
  },

  /**
   * Lấy lịch trả góp theo Order
   * API: GET /api/installments/order/{orderId}
   */
  getScheduleByOrder: async (orderId) => {
    const response = await apiClient.get(`/api/installments/order/${orderId}`);
    return response.data;
  },

  /**
   * Thanh toán một kỳ trả góp (sử dụng scheduleId)
   * API: PUT /api/installments/pay/{scheduleId}
   */
  paySchedule: async (scheduleId) => {
    const response = await apiClient.put(`/api/installments/pay/${scheduleId}`);
    return response.data;
  }
};




















