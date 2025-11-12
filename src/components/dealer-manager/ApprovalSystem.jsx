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
  const [loading, setLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [inventoryCheck, setInventoryCheck] = useState(null);

  const userRole = user?.role?.toUpperCase().replace(/-/g, '_');
  const userId = user?.id || user?.userId || user?.user?.id;

  // Load pending items based on role
  useEffect(() => {
    const loadPendingItems = async () => {
      try {
        setLoading(true);
        
        if (userRole === 'DEALER_MANAGER' && userId) {
          // DEALER_MANAGER: Get pending quotes from staff
          const quotes = await quotesAPI.getPendingDealerManagerApproval(userId);
          setPendingQuotes(Array.isArray(quotes) ? quotes : []);
          
          // Get pending orders
          const orders = await ordersAPI.getPendingApproval();
          setPendingOrders(Array.isArray(orders) ? orders : []);
        } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
          // EVM_MANAGER/ADMIN: Get pending quotes for EVM approval
          const quotes = await quotesAPI.getPendingEVMApproval();
          setPendingQuotes(Array.isArray(quotes) ? quotes : []);
          
          // Get pending orders
          const orders = await ordersAPI.getPendingApproval();
          setPendingOrders(Array.isArray(orders) ? orders : []);
        }
      } catch (error) {
        console.error('Error loading pending items:', error);
        showErrorToast(handleAPIError(error));
        setPendingQuotes([]);
        setPendingOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadPendingItems();
  }, [userRole, userId]);

  const handleApproveQuote = async (quote) => {
    setSelectedItem(quote);
    setApproveNotes('');
    setShowApproveModal(true);
  };

  const handleConfirmApproveQuote = async () => {
    if (!selectedItem || !userId) {
      showErrorToast('Missing required information');
      return;
    }

    try {
      const quoteId = selectedItem.quoteId || selectedItem.id;
      
      if (userRole === 'DEALER_MANAGER') {
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
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        const quotes = await quotesAPI.getPendingEVMApproval();
        setPendingQuotes(Array.isArray(quotes) ? quotes : []);
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
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        const quotes = await quotesAPI.getPendingEVMApproval();
        setPendingQuotes(Array.isArray(quotes) ? quotes : []);
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
    if (!window.confirm('Submit this quote to EVM for approval?')) {
      return;
    }

    try {
      const quoteId = quote.quoteId || quote.id;
      await quotesAPI.submitForEVMApproval(quoteId);
      showSuccessToast('Quote submitted to EVM successfully');
      
      // Reload pending quotes
      if (userRole === 'DEALER_MANAGER' && userId) {
        const quotes = await quotesAPI.getPendingDealerManagerApproval(userId);
        setPendingQuotes(Array.isArray(quotes) ? quotes : []);
      }
    } catch (error) {
      console.error('Error submitting quote to EVM:', error);
      showErrorToast(handleAPIError(error));
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
      
      // Reload pending orders
      const orders = await ordersAPI.getPendingApproval();
      setPendingOrders(Array.isArray(orders) ? orders : []);
      
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
      
      // Reload pending orders
      const orders = await ordersAPI.getPendingApproval();
      setPendingOrders(Array.isArray(orders) ? orders : []);
      
      setShowRejectModal(false);
      setSelectedItem(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting order:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const canSubmitToEVM = (quote) => {
    return userRole === 'DEALER_MANAGER' &&
           quote.approvalStatus === 'APPROVED' &&
           quote.status === 'DRAFT';
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
            Quotes ({pendingQuotes.length})
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
            {pendingQuotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-file" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <div>No pending quotes</div>
              </div>
            ) : (
              pendingQuotes.map(quote => {
                const customerName = quote.customer?.fullName || quote.customerName || 'N/A';
                const vehicleName = quote.vehicle?.name || quote.vehicleName || 'N/A';
                const totalAmount = quote.finalTotal || quote.totalAmount || 0;
                const quoteId = quote.quoteId || quote.id;
                const approvalStatus = quote.approvalStatus || '';
                
                return (
                  <div key={quoteId} style={{ 
                    padding: '20px', 
                    background: 'var(--color-bg)', 
                    borderRadius: 'var(--radius)', 
                    border: '1px solid var(--color-border)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
                          QUOTE - #{quoteId}
                        </h3>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                          Customer: {customerName} | Vehicle: {vehicleName}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                          Created: {quote.createdDate ? new Date(quote.createdDate).toLocaleDateString() : 'N/A'}
                        </div>
                        {userRole === 'DEALER_MANAGER' && approvalStatus === 'APPROVED' && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--color-success)', 
                            marginTop: '8px',
                            padding: '4px 8px',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius)',
                            display: 'inline-block'
                          }}>
                            ✓ Approved by Manager - Ready for EVM
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>
                        ${totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      {canSubmitToEVM(quote) && (
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleSubmitQuoteToEVM(quote)}
                          style={{ color: 'var(--color-info)' }}
                        >
                          <i className="bx bx-send"></i>
                          Submit to EVM
                        </button>
                      )}
                      {approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL' || approvalStatus === 'PENDING_EVM_APPROVAL' ? (
                        <>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => handleRejectQuote(quote)}
                            style={{ color: 'var(--color-error)' }}
                          >
                            <i className="bx bx-x"></i>
                            Reject
                          </button>
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleApproveQuote(quote)}
                          >
                            <i className="bx bx-check"></i>
                            Approve
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })
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

            {activeTab === 'quotes' && (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') && inventoryCheck && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                background: inventoryCheck.hasSufficientInventory ? 'var(--color-success)' : 'var(--color-error)',
                borderRadius: 'var(--radius)',
                color: 'white',
                fontSize: '14px'
              }}>
                {inventoryCheck.hasSufficientInventory ? '✓ Sufficient inventory available' : '✗ Insufficient inventory'}
              </div>
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
    </div>
  );
};

export default ApprovalSystem;
