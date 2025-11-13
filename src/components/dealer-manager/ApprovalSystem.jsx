import React, { useState, useEffect } from 'react';
import { quotesAPI } from '../../utils/api/quotesAPI';
import { ordersAPI } from '../../utils/api/ordersAPI';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const ApprovalSystem = ({ user }) => {
  const [activeTab, setActiveTab] = useState('quotes'); // 'quotes' or 'orders'
  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [readyForEVMQuotes, setReadyForEVMQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [inventoryCheck, setInventoryCheck] = useState(null);
  const [quoteInventoryStatus, setQuoteInventoryStatus] = useState({}); // { quoteId: { hasSufficientInventory, loading, checked } }
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedQuoteForInventory, setSelectedQuoteForInventory] = useState(null);
  const [checkingInventory, setCheckingInventory] = useState(null);
  const [factoryInventoryResult, setFactoryInventoryResult] = useState(null);
  const [factoryInventoryRejectReason, setFactoryInventoryRejectReason] = useState('');
  const [approvingFactoryQuoteId, setApprovingFactoryQuoteId] = useState(null);
  const [rejectingFactoryQuoteId, setRejectingFactoryQuoteId] = useState(null);

  const userRole = user?.role?.toUpperCase().replace(/-/g, '_');
  const userId = user?.id || user?.userId || user?.user?.id;

  // Load pending items based on role
  useEffect(() => {
    const loadPendingItems = async () => {
      try {
        setLoading(true);
        
        if (userRole === 'DEALER_MANAGER' && userId) {
          // DEALER_MANAGER: Get pending quotes from staff (CHỈ quote của DEALER_STAFF)
          const quotes = await quotesAPI.getPendingDealerManagerApproval(userId);
          // Filter chỉ lấy quote của Staff
          const staffQuotes = Array.isArray(quotes) 
            ? quotes.filter((quote) => quote?.creatorRole === 'DEALER_STAFF')
            : [];
          setPendingQuotes(staffQuotes);
          
          // Quotes đã approved bởi manager (quote của Staff) - sẵn sàng tạo order
          const readyQuotes = await quotesAPI.getApprovedReady(userId);
          const filteredReadyQuotes = Array.isArray(readyQuotes)
            ? readyQuotes.filter((quote) => 
                quote?.creatorRole === 'DEALER_STAFF' && // CHỈ quote của Staff
                quote?.approvalStatus === 'APPROVED' &&
                quote?.status === 'ACCEPTED' &&
                quote?.approvedBy !== null &&
                Number(quote.approvedBy) === Number(userId)
              )
            : [];
          setReadyForEVMQuotes(filteredReadyQuotes);
          
          // Get pending orders (from dealer workflow - orders from Staff quotes)
          const orders = await ordersAPI.getPendingDealerManagerApproval();
          setPendingOrders(Array.isArray(orders) ? orders : []);
        } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
          // EVM_MANAGER/ADMIN: Get pending quotes for EVM approval (CHỈ quote của DEALER_MANAGER)
          const quotes = await quotesAPI.getPendingEVMApproval();
          // Filter CHẶT CHẼ: chỉ lấy quote của Manager, loại bỏ quotes của Staff
          const managerQuotes = Array.isArray(quotes)
            ? quotes.filter((quote) => {
                // Chỉ lấy quotes có creatorRole = DEALER_MANAGER, loại bỏ DEALER_STAFF và null/undefined
                return quote?.creatorRole === 'DEALER_MANAGER';
              })
            : [];
          setPendingQuotes(managerQuotes);
          
          // Get approved quotes ready for order creation (CHỈ quote của Manager)
          const approvedQuotes = await quotesAPI.getApprovedReadyForOrder();
          const managerApprovedQuotes = Array.isArray(approvedQuotes)
            ? approvedQuotes.filter((quote) => {
                // Chỉ lấy quotes có creatorRole = DEALER_MANAGER, loại bỏ DEALER_STAFF và null/undefined
                return quote?.creatorRole === 'DEALER_MANAGER';
              })
            : [];
          setReadyForEVMQuotes(managerApprovedQuotes);
          
          // Get pending orders (from EVM workflow - orders from Manager quotes)
          const orders = await ordersAPI.getPendingEVMApproval();
          setPendingOrders(Array.isArray(orders) ? orders : []);
        }
      } catch (error) {
        console.error('Error loading pending items:', error);
        showErrorToast(handleAPIError(error));
        setPendingQuotes([]);
        setPendingOrders([]);
        setReadyForEVMQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadPendingItems();
  }, [userRole, userId]);

  // Check inventory for DEALER_MANAGER
  const handleCheckDealerInventory = async (quote) => {
    const quoteId = quote.quoteId || quote.id;
    setCheckingInventory(quoteId);
    
    try {
      const result = await quotesAPI.checkDealerInventory(quoteId);
      setQuoteInventoryStatus(prev => ({
        ...prev,
        [quoteId]: {
          hasSufficientInventory: result.hasSufficientInventory,
          message: result.message,
          checked: true,
          loading: false
        }
      }));
      
      if (result.hasSufficientInventory) {
        showSuccessToast('Inventory is sufficient');
      } else {
        showErrorToast('Insufficient inventory in dealer warehouse');
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
      showErrorToast(handleAPIError(error));
      setQuoteInventoryStatus(prev => ({
        ...prev,
        [quoteId]: {
          checked: true,
          loading: false,
          error: true
        }
      }));
    } finally {
      setCheckingInventory(null);
    }
  };

  // Check inventory for EVM_MANAGER
  const handleCheckFactoryInventory = async (quote) => {
    const quoteId = quote.quoteId || quote.id;
    setCheckingInventory(quoteId);
    setSelectedQuoteForInventory(quote);
    setFactoryInventoryResult(null);
    setFactoryInventoryRejectReason('');
    
    try {
      const result = await quotesAPI.checkFactoryInventory(quoteId);
      setQuoteInventoryStatus(prev => ({
        ...prev,
        [quoteId]: {
          hasSufficientInventory: result.hasSufficientInventory,
          message: result.message,
          checked: true,
          loading: false
        }
      }));
      
      setInventoryCheck(result);
      setFactoryInventoryResult(result);
      setFactoryInventoryRejectReason(result?.hasSufficientInventory ? '' : (result?.message || ''));
      setShowInventoryModal(true);
      
      if (result.hasSufficientInventory) {
        showSuccessToast('Factory inventory is sufficient');
      } else {
        showErrorToast('Insufficient inventory in factory');
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
      showErrorToast(handleAPIError(error));
      setQuoteInventoryStatus(prev => ({
        ...prev,
        [quoteId]: {
          checked: true,
          loading: false,
          error: true
        }
      }));
    } finally {
      setCheckingInventory(null);
    }
  };

  const closeInventoryModal = () => {
    setShowInventoryModal(false);
    setSelectedQuoteForInventory(null);
    setInventoryCheck(null);
    setFactoryInventoryResult(null);
    setFactoryInventoryRejectReason('');
  };

  const reloadQuotesAfterEVMAction = async () => {
    const quotes = await quotesAPI.getPendingEVMApproval();
    const managerQuotes = Array.isArray(quotes)
      ? quotes.filter((quote) => quote?.creatorRole === 'DEALER_MANAGER')
      : [];
    setPendingQuotes(managerQuotes);

    const approvedQuotes = await quotesAPI.getApprovedReadyForOrder();
    const managerApprovedQuotes = Array.isArray(approvedQuotes)
      ? approvedQuotes.filter((quote) => quote?.creatorRole === 'DEALER_MANAGER')
      : [];
    setReadyForEVMQuotes(managerApprovedQuotes);
  };

  const handleApproveAfterFactoryInventory = async () => {
    if (!selectedQuoteForInventory || !userId) {
      showErrorToast('Missing quote or user information');
      return;
    }

    const quoteId = selectedQuoteForInventory.quoteId || selectedQuoteForInventory.id;
    const result = factoryInventoryResult || inventoryCheck;

    if (!result?.hasSufficientInventory) {
      showErrorToast('Cannot approve when factory inventory is insufficient');
      return;
    }

    try {
      setApprovingFactoryQuoteId(quoteId);
      await quotesAPI.approveByEVM(quoteId, userId, 'Approved by EVM Manager');
      showSuccessToast('Quote approved by EVM successfully');
      await reloadQuotesAfterEVMAction();
      closeInventoryModal();
    } catch (error) {
      console.error('Error approving quote via factory inventory modal:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setApprovingFactoryQuoteId(null);
    }
  };

  const handleRejectAfterFactoryInventory = async () => {
    if (!selectedQuoteForInventory || !userId) {
      showErrorToast('Missing quote or user information');
      return;
    }

    if (!factoryInventoryRejectReason.trim()) {
      showErrorToast('Please provide a rejection reason');
      return;
    }

    const quoteId = selectedQuoteForInventory.quoteId || selectedQuoteForInventory.id;

    try {
      setRejectingFactoryQuoteId(quoteId);
      await quotesAPI.rejectByEVM(quoteId, userId, factoryInventoryRejectReason.trim());
      showSuccessToast('Quote rejected by EVM');
      await reloadQuotesAfterEVMAction();
      closeInventoryModal();
    } catch (error) {
      console.error('Error rejecting quote via factory inventory modal:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setRejectingFactoryQuoteId(null);
    }
  };

  const handleApproveQuote = async (quote) => {
    if (!quote) {
      showErrorToast('Quote information is missing');
      return;
    }

    if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
      // Với EVM, luôn mở luồng kiểm tra tồn kho/mô-đun mới
      await handleCheckFactoryInventory(quote);
      return;
    }

    setSelectedItem(quote);
    setApproveNotes('');
    setShowApproveModal(true);
    
    // Auto-check inventory for DEALER_MANAGER before showing modal
    if (userRole === 'DEALER_MANAGER') {
      const quoteId = quote.quoteId || quote.id;
      if (!quoteInventoryStatus[quoteId]?.checked) {
        handleCheckDealerInventory(quote);
      }
    }
  };

  const handleConfirmApproveQuote = async () => {
    if (!selectedItem || !userId) {
      showErrorToast('Missing required information');
      return;
    }

    try {
      const quoteId = selectedItem.quoteId || selectedItem.id;
      
      if (userRole === 'DEALER_MANAGER') {
        // Check inventory before approving
        const inventoryStatus = quoteInventoryStatus[quoteId];
        if (!inventoryStatus?.checked) {
          showErrorToast('Please check inventory first');
          return;
        }
        if (!inventoryStatus.hasSufficientInventory) {
          showErrorToast('Cannot approve: Insufficient inventory in dealer warehouse');
          return;
        }
        
        await quotesAPI.approveByDealerManager(quoteId, userId, approveNotes);
        showSuccessToast('Quote approved by dealer manager successfully');
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        // Check inventory before approving
        try {
          const inventoryCheck = await quotesAPI.checkFactoryInventory(quoteId);
          setInventoryCheck(inventoryCheck);
          
          if (!inventoryCheck.hasSufficientInventory) {
            showErrorToast('Insufficient inventory in factory');
            setShowApproveModal(false);
            setSelectedItem(null);
            return;
          }
        } catch (error) {
          console.error('Error checking inventory:', error);
          showErrorToast('Error checking inventory');
          setShowApproveModal(false);
          setSelectedItem(null);
          return;
        }
        
        await quotesAPI.approveByEVM(quoteId, userId, approveNotes);
        showSuccessToast('Quote approved by EVM successfully');
      }
      
      // Reload pending quotes
      if (userRole === 'DEALER_MANAGER' && userId) {
        const quotes = await quotesAPI.getPendingDealerManagerApproval(userId);
        setPendingQuotes(Array.isArray(quotes) ? quotes : []);

        const readyQuotes = await quotesAPI.getApprovedReady(userId);
        const filteredReadyQuotes = Array.isArray(readyQuotes)
          ? readyQuotes.filter((quote) => 
              quote?.approvalStatus === 'APPROVED' &&
              quote?.status === 'ACCEPTED' &&
              quote?.approvedBy !== null &&
              Number(quote.approvedBy) === Number(userId)
            )
          : [];
        setReadyForEVMQuotes(filteredReadyQuotes);
        } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        // Reload pending quotes - CHỈ lấy quotes của Dealer Manager
        const quotes = await quotesAPI.getPendingEVMApproval();
        const managerQuotes = Array.isArray(quotes)
          ? quotes.filter((quote) => quote?.creatorRole === 'DEALER_MANAGER')
          : [];
        setPendingQuotes(managerQuotes);
        
        // Reload approved quotes ready for order creation - CHỈ lấy quotes của Dealer Manager
        const approvedQuotes = await quotesAPI.getApprovedReadyForOrder();
        const managerApprovedQuotes = Array.isArray(approvedQuotes)
          ? approvedQuotes.filter((quote) => quote?.creatorRole === 'DEALER_MANAGER')
          : [];
        setReadyForEVMQuotes(managerApprovedQuotes);
      }
      
      setShowApproveModal(false);
      setSelectedItem(null);
      setApproveNotes('');
    } catch (error) {
      console.error('Error approving quote:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const handleRejectQuote = async (quote) => {
    setSelectedItem(quote);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmRejectQuote = async () => {
    if (!selectedItem || !userId || !rejectReason) {
      showErrorToast('Please provide rejection reason');
      return;
    }

    try {
      const quoteId = selectedItem.quoteId || selectedItem.id;
      
      if (userRole === 'DEALER_MANAGER') {
        await quotesAPI.rejectByDealerManager(quoteId, userId, rejectReason);
        showSuccessToast('Quote rejected by dealer manager');
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        await quotesAPI.rejectByEVM(quoteId, userId, rejectReason);
        showSuccessToast('Quote rejected by EVM');
      }
      
      // Reload pending quotes
      if (userRole === 'DEALER_MANAGER' && userId) {
        const quotes = await quotesAPI.getPendingDealerManagerApproval(userId);
        setPendingQuotes(Array.isArray(quotes) ? quotes : []);

        const readyQuotes = await quotesAPI.getApprovedReady(userId);
        const filteredReadyQuotes = Array.isArray(readyQuotes)
          ? readyQuotes.filter((quote) => 
              quote?.approvalStatus === 'APPROVED' &&
              quote?.status === 'ACCEPTED' &&
              quote?.approvedBy !== null &&
              Number(quote.approvedBy) === Number(userId)
            )
          : [];
        setReadyForEVMQuotes(filteredReadyQuotes);
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        // Reload pending quotes - CHỈ lấy quotes của Dealer Manager
        const quotes = await quotesAPI.getPendingEVMApproval();
        const managerQuotes = Array.isArray(quotes)
          ? quotes.filter((quote) => quote?.creatorRole === 'DEALER_MANAGER')
          : [];
        setPendingQuotes(managerQuotes);
        
        // Reload approved quotes - CHỈ lấy quotes của Dealer Manager
        const approvedQuotes = await quotesAPI.getApprovedReadyForOrder();
        const managerApprovedQuotes = Array.isArray(approvedQuotes)
          ? approvedQuotes.filter((quote) => quote?.creatorRole === 'DEALER_MANAGER')
          : [];
        setReadyForEVMQuotes(managerApprovedQuotes);
      }
      
      setShowRejectModal(false);
      setSelectedItem(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting quote:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const handleSubmitQuoteToEVM = async (quote) => {
    const quoteId = quote.quoteId || quote.id;
    const creatorRole = quote.creatorRole;
    
    // 🔥 CHỈ cho phép submit quote của Dealer Manager
    if (creatorRole !== 'DEALER_MANAGER') {
      showErrorToast('Only quotes created by Dealer Manager can be submitted to EVM. Staff quotes do not go to EVM.');
      return;
    }
    
    // Reload quote data to ensure we have the latest status
    let latestQuote;
    try {
      latestQuote = await quotesAPI.getById(quoteId);
    } catch (error) {
      console.warn('Could not reload quote, using cached data:', error);
      latestQuote = quote;
    }
    
    // Validate quote status before submitting
    const approvalStatus = latestQuote.approvalStatus || quote.approvalStatus;
    const status = latestQuote.status || quote.status;
    
    // Check if already submitted to EVM
    if (approvalStatus === 'PENDING_EVM_APPROVAL') {
      showErrorToast('Quote has already been submitted to EVM for approval');
      return;
    }
    
    // 🔥 Quote của Manager phải ở DRAFT status để submit lên EVM
    if (approvalStatus !== 'DRAFT' || status !== 'DRAFT') {
      showErrorToast(
        `Cannot submit quote to EVM:\n` +
        `Current status: ${approvalStatus}, ${status}\n` +
        `Quote of Dealer Manager must be in DRAFT status to submit to EVM.`
      );
      return;
    }
    
    const confirmMessage = 
      `Submit Quote #${quoteId} (created by Dealer Manager) to EVM for approval?\n\n` +
      `This quote will be sent directly to EVM Manager for review.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await quotesAPI.submitForEVMApproval(quoteId);
      showSuccessToast('Quote submitted to EVM successfully');
      
      // Reload pending quotes - Manager quotes của chính Manager này
      if (userRole === 'DEALER_MANAGER' && userId) {
        // Reload quotes của Manager đang chờ EVM approval
        const quotes = await quotesAPI.getPendingEVMApproval();
        const myManagerQuotes = Array.isArray(quotes)
          ? quotes.filter((q) => 
              q?.creatorRole === 'DEALER_MANAGER' &&
              (q?.userId === null || Number(q.userId) === Number(userId))
            )
          : [];
        // Không cần set vào pendingQuotes vì đây là quote của Manager, không phải Staff
      }
    } catch (error) {
      console.error('Error submitting quote to EVM:', error);
      const errorMessage = handleAPIError(error);
      showErrorToast(`Error submitting quote: ${errorMessage}`);
    }
  };

  const handleApproveOrder = async (order) => {
    setSelectedItem(order);
    setApproveNotes('');
    setShowApproveModal(true);
  };

  const handleConfirmApproveOrder = async () => {
    if (!selectedItem || !userId) {
      showErrorToast('Missing required information');
      return;
    }

    try {
      const orderId = selectedItem.orderId || selectedItem.id;
      
      if (userRole === 'DEALER_MANAGER') {
        await ordersAPI.approveByDealerManager(orderId, userId, approveNotes);
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        await ordersAPI.approveByEVM(orderId, userId, approveNotes);
      }
      
      showSuccessToast('Order approved successfully with inventory processing');
      
      // Reload pending orders based on role
      if (userRole === 'DEALER_MANAGER') {
        const orders = await ordersAPI.getPendingDealerManagerApproval();
        setPendingOrders(Array.isArray(orders) ? orders : []);
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        const orders = await ordersAPI.getPendingEVMApproval();
        setPendingOrders(Array.isArray(orders) ? orders : []);
      }
      
      setShowApproveModal(false);
      setSelectedItem(null);
      setApproveNotes('');
    } catch (error) {
      console.error('Error approving order:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const handleRejectOrder = async (order) => {
    setSelectedItem(order);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmRejectOrder = async () => {
    if (!selectedItem || !userId || !rejectReason) {
      showErrorToast('Please provide rejection reason');
      return;
    }

    try {
      const orderId = selectedItem.orderId || selectedItem.id;
      
      if (userRole === 'DEALER_MANAGER') {
        await ordersAPI.rejectByDealerManager(orderId, userId, rejectReason);
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        await ordersAPI.rejectByEVM(orderId, userId, rejectReason);
      }
      
      showSuccessToast('Order rejected');
      
      // Reload pending orders based on role
      if (userRole === 'DEALER_MANAGER') {
        const orders = await ordersAPI.getPendingDealerManagerApproval();
        setPendingOrders(Array.isArray(orders) ? orders : []);
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        const orders = await ordersAPI.getPendingEVMApproval();
        setPendingOrders(Array.isArray(orders) ? orders : []);
      }
      
      setShowRejectModal(false);
      setSelectedItem(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting order:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const canSubmitToEVM = (quote) => {
    const approvalStatus = quote.approvalStatus || '';
    const status = quote.status || '';
    const creatorRole = quote.creatorRole;
    
    // 🔥 CHỈ quote của Dealer Manager mới có thể submit lên EVM
    // Và phải ở DRAFT status
    return userRole === 'DEALER_MANAGER' &&
           creatorRole === 'DEALER_MANAGER' && // CHỈ quote của Manager
           approvalStatus === 'DRAFT' &&
           status === 'DRAFT' &&
           approvalStatus !== 'PENDING_EVM_APPROVAL'; // Don't allow if already submitted
  };

  if (loading) {
    return (
      <div className="main">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}></i>
          <div style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>Loading pending approvals...</div>
        </div>
      </div>
    );
  }

  const inventoryResultData = factoryInventoryResult || inventoryCheck;
  const selectedInventoryQuoteId = selectedQuoteForInventory
    ? (selectedQuoteForInventory.quoteId || selectedQuoteForInventory.id)
    : null;

  return (
    <div className="main">
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>Approval System</h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('quotes')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'quotes' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'quotes' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === 'quotes' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Quotes ({pendingQuotes.length + readyForEVMQuotes.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'orders' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === 'orders' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Orders ({pendingOrders.length})
          </button>
        </div>

        {/* Pending Quotes */}
        {activeTab === 'quotes' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* EVM Manager: Show info about pending quotes */}
            {(userRole === 'EVM_MANAGER' || userRole === 'ADMIN') && pendingQuotes.length > 0 && (
              <div style={{ 
                padding: '12px 16px', 
                background: 'var(--color-info)', 
                borderRadius: 'var(--radius)',
                color: 'white',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                <i className="bx bx-info-circle" style={{ marginRight: '8px' }}></i>
                <strong>EVM Workflow:</strong> These quotes were created by Dealer Managers and are waiting for your approval. 
                <strong style={{ display: 'block', marginTop: '4px' }}>Note: EVM only approves quotes from Dealer Managers, not from Dealer Staff.</strong>
              </div>
            )}

            {/* Dealer Manager: Show info about pending quotes */}
            {userRole === 'DEALER_MANAGER' && pendingQuotes.length > 0 && (
              <div style={{ 
                padding: '12px 16px', 
                background: 'var(--color-info)', 
                borderRadius: 'var(--radius)',
                color: 'white',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                <i className="bx bx-info-circle" style={{ marginRight: '8px' }}></i>
                <strong>Dealer Manager Workflow:</strong> These quotes were created by Dealer Staff and are waiting for your approval.
                <strong style={{ display: 'block', marginTop: '4px' }}>Note: Quotes from Staff only need your approval, they do NOT go to EVM.</strong>
              </div>
            )}

            {pendingQuotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-file" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <div>No pending quotes</div>
                {(userRole === 'EVM_MANAGER' || userRole === 'ADMIN') && (
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    Quotes will appear here after Dealer Managers submit them for EVM approval
                  </div>
                )}
              </div>
            ) : (
              pendingQuotes.map(quote => {
                const customerName = quote.customer?.fullName || quote.customerName || 'N/A';
                const vehicleName = quote.vehicle?.name || quote.vehicleName || 'N/A';
                const totalAmount = quote.finalTotal || quote.totalAmount || 0;
                const quoteId = quote.quoteId || quote.id;
                const approvalStatus = quote.approvalStatus || '';
                const inventoryStatus = quoteInventoryStatus[quoteId];
                const isInsufficientInventory = approvalStatus === 'INSUFFICIENT_INVENTORY';
                
                return (
                  <div key={quoteId} style={{ 
                    padding: '20px', 
                    background: 'var(--color-bg)', 
                    borderRadius: 'var(--radius)', 
                    border: isInsufficientInventory ? '2px solid var(--color-warning)' : '1px solid var(--color-border)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
                            QUOTE - #{quoteId}
                          </h3>
                          {isInsufficientInventory && (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--radius)',
                              background: 'var(--color-warning)',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              ⚠️ Insufficient Inventory
                            </span>
                          )}
                          {inventoryStatus?.checked && !isInsufficientInventory && (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--radius)',
                              background: inventoryStatus.hasSufficientInventory ? 'var(--color-success)' : 'var(--color-error)',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              {inventoryStatus.hasSufficientInventory ? '✅ Inventory OK' : '❌ Insufficient'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                          Customer: {customerName} | Vehicle: {vehicleName}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                          Created: {quote.createdDate ? new Date(quote.createdDate).toLocaleDateString() : 'N/A'}
                        </div>
                        {inventoryStatus?.message && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: inventoryStatus.hasSufficientInventory ? 'var(--color-success)' : 'var(--color-error)',
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            {inventoryStatus.message}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>
                        ${totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {(approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL' || approvalStatus === 'PENDING_EVM_APPROVAL' || isInsufficientInventory) && (
                        <>
                          {userRole === 'DEALER_MANAGER' && (
                            <>
                              <button 
                                className="btn btn-outline" 
                                onClick={() => handleCheckDealerInventory(quote)}
                                disabled={checkingInventory === quoteId}
                                style={{ 
                                  borderColor: 'var(--color-info)',
                                  color: 'var(--color-info)'
                                }}
                              >
                                <i className={`bx ${checkingInventory === quoteId ? 'bx-loader-alt bx-spin' : 'bx-check-square'}`}></i>
                                {checkingInventory === quoteId ? 'Checking...' : 'Check Inventory'}
                              </button>
                              <button 
                                className="btn btn-danger" 
                                onClick={() => handleRejectQuote(quote)}
                                style={{ 
                                  background: 'var(--color-error)', 
                                  borderColor: 'var(--color-error)', 
                                  color: '#fff' 
                                }}
                              >
                                <i className="bx bx-x"></i>
                                Reject
                              </button>
                              <button 
                                className="btn btn-success" 
                                onClick={() => handleApproveQuote(quote)}
                                disabled={inventoryStatus?.checked && !inventoryStatus?.hasSufficientInventory}
                                style={{ 
                                  background: 'var(--color-success)', 
                                  borderColor: 'var(--color-success)', 
                                  color: '#fff' 
                                }}
                              >
                                <i className="bx bx-check"></i>
                                Approve
                              </button>
                            </>
                          )}
                          {(userRole === 'EVM_MANAGER' || userRole === 'ADMIN') && (
                            <button 
                              className="btn btn-outline" 
                              onClick={() => handleCheckFactoryInventory(quote)}
                              disabled={checkingInventory === quoteId}
                              style={{ 
                                borderColor: 'var(--color-info)',
                                color: 'var(--color-info)'
                              }}
                            >
                              <i className={`bx ${checkingInventory === quoteId ? 'bx-loader-alt bx-spin' : 'bx-analyse'}`}></i>
                              {checkingInventory === quoteId ? 'Checking...' : 'Check Inventory'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {userRole === 'DEALER_MANAGER' && (
              <div style={{ 
                padding: '20px', 
                background: 'var(--color-bg)', 
                borderRadius: 'var(--radius)', 
                border: '1px solid var(--color-border)',
                marginTop: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
                    ✅ Approved Quotes (from Staff) - Ready for Order Creation
                  </h3>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    {readyForEVMQuotes.length}
                  </span>
                </div>

                {readyForEVMQuotes.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '32px', 
                    color: 'var(--color-text-muted)', 
                    border: '1px dashed var(--color-border)', 
                    borderRadius: 'var(--radius)' 
                  }}>
                    <i className="bx bx-check-circle" style={{ fontSize: '40px', marginBottom: '12px', opacity: '0.5' }}></i>
                    <div>No approved quotes from staff ready for order creation yet.</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      Approve staff quotes first to move them into this queue.
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '8px', color: 'var(--color-info)', fontStyle: 'italic' }}>
                      Note: Quotes from Staff do NOT go to EVM. They only need your approval.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {readyForEVMQuotes.map(quote => {
                      const quoteId = quote.quoteId || quote.id;
                      const customerName = quote.customer?.fullName || quote.customerName || 'N/A';
                      const vehicleName = quote.vehicle?.name || quote.vehicleName || 'N/A';
                      const totalAmount = quote.finalTotal || quote.totalAmount || 0;

                      return (
                        <div
                          key={`ready-${quoteId}`}
                          style={{
                            padding: '16px',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius)',
                            background: 'var(--color-surface)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '16px', color: 'var(--color-text)' }}>
                                QUOTE - #{quoteId} (from Staff)
                              </div>
                              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                                Customer: {customerName} | Vehicle: {vehicleName}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '6px' }}>
                                ✓ Approved by you - Staff can now create order
                              </div>
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-primary)' }}>
                              ${totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pending Orders */}
        {activeTab === 'orders' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {pendingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-shopping-bag" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <div>No pending orders</div>
              </div>
            ) : (
              pendingOrders.map(order => {
                const customerName = order.customer?.fullName || order.customerName || 'N/A';
                const vehicleName = order.vehicle?.name || order.vehicleName || 'N/A';
                const totalAmount = order.totalAmount || order.amount || 0;
                const orderNumber = order.orderNumber || order.orderId?.toString() || 'N/A';
                const approvalStatus = order.approvalStatus || order.orderApprovalStatus || '';
                
                return (
                  <div key={order.orderId || order.id} style={{ 
                    padding: '20px', 
                    background: 'var(--color-bg)', 
                    borderRadius: 'var(--radius)', 
                    border: '1px solid var(--color-border)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
                          ORDER - {orderNumber}
                        </h3>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                          Customer: {customerName} | Vehicle: {vehicleName}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                          Order Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                        </div>
                        {order.quoteId && (
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            From Quote: #{order.quoteId}
                          </div>
                        )}
                        {userRole === 'EVM_MANAGER' || userRole === 'ADMIN' ? (
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--color-info)', 
                            marginTop: '8px',
                            padding: '4px 8px',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius)',
                            display: 'inline-block'
                          }}>
                            ⚠ Approving will process inventory automatically
                          </div>
                        ) : null}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>
                        ${totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      {approvalStatus === 'PENDING_APPROVAL' && (
                        <>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => handleRejectOrder(order)}
                            style={{ color: 'var(--color-error)' }}
                          >
                            <i className="bx bx-x"></i>
                            Reject
                          </button>
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleApproveOrder(order)}
                          >
                            <i className="bx bx-check"></i>
                            Approve
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Approve {activeTab === 'quotes' ? 'Quote' : 'Order'}</h3>
              <button 
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedItem(null);
                  setApproveNotes('');
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                {activeTab === 'quotes' ? 'Quote' : 'Order'}
              </div>
              <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                #{activeTab === 'quotes' ? (selectedItem.quoteId || selectedItem.id) : (selectedItem.orderNumber || selectedItem.orderId || selectedItem.id)}
              </div>
            </div>

            {activeTab === 'quotes' && (
              <>
                {userRole === 'DEALER_MANAGER' && selectedItem && quoteInventoryStatus[selectedItem.quoteId || selectedItem.id]?.checked && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    background: quoteInventoryStatus[selectedItem.quoteId || selectedItem.id].hasSufficientInventory ? 'var(--color-success)' : 'var(--color-error)',
                    borderRadius: 'var(--radius)',
                    color: 'white',
                    fontSize: '14px'
                  }}>
                    {quoteInventoryStatus[selectedItem.quoteId || selectedItem.id].hasSufficientInventory 
                      ? '✓ Dealer inventory is sufficient' 
                      : '✗ Insufficient inventory in dealer warehouse'}
                    {quoteInventoryStatus[selectedItem.quoteId || selectedItem.id].message && (
                      <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                        {quoteInventoryStatus[selectedItem.quoteId || selectedItem.id].message}
                      </div>
                    )}
                  </div>
                )}
                {(userRole === 'EVM_MANAGER' || userRole === 'ADMIN') && inventoryCheck && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    background: inventoryCheck.hasSufficientInventory ? 'var(--color-success)' : 'var(--color-error)',
                    borderRadius: 'var(--radius)',
                    color: 'white',
                    fontSize: '14px'
                  }}>
                    {inventoryCheck.hasSufficientInventory ? '✓ Factory inventory is sufficient' : '✗ Insufficient inventory in factory'}
                    {inventoryCheck.message && (
                      <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                        {inventoryCheck.message}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                Approval Notes (Optional)
              </label>
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Add approval notes..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedItem(null);
                  setApproveNotes('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (activeTab === 'quotes') {
                    handleConfirmApproveQuote();
                  } else {
                    handleConfirmApproveOrder();
                  }
                }}
              >
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Reject {activeTab === 'quotes' ? 'Quote' : 'Order'}</h3>
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedItem(null);
                  setRejectReason('');
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                {activeTab === 'quotes' ? 'Quote' : 'Order'}
              </div>
              <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                #{activeTab === 'quotes' ? (selectedItem.quoteId || selectedItem.id) : (selectedItem.orderNumber || selectedItem.orderId || selectedItem.id)}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Enter rejection reason..."
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedItem(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (activeTab === 'quotes') {
                    handleConfirmRejectQuote();
                  } else {
                    handleConfirmRejectOrder();
                  }
                }}
                style={{ background: 'var(--color-error)' }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Factory Inventory Modal for EVM Manager */}
      {showInventoryModal && selectedQuoteForInventory && inventoryResultData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3>Factory Inventory Check - Quote #{selectedInventoryQuoteId}</h3>
              <button 
              onClick={closeInventoryModal}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ 
              marginBottom: '16px', 
              padding: '16px', 
              background: inventoryResultData.hasSufficientInventory ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              borderRadius: 'var(--radius)',
              border: `1px solid ${inventoryResultData.hasSufficientInventory ? 'var(--color-success)' : 'var(--color-error)'}`,
              color: inventoryResultData.hasSufficientInventory ? 'var(--color-success)' : 'var(--color-error)',
              fontSize: '15px',
              fontWeight: '600'
            }}>
              <i 
                className={`bx ${inventoryResultData.hasSufficientInventory ? 'bx-check-circle' : 'bx-error-circle'}`}
                style={{ marginRight: '8px', fontSize: '20px', verticalAlign: 'middle' }}
              ></i>
              {inventoryResultData.hasSufficientInventory 
                ? 'Factory inventory is sufficient for this quote.' 
                : 'Factory inventory is insufficient for this quote.'}
            </div>

            {inventoryResultData.message && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius)',
                fontSize: '14px',
                color: 'var(--color-text)'
              }}>
                <strong>Message:</strong> {inventoryResultData.message}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Quote Information
              </div>
              <div style={{ padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ marginBottom: '4px' }}>
                  <strong>Customer:</strong> {selectedQuoteForInventory.customer?.fullName || selectedQuoteForInventory.customerName || 'N/A'}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>Total Amount:</strong> ${(selectedQuoteForInventory.finalTotal || selectedQuoteForInventory.totalAmount || 0).toLocaleString()}
                </div>
                {selectedQuoteForInventory.quoteDetails && selectedQuoteForInventory.quoteDetails.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <strong>Quote Details:</strong>
                    <div style={{ marginTop: '8px', fontSize: '13px' }}>
                      {selectedQuoteForInventory.quoteDetails.map((detail, idx) => (
                        <div key={idx} style={{ padding: '8px', background: 'var(--color-surface)', borderRadius: '4px', marginTop: '4px' }}>
                          Vehicle ID: {detail.vehicleId} | Quantity: {detail.quantity} | Unit Price: ${detail.unitPrice?.toLocaleString() || 'N/A'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!inventoryResultData.hasSufficientInventory && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                  Rejection Reason <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <textarea
                  value={factoryInventoryRejectReason}
                  onChange={(e) => setFactoryInventoryRejectReason(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '110px',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Provide the reason for rejection..."
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                onClick={closeInventoryModal}
              >
                Close
              </button>
              {inventoryResultData.hasSufficientInventory ? (
                <button 
                  className="btn btn-success" 
                  style={{
                    background: 'var(--color-success)',
                    borderColor: 'var(--color-success)',
                    color: '#fff'
                  }}
                  onClick={handleApproveAfterFactoryInventory}
                  disabled={approvingFactoryQuoteId === selectedInventoryQuoteId}
                >
                  <i className={`bx ${approvingFactoryQuoteId === selectedInventoryQuoteId ? 'bx-loader-alt bx-spin' : 'bx-check'}`}></i>
                  {approvingFactoryQuoteId === selectedInventoryQuoteId ? 'Approving...' : 'Approve'}
                </button>
              ) : (
                <button 
                  className="btn btn-danger" 
                  style={{
                    background: 'var(--color-error)',
                    borderColor: 'var(--color-error)',
                    color: '#fff'
                  }}
                  onClick={handleRejectAfterFactoryInventory}
                  disabled={rejectingFactoryQuoteId === selectedInventoryQuoteId}
                >
                  <i className={`bx ${rejectingFactoryQuoteId === selectedInventoryQuoteId ? 'bx-loader-alt bx-spin' : 'bx-x'}`}></i>
                  {rejectingFactoryQuoteId === selectedInventoryQuoteId ? 'Rejecting...' : 'Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalSystem;
