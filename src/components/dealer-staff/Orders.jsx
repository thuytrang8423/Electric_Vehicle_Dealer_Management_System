import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../../utils/api/ordersAPI';
import { quotesAPI } from '../../utils/api/quotesAPI';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const Orders = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateFromQuoteModal, setShowCreateFromQuoteModal] = useState(false);
  const [availableQuotes, setAvailableQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    quoteId: null,
    customerId: null,
    dealerId: null,
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    paymentMethod: 'VNPAY',
    paymentPercentage: 0,
    notes: ''
  });
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');

  const userRole = user?.role?.toUpperCase().replace(/-/g, '_');
  const userId = user?.id || user?.userId || user?.user?.id;

  // Load orders based on role
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        let data = [];
        
        if (userRole === 'DEALER_STAFF' && userId) {
          // DEALER_STAFF: Get their own orders
          data = await ordersAPI.getByUser(userId);
        } else if (userRole === 'DEALER_MANAGER' || userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
          // Manager/EVM/Admin: Get all orders or pending approval
          data = await ordersAPI.getAll();
        } else {
          data = await ordersAPI.getAll();
        }
        
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading orders:', error);
        showErrorToast(handleAPIError(error));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userRole, userId]);

  // Load approved quotes when opening create from quote modal
  useEffect(() => {
    const loadApprovedQuotes = async () => {
      if (showCreateFromQuoteModal && (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER')) {
        try {
          let quotes = [];
          if (userRole === 'DEALER_STAFF' && userId) {
            // Get approved quotes ready for order creation
            quotes = await quotesAPI.getApprovedReadyForOrder();
          } else if (userRole === 'DEALER_MANAGER') {
            // Manager can see all approved quotes
            quotes = await quotesAPI.getApprovedReady(userId);
          }
          setAvailableQuotes(Array.isArray(quotes) ? quotes : []);
        } catch (error) {
          console.error('Error loading approved quotes:', error);
          showErrorToast(handleAPIError(error));
          setAvailableQuotes([]);
        }
      }
    };

    loadApprovedQuotes();
  }, [showCreateFromQuoteModal, userRole, userId]);

  // Check for selected quote from Quotes component
  useEffect(() => {
    const handleNavigateToOrders = (event) => {
      const quoteId = event.detail?.quoteId;
      if (quoteId) {
        setShowCreateFromQuoteModal(true);
        // Load quote details
        quotesAPI.getById(quoteId).then(quote => {
          setSelectedQuote(quote);
          setOrderFormData(prev => ({
            ...prev,
            quoteId: quote.quoteId || quote.id,
            customerId: quote.customerId || quote.customer?.customerId || quote.customer?.id,
            dealerId: quote.dealerId || quote.customer?.dealerId || user?.dealerId || user?.user?.dealerId || null
          }));
        }).catch(err => {
          console.error('Error loading quote:', err);
        });
      }
    };

    window.addEventListener('navigateToOrders', handleNavigateToOrders);
    return () => window.removeEventListener('navigateToOrders', handleNavigateToOrders);
  }, []);

  const getStatusColor = (status, approvalStatus) => {
    if (approvalStatus === 'REJECTED') return 'var(--color-error)';
    if (approvalStatus === 'APPROVED' && status === 'APPROVED') return 'var(--color-success)';
    if (approvalStatus === 'PENDING_APPROVAL' || status === 'PENDING') return 'var(--color-warning)';
    if (status === 'DELIVERED') return 'var(--color-success)';
    if (status === 'CANCELLED') return 'var(--color-error)';
    return 'var(--color-text-muted)';
  };

  const getStatusLabel = (status, approvalStatus) => {
    if (approvalStatus === 'REJECTED') return 'Rejected';
    if (approvalStatus === 'APPROVED' && status === 'APPROVED') return 'Approved';
    if (approvalStatus === 'PENDING_APPROVAL' || status === 'PENDING') return 'Pending Approval';
    if (status === 'DELIVERED') return 'Delivered';
    if (status === 'CANCELLED') return 'Cancelled';
    return status || 'Unknown';
  };

  const handleCreateFromQuote = () => {
    setShowCreateFromQuoteModal(true);
  };

  const handleSelectQuote = (quote) => {
    setSelectedQuote(quote);
    setOrderFormData(prev => ({
      ...prev,
      quoteId: quote.quoteId || quote.id,
      customerId: quote.customerId || quote.customer?.customerId || quote.customer?.id,
      dealerId: quote.dealerId || quote.customer?.dealerId || user?.dealerId || user?.user?.dealerId || null
    }));
    setShowCreateFromQuoteModal(false);
    setShowOrderForm(true);
  };

  const handleCreateOrderFromQuote = async (e) => {
    e.preventDefault();
    
    if (!orderFormData.quoteId || !orderFormData.customerId) {
      showErrorToast('Please select a quote');
      return;
    }

    if (!userId) {
      showErrorToast('User ID not found');
      return;
    }

    try {
      const derivedDealerId =
        orderFormData.dealerId ||
        selectedQuote?.dealerId ||
        selectedQuote?.customer?.dealerId ||
        user?.dealerId ||
        user?.user?.dealerId ||
        null;

      if (!derivedDealerId) {
        showErrorToast('Dealer information is missing for this quote. Please ensure the quote has a dealer assigned.');
        return;
      }

      const orderData = {
        quoteId: orderFormData.quoteId,
        customerId: orderFormData.customerId,
        dealerId: Number(derivedDealerId),
        orderDate: orderFormData.orderDate ? new Date(orderFormData.orderDate).toISOString() : new Date().toISOString(),
        deliveryDate: orderFormData.deliveryDate ? new Date(orderFormData.deliveryDate).toISOString() : null,
        paymentMethod: orderFormData.paymentMethod || 'VNPAY',
        paymentPercentage: typeof orderFormData.paymentPercentage === 'number'
          ? orderFormData.paymentPercentage
          : 0,
        notes: orderFormData.notes || ''
      };

      await ordersAPI.createFromApprovedQuote(orderData, userId);
      showSuccessToast('Order created from quote successfully');
      
      // Reload orders
      const data = await ordersAPI.getByUser(userId);
      setOrders(Array.isArray(data) ? data : []);
      
      // Reset form
      setShowOrderForm(false);
      setSelectedQuote(null);
      setOrderFormData({
        quoteId: null,
        customerId: null,
        dealerId: null,
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        paymentMethod: 'VNPAY',
        paymentPercentage: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Error creating order:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const handleApproveOrder = async (order) => {
    setSelectedOrder(order);
    setApproveNotes('');
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedOrder || !userId) {
      showErrorToast('Missing required information');
      return;
    }

    try {
      const orderId = selectedOrder.orderId || selectedOrder.id;
      
      if (userRole === 'DEALER_MANAGER') {
        await ordersAPI.approveByDealerManager(orderId, userId, approveNotes);
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        await ordersAPI.approveByEVM(orderId, userId, approveNotes);
      }
      
      showSuccessToast('Order approved successfully');
      
      // Reload orders
      const data = await ordersAPI.getAll();
      setOrders(Array.isArray(data) ? data : []);
      
      setShowApproveModal(false);
      setSelectedOrder(null);
      setApproveNotes('');
    } catch (error) {
      console.error('Error approving order:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const handleRejectOrder = async (order) => {
    const reason = window.prompt('Please enter rejection reason:');
    if (!reason) return;

    if (!userId) {
      showErrorToast('User ID not found');
      return;
    }

    try {
      const orderId = order.orderId || order.id;
      
      if (userRole === 'DEALER_MANAGER') {
        await ordersAPI.rejectByDealerManager(orderId, userId, reason);
      } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        await ordersAPI.rejectByEVM(orderId, userId, reason);
      }
      
      showSuccessToast('Order rejected');
      
      // Reload orders
      const data = await ordersAPI.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error rejecting order:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const filteredOrders = orders.filter(order => {
    const customerName = order.customer?.fullName || order.customerName || '';
    const vehicleName = order.vehicle?.name || order.vehicleName || '';
    const orderNumber = order.orderNumber || order.orderId?.toString() || '';
    
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = order.status || order.orderStatus || '';
    const approvalStatus = order.approvalStatus || order.orderApprovalStatus || '';
    
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'pending' && (approvalStatus === 'PENDING_APPROVAL' || status === 'PENDING')) ||
      (filterStatus === 'approved' && approvalStatus === 'APPROVED' && status === 'APPROVED') ||
      (filterStatus === 'rejected' && approvalStatus === 'REJECTED') ||
      (filterStatus === 'delivered' && status === 'DELIVERED');
    
    return matchesSearch && matchesFilter;
  });

  const canApproveOrder = (order) => {
    const approvalStatus = order.approvalStatus || order.orderApprovalStatus || '';
    const status = order.status || order.orderStatus || '';
    return (userRole === 'DEALER_MANAGER' || userRole === 'EVM_MANAGER' || userRole === 'ADMIN') &&
           approvalStatus === 'PENDING_APPROVAL' && status === 'PENDING';
  };

  const canCreateFromQuote = () => {
    return (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER');
  };

  if (loading) {
    return (
      <div className="main">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}></i>
          <div style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>Loading orders...</div>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || o.amount || 0), 0);
  const pendingOrders = orders.filter(o => (o.approvalStatus || o.orderApprovalStatus) === 'PENDING_APPROVAL').length;
  const approvedOrders = orders.filter(o => (o.approvalStatus || o.orderApprovalStatus) === 'APPROVED').length;

  return (
    <div className="main">
      {/* Order Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Orders', value: orders.length, icon: 'bx-shopping-bag', color: 'var(--color-primary)' },
          { label: 'Pending Approval', value: pendingOrders, icon: 'bx-time', color: 'var(--color-warning)' },
          { label: 'Approved', value: approvedOrders, icon: 'bx-check-circle', color: 'var(--color-success)' },
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: 'bx-dollar-circle', color: 'var(--color-info)' }
        ].map((stat, index) => (
          <div key={index} style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px'
              }}>
                <i className={`bx ${stat.icon}`}></i>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{stat.label}</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Orders Management</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {canCreateFromQuote() && (
              <button className="btn btn-primary" onClick={handleCreateFromQuote}>
                <i className="bx bx-cart"></i>
                Create from Quote
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'approved', 'rejected', 'delivered'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredOrders.map(order => {
            const customerName = order.customer?.fullName || order.customerName || 'N/A';
            const vehicleName = order.vehicle?.name || order.vehicleName || 'N/A';
            const totalAmount = order.totalAmount || order.amount || 0;
            const orderNumber = order.orderNumber || order.orderId?.toString() || 'N/A';
            const status = order.status || order.orderStatus || '';
            const approvalStatus = order.approvalStatus || order.orderApprovalStatus || '';
            const statusColor = getStatusColor(status, approvalStatus);
            const statusLabel = getStatusLabel(status, approvalStatus);
            
            return (
              <div key={order.orderId || order.id} style={{ 
                padding: '20px', 
                background: 'var(--color-bg)', 
                borderRadius: 'var(--radius)',
                border: `1px solid var(--color-border)`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>{orderNumber}</h3>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-surface)',
                        color: statusColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
                      {customerName} - {vehicleName}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      Order Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'} | 
                      Delivery: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}
                    </div>
                    {order.quoteId && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        From Quote: #{order.quoteId}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '4px' }}>
                      ${totalAmount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {order.paymentMethod || 'N/A'}
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div style={{ 
                    fontSize: '13px', 
                    color: 'var(--color-text-muted)', 
                    fontStyle: 'italic', 
                    marginBottom: '12px', 
                    padding: '8px',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius)',
                    borderLeft: '3px solid var(--color-primary)'
                  }}>
                    <i className="bx bx-note" style={{ marginRight: '4px' }}></i>
                    {order.notes}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {canApproveOrder(order) && (
                      <>
                        <button 
                          className="btn btn-primary" 
                          style={{ fontSize: '12px' }}
                          onClick={() => handleApproveOrder(order)}
                        >
                          <i className="bx bx-check"></i>
                          Approve
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ fontSize: '12px', color: 'var(--color-error)' }}
                          onClick={() => handleRejectOrder(order)}
                        >
                          <i className="bx bx-x"></i>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '6px', fontSize: '14px' }}
                      title="View Details"
                    >
                      <i className="bx bx-show"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-shopping-bag" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No orders found</div>
            {canCreateFromQuote() && (
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleCreateFromQuote}>
                <i className="bx bx-cart"></i>
                Create Order from Quote
              </button>
            )}
          </div>
        )}
      </div>

      {/* Select Quote Modal */}
      {showCreateFromQuoteModal && (
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
              <h3>Select Approved Quote</h3>
              <button 
                onClick={() => setShowCreateFromQuoteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            {availableQuotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-file" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <div>No approved quotes available</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {availableQuotes.map(quote => {
                  const customerName = quote.customer?.fullName || quote.customerName || 'N/A';
                  const vehicleName = quote.vehicle?.name || quote.vehicleName || 'N/A';
                  const totalAmount = quote.finalTotal || quote.totalAmount || 0;
                  
                  return (
                    <div
                      key={quote.quoteId || quote.id}
                      onClick={() => handleSelectQuote(quote)}
                      style={{
                        padding: '16px',
                        background: 'var(--color-bg)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.background = 'var(--color-surface)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.background = 'var(--color-bg)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
                            Quote #{quote.quoteId || quote.id}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                            {customerName} - {vehicleName}
                          </div>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary)' }}>
                          ${totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowCreateFromQuoteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Form Modal */}
      {showOrderForm && selectedQuote && (
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
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Create Order from Quote</h3>
              <button 
                onClick={() => {
                  setShowOrderForm(false);
                  setSelectedQuote(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleCreateOrderFromQuote}>
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Quote</div>
                <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                  #{selectedQuote.quoteId || selectedQuote.id} - ${(selectedQuote.finalTotal || selectedQuote.totalAmount || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Order Date *
                  </label>
                  <input
                    type="date"
                    value={orderFormData.orderDate}
                    onChange={(e) => setOrderFormData({...orderFormData, orderDate: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={orderFormData.deliveryDate}
                    onChange={(e) => setOrderFormData({...orderFormData, deliveryDate: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Payment Method
                  </label>
                  <select
                    value={orderFormData.paymentMethod}
                    onChange={(e) => setOrderFormData({...orderFormData, paymentMethod: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  >
                    <option value="CASH">Cash (Tiền mặt) - Thanh toán ngay</option>
                    <option value="TRANSFER">Bank Transfer (Chuyển khoản)</option>
                    <option value="VNPAY">VNPay - Thanh toán online</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Payment Percentage (%)
                  </label>
                  <select
                    value={orderFormData.paymentPercentage}
                    onChange={(e) =>
                      setOrderFormData({
                        ...orderFormData,
                        paymentPercentage: Number.isNaN(parseInt(e.target.value, 10))
                          ? 0
                          : parseInt(e.target.value, 10),
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  >
                    {[0, 30, 50, 70, 100].map((percent) => (
                      <option key={percent} value={percent}>
                        {percent === 0 ? '0 (Thanh toán sau qua VNPay)' : `${percent}%`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Notes
                  </label>
                  <textarea
                    value={orderFormData.notes}
                    onChange={(e) => setOrderFormData({...orderFormData, notes: e.target.value})}
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
                    placeholder="Additional notes about the order..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => {
                    setShowOrderForm(false);
                    setSelectedQuote(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Order Modal */}
      {showApproveModal && selectedOrder && (
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
              <h3>Approve Order</h3>
              <button 
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedOrder(null);
                  setApproveNotes('');
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Order</div>
              <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                {selectedOrder.orderNumber || selectedOrder.orderId}
              </div>
            </div>

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
                  setSelectedOrder(null);
                  setApproveNotes('');
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleConfirmApprove}>
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
