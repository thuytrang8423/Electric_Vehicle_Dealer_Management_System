import { apiClient } from '../apiConfig';

export const ordersAPI = {
  // Get all orders
  getAll: async () => {
    const response = await apiClient.get('/api/orders');
    return response.data;
  },

  // Get order by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data;
  },

  // Get orders by user
  getByUser: async (userId) => {
    const response = await apiClient.get(`/api/orders/user/${userId}`);
    return response.data;
  },

  // Get orders by quote
  getByQuote: async (quoteId) => {
    const response = await apiClient.get(`/api/orders/quote/${quoteId}`);
    return response.data;
  },

  // Get orders by dealer
  getByDealer: async (dealerId) => {
    const response = await apiClient.get(`/api/orders/dealer/${dealerId}`);
    return response.data;
  },

  // Get orders by customer
  getByCustomer: async (customerId) => {
    const response = await apiClient.get(`/api/orders/customer/${customerId}`);
    return response.data;
  },

  // Create order
  create: async (orderData) => {
    const response = await apiClient.post('/api/orders', orderData);
    return response.data;
  },

  // Update order
  update: async (id, orderData) => {
    const response = await apiClient.put(`/api/orders/${id}`, orderData);
    return response.data;
  },

  // Delete order
  delete: async (id) => {
    const response = await apiClient.delete(`/api/orders/${id}`);
    return response.data;
  },

  // ========== WORKFLOW APIs ==========

  // DEALER_STAFF: Create order from approved quote
  createFromApprovedQuote: async (orderData, staffId) => {
    const response = await apiClient.post(
      `/api/dealer-workflow/orders/create-from-approved-quote?staffId=${staffId}`,
      orderData
    );
    return response.data;
  },

  // DEALER_MANAGER/EVM_MANAGER: Get pending orders for approval
  getPendingApproval: async () => {
    const response = await apiClient.get('/api/workflow/orders/pending-approval');
    return response.data;
  },

  // DEALER_MANAGER: Approve order
  approveByDealerManager: async (orderId, approvedBy, notes) => {
    const response = await apiClient.post(
      `/api/dealer-workflow/orders/${orderId}/approve?approvedBy=${approvedBy}`,
      null,
      { params: { notes } }
    );
    return response.data;
  },

  // DEALER_MANAGER: Reject order
  rejectByDealerManager: async (orderId, rejectedBy, reason) => {
    const response = await apiClient.post(
      `/api/dealer-workflow/orders/${orderId}/reject?rejectedBy=${rejectedBy}&reason=${reason}`
    );
    return response.data;
  },

  // EVM_MANAGER: Approve order (with inventory processing)
  approveByEVM: async (orderId, approvedBy, notes) => {
    const response = await apiClient.post(
      `/api/workflow/orders/${orderId}/approve?approvedBy=${approvedBy}`,
      null,
      { params: { notes } }
    );
    return response.data;
  },

  // EVM_MANAGER: Reject order
  rejectByEVM: async (orderId, rejectedBy, reason) => {
    const response = await apiClient.post(
      `/api/workflow/orders/${orderId}/reject?rejectedBy=${rejectedBy}&reason=${reason}`
    );
    return response.data;
  },

  // Check if order can be approved
  canApprove: async (orderId) => {
    const response = await apiClient.get(`/api/workflow/orders/${orderId}/can-approve`);
    return response.data;
  }
};
