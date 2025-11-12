import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { paymentsAPI } from '../../utils/api/paymentsAPI';
import { ordersAPI } from '../../utils/api/ordersAPI';
import { customersAPI } from '../../utils/api/customersAPI';
import { vehiclesAPI } from '../../utils/api/vehiclesAPI';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const PaymentManagement = ({ user }) => {
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [manualPaymentForm, setManualPaymentForm] = useState({
    paymentMethod: 'CASH',
    paymentPercentage: 30,
    paymentNotes: ''
  });
  const [manualPaymentLoading, setManualPaymentLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [customerLookup, setCustomerLookup] = useState({});
  const [vehicleLookup, setVehicleLookup] = useState({});

  const userRole = user?.role?.toUpperCase().replace(/-/g, '_');
  const userId = user?.id || user?.userId || user?.user?.id;

  // Load customers and vehicles for lookup
  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const [customers, vehicles] = await Promise.all([
          customersAPI.getAll(),
          vehiclesAPI.getAll()
        ]);
        
        // Build customer lookup map
        const customerMap = {};
        if (Array.isArray(customers)) {
          customers.forEach(customer => {
            customerMap[String(customer.id || customer.customerId)] = customer;
          });
        }
        setCustomerLookup(customerMap);
        
        // Build vehicle lookup map
        const vehicleMap = {};
        if (Array.isArray(vehicles)) {
          vehicles.forEach(vehicle => {
            vehicleMap[String(vehicle.id || vehicle.vehicleId)] = vehicle;
          });
        }
        setVehicleLookup(vehicleMap);
      } catch (error) {
        console.error('Error loading lookup data:', error);
        // Don't show error toast for lookup data - just log it
      }
    };
    
    loadLookupData();
  }, []);

  // Load payments and approved orders
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load approved orders for payment
        const orders = await ordersAPI.getAll();
        const approved = Array.isArray(orders) ? orders.filter(order => {
          const approvalStatus = order.approvalStatus || order.orderApprovalStatus || '';
          const status = order.status || order.orderStatus || '';
          return approvalStatus === 'APPROVED' && status === 'APPROVED';
        }) : [];
        
        const enrichedOrdersWithPayments = await Promise.all(
          approved.map(async (order) => {
            const orderId = order.orderId || order.id;
            const orderNumber = `ORD-${order.id}`;

            const customer = customerLookup[String(order.customerId)];
            const customerName =
              customer?.fullName || customer?.name || `Customer #${order.customerId}`;

            let vehicleName = 'N/A';
            if (order.orderDetails && order.orderDetails.length > 0) {
              const firstDetail = order.orderDetails[0];
              const vehicle = vehicleLookup[String(firstDetail.vehicleId)];
              vehicleName =
                vehicle?.name || vehicle?.model || `Vehicle #${firstDetail.vehicleId}`;
            }

            let paymentOverview = null;
            try {
              paymentOverview = await paymentsAPI.getDealerWorkflowPaymentStatus(orderId);
            } catch (error) {
              // optional endpoint - ignore failures
            }

            let orderPayments = [];
            try {
              const workflowPayments = await paymentsAPI.getDealerWorkflowPayments(orderId);
              if (Array.isArray(workflowPayments)) {
                orderPayments = workflowPayments;
              } else if (Array.isArray(workflowPayments?.payments)) {
                orderPayments = workflowPayments.payments;
              }
            } catch (error) {
              try {
                const fallbackPayments = await paymentsAPI.getByOrder(orderId);
                orderPayments = Array.isArray(fallbackPayments) ? fallbackPayments : [];
              } catch (innerError) {
                console.log('No payments for order:', orderId);
              }
            }

            const normalizedPayments = orderPayments.map((payment) => ({
              ...payment,
              orderId,
              orderNumber,
              customerName,
            }));

            const hasCashPaymentCompleted = normalizedPayments.some(
              (p) =>
                (p.paymentMethod === 'CASH' || p.paymentMethod === 'cash') &&
                (p.status === 'COMPLETED' || p.status === 'completed')
            );

            const totalAmount =
              paymentOverview?.totalAmount ??
              order.totalAmount ??
              order.amount ??
              0;
            const paidAmount =
              paymentOverview?.totalPaid ??
              paymentOverview?.totalAmountPaid ??
              order.paidAmount ??
              normalizedPayments
                .filter((p) => p.status === 'COMPLETED' || p.status === 'completed')
                .reduce((sum, payment) => sum + (payment.amount || 0), 0);
            const remainingAmount =
              paymentOverview?.remainingAmount ??
              Math.max(totalAmount - paidAmount, 0);

            const paymentMethod =
              (paymentOverview?.lastPaymentMethod ||
                order.paymentMethod ||
                order.payment_method ||
                normalizedPayments?.[0]?.paymentMethod ||
                'VNPAY')?.toUpperCase();

            return {
              ...order,
              orderNumber,
              vehicleName,
              customerName,
              orderPayments: normalizedPayments,
              hasCashPaymentCompleted,
              paymentMethod,
              paidAmount,
              remainingAmount,
              paymentOverview,
            };
          })
        );

        const allPayments = enrichedOrdersWithPayments.flatMap(
          (order) => order.orderPayments || []
        );
        setPayments(allPayments);
        setApprovedOrders(enrichedOrdersWithPayments);
      } catch (error) {
        console.error('Error loading payments:', error);
        showErrorToast(handleAPIError(error));
        setPayments([]);
        setApprovedOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userRole, userId, refreshTrigger, customerLookup, vehicleLookup]);

  // Reload data when returning from payment result page
  useEffect(() => {
    if (location.state?.fromPaymentResult) {
      console.log('Returning from payment result - reloading data...');
      setRefreshTrigger(prev => prev + 1);
      // Clear the state to avoid re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // VNPay callback is now handled by backend redirect to PaymentResult page
  // No need to handle VNPay callback here anymore

  const handleCreateVNPayPayment = async (order) => {
    if (!order) {
      showErrorToast('Please select an order');
      return;
    }

    const orderId = order.orderId || order.id;
    
    // Backend chỉ nhận orderId, sẽ tự động dùng order.getTotalAmount()
    // VNPay không hỗ trợ partial payment - phải thanh toán toàn bộ số tiền còn lại
    const remainingAmount =
      order.remainingAmount ??
      (order.totalAmount || order.amount || 0) - (order.paidAmount || 0);
    
    if (remainingAmount <= 0) {
      showErrorToast('Order has been fully paid');
      return;
    }

    try {
      // Backend chỉ cần orderId, sẽ tự động tạo payment với order.getTotalAmount()
      const paymentData = {
        orderId: orderId
      };

      const response = await paymentsAPI.createVNPayPayment(paymentData);
      
      if (response.paymentUrl) {
        // Redirect to VNPay payment page
        window.location.href = response.paymentUrl;
      } else if (response.error) {
        showErrorToast(response.error);
      } else {
        showErrorToast('Failed to create payment URL');
      }
    } catch (error) {
      console.error('Error creating VNPay payment:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const handleSelectOrderForPayment = (order) => {
    setSelectedOrder(order);
    // VNPay sẽ thanh toán toàn bộ số tiền còn lại, không cần nhập amount
    setShowCreatePaymentModal(true);
  };

  const handleOpenManualPayment = (order) => {
    setSelectedOrder(order);
    const totalAmount = order.totalAmount || order.amount || 0;
    const paidAmount = order.paidAmount || 0;
    const paidPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
    const allowed = [30, 50, 70, 100].filter((percent) => percent > paidPercent);
    const defaultPercentage = allowed.length ? allowed[0] : 100;

    setManualPaymentForm({
      paymentMethod: 'CASH',
      paymentPercentage: defaultPercentage,
      paymentNotes: ''
    });
    setShowManualPaymentModal(true);
  };

  const handleSubmitManualPayment = async (event) => {
    event?.preventDefault();
    if (!selectedOrder) {
      showErrorToast('Order information is missing');
      return;
    }

    const { paymentMethod, paymentPercentage, paymentNotes } = manualPaymentForm;
    if (!paymentMethod) {
      showErrorToast('Please select a payment method');
      return;
    }

    try {
      setManualPaymentLoading(true);
      const orderId = selectedOrder.orderId || selectedOrder.id;
      await paymentsAPI.createDealerWorkflowPayment(orderId, {
        paymentMethod,
        paymentPercentage,
        paymentNotes: paymentNotes || undefined,
      });

      showSuccessToast(`Payment recorded via ${paymentMethod}`);
      setShowManualPaymentModal(false);
      setSelectedOrder(null);
      setManualPaymentForm({
        paymentMethod: 'CASH',
        paymentPercentage: 30,
        paymentNotes: ''
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error recording manual payment:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setManualPaymentLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'completed': return 'var(--color-success)';
      case 'PENDING':
      case 'pending': return 'var(--color-warning)';
      case 'FAILED':
      case 'failed': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const findOrderForPayment = (payment) => {
    const orderId = payment.orderId || payment.order?.orderId || payment.order?.id;
    if (!orderId) return null;
    return approvedOrders.find(
      (order) => String(order.orderId || order.id) === String(orderId)
    ) || null;
  };

  const filteredPayments = payments.filter(p => {
    const status = p.status || p.paymentStatus || '';
    return selectedType === 'all' || 
           (selectedType === 'completed' && (status === 'COMPLETED' || status === 'completed')) ||
           (selectedType === 'pending' && (status === 'PENDING' || status === 'pending')) ||
           (selectedType === 'failed' && (status === 'FAILED' || status === 'failed'));
  });

  const totalRevenue = payments
    .filter(p => (p.status === 'COMPLETED' || p.status === 'completed'))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = payments
    .filter(p => (p.status === 'PENDING' || p.status === 'pending'))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Calculate chart data from actual payments
  const calculateChartData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        month: monthNames[date.getMonth()],
        monthIndex: date.getMonth(),
        year: date.getFullYear(),
        revenue: 0,
        pending: 0
      });
    }

    // Group payments by month
    payments.forEach(payment => {
      const paymentDate = payment.paidDate || payment.createdDate || payment.paymentDate;
      if (!paymentDate) return;

      const date = new Date(paymentDate);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const amount = payment.amount || 0;
      const status = payment.status || payment.paymentStatus || '';

      const monthData = last6Months.find(m => 
        m.monthIndex === monthIndex && m.year === year
      );

      if (monthData) {
        if (status === 'COMPLETED' || status === 'completed') {
          monthData.revenue += amount / 1000; // Convert to K
        } else if (status === 'PENDING' || status === 'pending') {
          monthData.pending += amount / 1000; // Convert to K
        }
      }
    });

    return last6Months.map(m => ({
      month: m.month,
      revenue: Math.round(m.revenue),
      pending: Math.round(m.pending)
    }));
  };

  const chartData = calculateChartData();

  const selectedOrderTotalAmount = selectedOrder
    ? selectedOrder.totalAmount || selectedOrder.amount || 0
    : 0;
  const selectedOrderPaidAmount = selectedOrder ? selectedOrder.paidAmount || 0 : 0;
  const selectedOrderRemainingAmount = selectedOrder
    ? selectedOrder.remainingAmount ??
      Math.max(selectedOrderTotalAmount - selectedOrderPaidAmount, 0)
    : 0;

  if (loading) {
    return (
      <div className="main">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}></i>
          <div style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>Loading payments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      {/* Summary Cards */}
      <div className="cards-grid">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Total Revenue</h3>
            <div className="card__icon card__icon--primary">
              <i className="bx bx-dollar-circle"></i>
            </div>
          </div>
          <div className="card__value">${totalRevenue.toLocaleString()}</div>
          <div className="card__change card__change--positive">
            <i className="bx bx-trending-up"></i>
            {payments.filter(p => p.status === 'COMPLETED' || p.status === 'completed').length} completed
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Pending Payments</h3>
            <div className="card__icon card__icon--warning">
              <i className="bx bx-time"></i>
            </div>
          </div>
          <div className="card__value">${pendingAmount.toLocaleString()}</div>
          <div className="card__change card__change--negative">
            <i className="bx bx-info-circle"></i>
            {payments.filter(p => p.status === 'PENDING' || p.status === 'pending').length} pending
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Approved Orders</h3>
            <div className="card__icon card__icon--success">
              <i className="bx bx-check-circle"></i>
            </div>
          </div>
          <div className="card__value">{approvedOrders.length}</div>
          <div className="card__change card__change--positive">
            <i className="bx bx-shopping-bag"></i>
            Ready for Payment
          </div>
        </div>
      </div>

      {/* Approved Orders for Payment */}
      {approvedOrders.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '24px' }}>Approved Orders - Ready for Payment</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {approvedOrders.map(order => {
              const customerName = order.customerName || order.customer?.fullName || 'N/A';
              const vehicleName = order.vehicleName || order.vehicle?.name || 'N/A';
              const totalAmount = order.totalAmount || order.amount || 0;
              const paidAmount = order.paidAmount || 0;
              const remainingAmount =
                order.remainingAmount ?? Math.max(totalAmount - paidAmount, 0);
              const orderNumber = order.orderNumber || `ORD-${order.id || order.orderId}`;
              const paymentMethod = (order.paymentMethod || 'VNPAY').toUpperCase();
              const hasCashPaymentCompleted = order.hasCashPaymentCompleted || false;
              
              // Chỉ hiển thị nút VNPay nếu:
              // 1. Còn tiền chưa thanh toán (remainingAmount > 0)
              // 2. Payment method là VNPAY (hoặc không có payment method - mặc định VNPAY)
              // 3. Không có payment CASH đã completed
              const shouldShowVNPayButton = remainingAmount > 0 && 
                                           paymentMethod === 'VNPAY' && 
                                           !hasCashPaymentCompleted;
              const shouldShowManualPaymentButton = remainingAmount > 0;
              
              return (
                <div key={order.orderId || order.id} style={{ 
                  padding: '20px', 
                  background: 'var(--color-bg)', 
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h4 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>{orderNumber}</h4>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          background: paymentMethod === 'CASH'
                            ? 'var(--color-success)'
                            : paymentMethod === 'TRANSFER'
                            ? 'var(--color-warning)'
                            : 'var(--color-info)',
                          color: 'white',
                          fontWeight: '600'
                        }}>
                          {paymentMethod}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text)', marginBottom: '4px' }}>
                        {customerName} - {vehicleName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Total: ${totalAmount.toLocaleString()} | 
                        Paid: ${paidAmount.toLocaleString()} | 
                        Remaining: ${remainingAmount.toLocaleString()}
                      </div>
                      {hasCashPaymentCompleted && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--color-success)', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <i className="bx bx-check-circle"></i>
                          Cash payment completed
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '4px' }}>
                        ${remainingAmount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Remaining
                      </div>
                    </div>
                  </div>
                  {(shouldShowManualPaymentButton || shouldShowVNPayButton) && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {shouldShowManualPaymentButton && (
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '12px' }}
                          onClick={() => handleOpenManualPayment(order)}
                        >
                          <i className="bx bx-money"></i>
                          Record Cash/Transfer
                        </button>
                      )}
                      {shouldShowVNPayButton && (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleSelectOrderForPayment(order)}
                          style={{ fontSize: '12px' }}
                        >
                          <i className="bx bx-credit-card"></i>
                          Pay with VNPay
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Payment History</h2>
        </div>

        {/* Revenue Chart */}
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Revenue Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--color-surface)', 
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#6C63FF" name="Completed (K)" />
              <Bar dataKey="pending" fill="#F59E0B" name="Pending (K)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['all', 'completed', 'pending', 'failed'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`btn ${selectedType === type ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Payments Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Order ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Method</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Transaction ID</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const status = payment.status || payment.paymentStatus || '';
                const statusColor = getStatusColor(status);
                const statusLabel = status === 'COMPLETED' || status === 'completed' ? 'Completed' :
                                  status === 'PENDING' || status === 'pending' ? 'Pending' :
                                  status === 'FAILED' || status === 'failed' ? 'Failed' : status;
                
                return (
                  <tr key={payment.paymentId || payment.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      {payment.orderNumber || payment.orderId || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>
                      {payment.customer?.fullName || payment.customerName || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>
                      ${(payment.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {payment.paymentMethod || 'VNPay'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : 
                       payment.createdDate ? new Date(payment.createdDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: statusColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        display: 'inline-block'
                      }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {payment.vnpayTransactionNo || payment.transactionId || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {(status === 'PENDING' || status === 'pending') && (
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '12px' }}
                          onClick={() => {
                            const order = findOrderForPayment(payment);
                            if (order) {
                              handleSelectOrderForPayment(order);
                            } else {
                              showErrorToast('Order information not available. Please refresh.');
                            }
                          }}
                        >
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-credit-card" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No payments found</div>
          </div>
        )}
      </div>

      {/* Create Payment Modal */}
      {showCreatePaymentModal && selectedOrder && (
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
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Create VNPay Payment</h3>
              <button 
                onClick={() => {
                  setShowCreatePaymentModal(false);
                  setSelectedOrder(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Order</div>
              <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                {selectedOrder.orderNumber || selectedOrder.orderId}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Total: ${selectedOrderTotalAmount.toLocaleString()} | 
                Paid: ${selectedOrderPaidAmount.toLocaleString()} | 
                Remaining: ${selectedOrderRemainingAmount.toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-info)', borderRadius: 'var(--radius)', color: 'white', fontSize: '14px' }}>
              <i className="bx bx-info-circle" style={{ marginRight: '8px' }}></i>
              <strong>Payment Amount:</strong> ${selectedOrderRemainingAmount.toLocaleString()}
              <div style={{ marginTop: '8px', fontSize: '12px', opacity: '0.9' }}>
                VNPay will process payment for the full remaining amount.
              </div>
            </div>

            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: 'var(--color-info)', 
              borderRadius: 'var(--radius)',
              color: 'white',
              fontSize: '14px'
            }}>
              <i className="bx bx-info-circle" style={{ marginRight: '8px' }}></i>
              You will be redirected to VNPay payment gateway
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setShowCreatePaymentModal(false);
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleCreateVNPayPayment(selectedOrder)}
              >
                <i className="bx bx-credit-card"></i>
                Proceed to VNPay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Modal */}
      {showManualPaymentModal && selectedOrder && (
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
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Record Cash / Transfer Payment</h3>
              <button 
                onClick={() => {
                  setShowManualPaymentModal(false);
                  setSelectedOrder(null);
                  setManualPaymentForm({
                    paymentMethod: 'CASH',
                    paymentPercentage: 30,
                    paymentNotes: ''
                  });
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitManualPayment}>
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Order</div>
                <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                  {selectedOrder.orderNumber || selectedOrder.orderId}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Total: ${selectedOrderTotalAmount.toLocaleString()} | 
                  Paid: ${selectedOrderPaidAmount.toLocaleString()} | 
                  Remaining: ${selectedOrderRemainingAmount.toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Payment Method *
                  </label>
                  <select
                    value={manualPaymentForm.paymentMethod}
                    onChange={(e) =>
                      setManualPaymentForm((prev) => ({
                        ...prev,
                        paymentMethod: e.target.value
                      }))
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
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Payment Percentage (%)
                  </label>
                  <select
                    value={manualPaymentForm.paymentPercentage}
                    onChange={(e) =>
                      setManualPaymentForm((prev) => ({
                        ...prev,
                        paymentPercentage: Number(e.target.value)
                      }))
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
                    required
                  >
                    {(() => {
                      const paidPercent =
                        selectedOrderTotalAmount > 0
                          ? Math.round((selectedOrderPaidAmount / selectedOrderTotalAmount) * 100)
                          : 0;
                      const options = [30, 50, 70, 100].filter((percent) => percent > paidPercent);
                      const optionList = options.length ? options : [100];
                      return optionList.map((percent) => (
                        <option key={percent} value={percent}>
                          {percent}%
                        </option>
                      ));
                    })()}
                  </select>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Allowed values: 30%, 50%, 70%, 100%. Amount is calculated from the order total.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Notes
                  </label>
                  <textarea
                    value={manualPaymentForm.paymentNotes}
                    onChange={(e) =>
                      setManualPaymentForm((prev) => ({
                        ...prev,
                        paymentNotes: e.target.value
                      }))
                    }
                    placeholder="Add payment notes (optional)"
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
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowManualPaymentModal(false);
                    setSelectedOrder(null);
                    setManualPaymentForm({
                      paymentMethod: 'CASH',
                      paymentPercentage: 30,
                      paymentNotes: ''
                    });
                  }}
                  disabled={manualPaymentLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={manualPaymentLoading}>
                  {manualPaymentLoading ? (
                    <>
                      <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                      Recording...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-check" style={{ marginRight: '6px' }}></i>
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
