import { apiClient } from '../apiConfig';

export const debtsAPI = {
  // ====================== GET DEBTS ======================
  
  // Get all customer debts
  getCustomerDebts: async () => {
    const response = await apiClient.get('/api/debts/customers');
    return response.data;
  },

  // Get all dealer debts
  getDealerDebts: async () => {
    const response = await apiClient.get('/api/debts/dealers');
    return response.data;
  },

  // ====================== CUSTOMER DEBTS ======================
  
  // Add debt for customer
  addCustomerDebt: async (customerId, amount) => {
    const response = await apiClient.post(`/api/debts/customer/${customerId}/add`, {
      amount: amount
    });
    return response.data;
  },

  // Customer pay debt
  payCustomerDebt: async (customerId, payment) => {
    const response = await apiClient.post(`/api/debts/customer/${customerId}/pay`, {
      payment: payment
    });
    return response.data;
  },

  // ====================== DEALER DEBTS ======================
  
  // Add debt for dealer
  addDealerDebt: async (dealerId, amount) => {
    const response = await apiClient.post(`/api/debts/dealer/${dealerId}/add`, {
      amount: amount
    });
    return response.data;
  },

  // Dealer pay debt
  payDealerDebt: async (dealerId, payment) => {
    const response = await apiClient.post(`/api/debts/dealer/${dealerId}/pay`, {
      payment: payment
    });
    return response.data;
  }
};





























