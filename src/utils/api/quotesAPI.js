import { apiClient } from '../apiConfig';

export const quotesAPI = {
  // Get all quotes
  getAll: async () => {
    const response = await apiClient.get('/api/quotes');
    return response.data;
  },

  // Get quote by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/quotes/${id}`);
    return response.data;
  },

  // Get quotes by user
  getByUser: async (userId) => {
    const response = await apiClient.get(`/api/quotes/user/${userId}`);
    return response.data;
  },

  // Get quotes by customer
  getByCustomer: async (customerId) => {
    const response = await apiClient.get(`/api/quotes/customer/${customerId}`);
    return response.data;
  },

  // Expire old quotes
  expireOld: async () => {
    const response = await apiClient.post('/api/quotes/expire-old');
    return response.data;
  },

  // Create quote
  create: async (quoteData) => {
    const response = await apiClient.post('/api/quotes', quoteData);
    return response.data;
  },

  // Update quote
  update: async (id, quoteData) => {
    const response = await apiClient.put(`/api/quotes/${id}`, quoteData);
    return response.data;
  },

  // Delete quote
  delete: async (id) => {
    const response = await apiClient.delete(`/api/quotes/${id}`);
    return response.data;
  },

  // ========== WORKFLOW APIs ==========
  
  // DEALER_STAFF: Submit quote for dealer manager approval
  submitForDealerManagerApproval: async (quoteId, staffId) => {
    const response = await apiClient.post(
      `/api/dealer-workflow/quotes/${quoteId}/submit-for-approval?staffId=${staffId}`
    );
    return response.data;
  },

  // DEALER_MANAGER: Get pending quotes for approval
  getPendingDealerManagerApproval: async (managerId) => {
    const response = await apiClient.get(
      `/api/dealer-workflow/quotes/pending-approval?managerId=${managerId}`
    );
    return response.data;
  },

  // DEALER_MANAGER: Approve quote
  approveByDealerManager: async (quoteId, managerId, notes) => {
    const response = await apiClient.post(
      `/api/dealer-workflow/quotes/${quoteId}/approve?managerId=${managerId}`,
      null,
      { params: { notes } }
    );
    return response.data;
  },

  // DEALER_MANAGER: Reject quote
  rejectByDealerManager: async (quoteId, managerId, reason) => {
    const response = await apiClient.post(
      `/api/dealer-workflow/quotes/${quoteId}/reject?managerId=${managerId}&reason=${reason}`
    );
    return response.data;
  },

  // DEALER_MANAGER: Check dealer inventory
  checkDealerInventory: async (quoteId) => {
    const response = await apiClient.get(
      `/api/dealer-workflow/quotes/${quoteId}/check-inventory`
    );
    return response.data;
  },

  // DEALER_MANAGER: Get approved quotes ready to create order
  getApprovedReady: async (managerId) => {
    const response = await apiClient.get(
      `/api/dealer-workflow/quotes/approved-ready?managerId=${managerId}`
    );
    return response.data;
  },

  // DEALER_MANAGER: Submit quote for EVM approval
  submitForEVMApproval: async (quoteId) => {
    const response = await apiClient.post(
      `/api/workflow/quotes/${quoteId}/submit-for-approval`
    );
    return response.data;
  },

  // EVM_MANAGER: Get pending quotes for EVM approval
  getPendingEVMApproval: async () => {
    const response = await apiClient.get('/api/workflow/quotes/pending-approval');
    return response.data;
  },

  // EVM_MANAGER: Check factory inventory
  checkFactoryInventory: async (quoteId) => {
    const response = await apiClient.get(
      `/api/workflow/quotes/${quoteId}/check-inventory`
    );
    return response.data;
  },

  // EVM_MANAGER: Approve quote
  approveByEVM: async (quoteId, evmUserId, notes) => {
    const response = await apiClient.post(
      `/api/workflow/quotes/${quoteId}/approve?evmUserId=${evmUserId}`,
      null,
      { params: { notes } }
    );
    return response.data;
  },

  // EVM_MANAGER: Reject quote
  rejectByEVM: async (quoteId, evmUserId, reason) => {
    const response = await apiClient.post(
      `/api/workflow/quotes/${quoteId}/reject?evmUserId=${evmUserId}&reason=${reason}`
    );
    return response.data;
  },

  // Get approved quotes ready to create order (EVM workflow)
  getApprovedReadyForOrder: async () => {
    const response = await apiClient.get('/api/workflow/quotes/approved-ready');
    return response.data;
  },

  // DEALER_STAFF: Get approved quotes ready to create order (Dealer workflow)
  getApprovedReadyForDealerStaff: async () => {
    const response = await apiClient.get('/api/dealer-workflow/quotes/approved-ready');
    return response.data;
  },

  // Check if quote can create order
  canCreateOrder: async (quoteId) => {
    try {
      const response = await apiClient.get(
        `/api/dealer-workflow/quotes/${quoteId}/can-create-order`
      );
      return response.data;
    } catch (error) {
      // fallback for global workflow endpoint if dealer path not available
      const response = await apiClient.get(
        `/api/workflow/quotes/${quoteId}/can-create-order`
      );
      return response.data;
    }
  }
};
