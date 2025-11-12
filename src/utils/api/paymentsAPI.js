import { apiClient } from '../apiConfig';

export const paymentsAPI = {
  // Get payments by order
  getByOrder: async (orderId) => {
    const response = await apiClient.get(`/api/payments/order/${orderId}`);
    return response.data;
  },

  // Create VNPay payment
  createVNPayPayment: async (paymentData) => {
    const response = await apiClient.post('/api/payments/vnpay/create', paymentData);
    return response.data;
  },

  // Get payment by transaction reference (VNPay)
  getByTxnRef: async (txnRef) => {
    const response = await apiClient.get(`/api/payments/vnpay/txn/${txnRef}`);
    return response.data;
  },

  // Get payment status by transaction reference
  getStatus: async (txnRef) => {
    try {
      const response = await apiClient.get(`/api/payments/status/${txnRef}`);
      return response.data;
    } catch (error) {
      // If status endpoint doesn't exist, fallback to getByTxnRef
      console.warn('Status endpoint not available, using txn endpoint');
      return paymentsAPI.getByTxnRef(txnRef);
    }
  },

  // Handle VNPay return callback
  handleVNPayReturn: async (params) => {
    // Convert params object to URLSearchParams for proper encoding
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        searchParams.append(key, params[key]);
      }
    });
    const response = await apiClient.get(`/api/payments/vnpay/return?${searchParams.toString()}`);
    return response.data;
  },

  // Manual payment via dealer workflow (CASH / TRANSFER)
  createDealerWorkflowPayment: async (orderId, paymentData) => {
    const response = await apiClient.post(
      `/api/dealer-workflow/orders/${orderId}/payment`,
      paymentData
    );
    return response.data;
  },

  // Payment history via dealer workflow endpoint
  getDealerWorkflowPayments: async (orderId) => {
    const response = await apiClient.get(
      `/api/dealer-workflow/orders/${orderId}/payments`
    );
    return response.data;
  },

  // Payment status overview for order
  getDealerWorkflowPaymentStatus: async (orderId) => {
    const response = await apiClient.get(
      `/api/dealer-workflow/orders/${orderId}/payment-status`
    );
    return response.data;
  }
};





