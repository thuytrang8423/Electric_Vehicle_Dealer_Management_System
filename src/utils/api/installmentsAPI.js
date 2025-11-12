import { apiClient } from '../apiConfig';

export const installmentsAPI = {
  createPlan: async (payload) => {
    const response = await apiClient.post('/api/installments/create', payload);
    return response.data;
  },

  getByPayment: async (paymentId) => {
    const response = await apiClient.get(`/api/installments/${paymentId}`);
    return response.data;
  },

  payInstallment: async (transactionId, method = 'INSTALLMENT') => {
    const response = await apiClient.post(
      `/api/installments/${transactionId}/pay`,
      null,
      {
        params: { method },
      }
    );
    return response.data;
  },
};











