import { apiClient } from '../apiConfig';

export const installmentsAPI = {
  /**
   * Tạo gói trả góp cho một Payment
   * API: POST /api/installments/create
   * Body: { paymentId, totalAmount, months, annualInterestRate, firstDueDate }
   */
  create: async (payload) => {
    const response = await apiClient.post('/api/installments/{orderId}/generate', payload);
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

  /**
   * Xóa kế hoạch trả góp (nếu backend hỗ trợ)
   * API: DELETE /api/installments/{paymentId}
   */
  delete: async (paymentId) => {
    const response = await apiClient.delete(`/api/installments/${paymentId}`);
    return response.data;
  }
};