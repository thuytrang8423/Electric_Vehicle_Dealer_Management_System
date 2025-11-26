import { apiClient } from '../apiConfig';

export const installmentsAPI = {
  /**
   * Preview installment plan (tính toán trước)
   * API: POST /api/installments/preview
   * Body: { totalAmount, months, annualInterestRate, firstDueDate }
   */
  preview: async (request) => {
    const response = await apiClient.post('/api/installments/preview', request);
    return response.data;
  },

  /**
   * Generate installment schedule for order
   * API: POST /api/installments/{orderId}/generate
   * Body: { totalAmount, months, annualInterestRate, firstDueDate }
   */
  generate: async (orderId, request) => {
    const response = await apiClient.post(
      `/api/installments/${orderId}/generate`,
      request
    );
    return response.data;
  },

  /**
   * Get installment schedule by order
   * API: GET /api/installments/order/{orderId}
   */
  getByOrder: async (orderId) => {
    const response = await apiClient.get(`/api/installments/order/${orderId}`);
    return response.data;
  },

  /**
   * Mark installment as paid
   * API: PUT /api/installments/pay/{scheduleId}
   */
  payInstallment: async (scheduleId) => {
    const response = await apiClient.put(`/api/installments/pay/${scheduleId}`);
    return response.data;
  },

  /**
   * Legacy: Get by payment (deprecated - use getByOrder instead)
   * @deprecated Use getByOrder instead
   */
  getByPayment: async (paymentId) => {
    console.warn('getByPayment is deprecated. Use getByOrder with orderId instead.');
    // This might not work, but keeping for backward compatibility
    const response = await apiClient.get(`/api/installments/${paymentId}`);
    return response.data;
  },

  /**
   * Legacy: Create (deprecated - use generate instead)
   * @deprecated Use generate instead
   */
  create: async (payload) => {
    console.warn('create is deprecated. Use generate(orderId, request) instead.');
    // This won't work correctly, but keeping for backward compatibility
    const response = await apiClient.post('/api/installments/create', payload);
    return response.data;
  },

  /**
   * Legacy: Delete (might not be supported by backend)
   * @deprecated Check if backend supports this
   */
  delete: async (paymentId) => {
    console.warn('delete might not be supported by backend');
    const response = await apiClient.delete(`/api/installments/${paymentId}`);
    return response.data;
  }
};