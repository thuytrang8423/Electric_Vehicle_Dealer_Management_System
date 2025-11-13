import { apiClient } from '../apiConfig';

export const ordersAPI = {
  // Get all orders (SHOULD BE RESTRICTED BY ROLE/POLICY ON BACKEND)
  getAll: async () => {
    const response = await apiClient.get('/api/orders');
    return response.data;
  },

  // Get order by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data;
  },

  // Get orders by user (e.g., Dealer Staff's own orders)
  getByUser: async (userId) => {
    const response = await apiClient.get(`/api/orders/user/${userId}`);
    return response.data;
  },

  // Get orders by quote
  getByQuote: async (quoteId) => {
    const response = await apiClient.get(`/api/orders/quote/${quoteId}`);
    return response.data;
  },

  // Get orders by dealer (alias maintained for backward compatibility)
  getByDealer: async (dealerId) => {
    return ordersAPI.getOrdersByDealerId(dealerId);
  },

  // Get orders by dealer (USED BY DEALER MANAGER: retrieves all orders for their dealer, including staff's)
  getOrdersByDealerId: async (dealerId) => { // ĐÃ ĐỔI TÊN HÀM
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

  // DEALER_STAFF: Create order from approved quote (Dealer Workflow)
  createFromApprovedQuote: async (orderData, staffId) => {
    const response = await apiClient.post(
      `/api/dealer-workflow/orders/create-from-approved-quote?staffId=${staffId}`,
      orderData
    );
    return response.data;
  },

  // DEALER_MANAGER: Create order from approved quote (Dealer Workflow - sends to EVM)
  createFromApprovedQuoteByManager: async (orderData) => {
    const response = await apiClient.post(
      `/api/dealer-workflow/orders/create-from-approved-quote`,
      orderData
    );
    return response.data;
  },

  // EVM Workflow: Create order from quote approved by EVM
  createFromEVMApprovedQuote: async (orderData) => {
    const response = await apiClient.post(
      `/api/workflow/orders/create-from-approved-quote`,
      orderData
    );
    return response.data;
  },

  // DEALER_MANAGER: Get pending orders for approval (from dealer workflow)
  getPendingDealerManagerApproval: async () => {
    const response = await apiClient.get('/api/dealer-workflow/orders/pending-approval');
    return response.data;
  },

  // EVM_MANAGER: Get pending orders for approval (from EVM workflow)
  getPendingEVMApproval: async () => {
    const response = await apiClient.get('/api/workflow/orders/pending-approval');
    return response.data;
  },

  // Legacy: Get pending orders (defaults to dealer workflow for backward compatibility)
  getPendingApproval: async () => {
    const response = await apiClient.get('/api/dealer-workflow/orders/pending-approval');
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
  // Sử dụng cho EVM khi nhận được order từ dealer manager
  // API: POST /api/workflow/orders/{orderId}/approve?approvedBy={approvedBy}&notes={notes}
  approveByEVM: async (orderId, approvedBy, notes) => {
    const params = new URLSearchParams();
    params.append('approvedBy', approvedBy);
    if (notes) {
      params.append('notes', notes);
    }
    const response = await apiClient.post(
      `/api/workflow/orders/${orderId}/approve?${params.toString()}`
    );
    return response.data;
  },

  // EVM_MANAGER: Reject order
  // Sử dụng cho EVM khi nhận được order từ dealer manager
  // API: POST /api/workflow/orders/{orderId}/reject?rejectedBy={rejectedBy}&reason={reason}
  rejectByEVM: async (orderId, rejectedBy, reason) => {
    const params = new URLSearchParams();
    params.append('rejectedBy', rejectedBy);
    params.append('reason', reason);
    const response = await apiClient.post(
      `/api/workflow/orders/${orderId}/reject?${params.toString()}`
    );
    return response.data;
  },

  // DEALER_MANAGER: Check if order can be approved (dealer workflow)
  canApproveByDealerManager: async (orderId) => {
    const response = await apiClient.get(`/api/dealer-workflow/orders/${orderId}/can-approve`);
    return response.data;
  },

  // EVM_MANAGER: Check if order can be approved (EVM workflow)
  canApproveByEVM: async (orderId) => {
    const response = await apiClient.get(`/api/workflow/orders/${orderId}/can-approve`);
    return response.data;
  },

  // Legacy: Check if order can be approved (defaults to dealer workflow for backward compatibility)
  canApprove: async (orderId) => {
    try {
      const response = await apiClient.get(`/api/dealer-workflow/orders/${orderId}/can-approve`);
      return response.data;
    } catch (error) {
      // Fallback to EVM workflow if dealer workflow fails
      const response = await apiClient.get(`/api/workflow/orders/${orderId}/can-approve`);
      return response.data;
    }
  }
};