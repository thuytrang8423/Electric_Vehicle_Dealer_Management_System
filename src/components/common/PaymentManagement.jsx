import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { paymentsAPI } from '../../utils/api/paymentsAPI';
import { ordersAPI } from '../../utils/api/ordersAPI';
import { customersAPI } from '../../utils/api/customersAPI';
import { vehiclesAPI } from '../../utils/api/vehiclesAPI';
import { installmentsAPI } from '../../utils/api/installmentsAPI';
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
  
  // Installment states
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [selectedPaymentForInstallment, setSelectedPaymentForInstallment] = useState(null);
  const [installmentForm, setInstallmentForm] = useState({
    months: 12,
    annualInterestRate: 0,
    firstDueDate: ''
  });
  const [installmentSchedule, setInstallmentSchedule] = useState([]);
  const [installmentLoading, setInstallmentLoading] = useState(false);
  const [installmentCreating, setInstallmentCreating] = useState(false);
  const [installmentPreview, setInstallmentPreview] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        
        const customerMap = {};
        if (Array.isArray(customers)) {
          customers.forEach(customer => {
            customerMap[String(customer.id || customer.customerId)] = customer;
          });
        }
        setCustomerLookup(customerMap);
        
        const vehicleMap = {};
        if (Array.isArray(vehicles)) {
          vehicles.forEach(vehicle => {
            vehicleMap[String(vehicle.id || vehicle.vehicleId)] = vehicle;
          });
        }
        setVehicleLookup(vehicleMap);
      } catch (error) {
        console.error('Error loading lookup data:', error);
      }
    };
    
    loadLookupData();
  }, []);

  // Load payments and approved orders
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
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

  useEffect(() => {
    if (location.state?.fromPaymentResult) {
      console.log('Returning from payment result - reloading data...');
      setRefreshTrigger(prev => prev + 1);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleCreateVNPayPayment = async (order) => {
    if (!order) {
      showErrorToast('Please select an order');
      return;
    }

    const orderId = order.orderId || order.id;
    const remainingAmount =
      order.remainingAmount ??
      (order.totalAmount || order.amount || 0) - (order.paidAmount || 0);
    
    if (remainingAmount <= 0) {
      showErrorToast('Order has been fully paid');
      return;
    }

    try {
      const paymentData = {
        orderId: orderId
      };

      const response = await paymentsAPI.createVNPayPayment(paymentData);
      
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else if (response.error) {
        showErrorToast(`VNPay error: ${response.error}. Please use Cash/Transfer payment instead.`);
        setShowCreatePaymentModal(false);
        handleOpenManualPayment(order);
      } else {
        showErrorToast('VNPay service is currently unavailable. Please use Cash/Transfer payment instead.');
        setShowCreatePaymentModal(false);
        handleOpenManualPayment(order);
      }
    } catch (error) {
      console.error('Error creating VNPay payment:', error);
      const errorMessage = handleAPIError(error);
      showErrorToast(`VNPay error: ${errorMessage}. Please use Cash/Transfer payment instead.`);
      setShowCreatePaymentModal(false);
      handleOpenManualPayment(order);
    }
  };

  const handleSelectOrderForPayment = (order) => {
    setSelectedOrder(order);
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
      showErrorToast('Vui lòng chọn phương thức thanh toán');
      return;
    }

    const validPercentages = [30, 50, 70, 100];
    const percentageNum = Number(paymentPercentage);
    if (!validPercentages.includes(percentageNum)) {
      showErrorToast('Payment percentage phải là 30, 50, 70 hoặc 100');
      return;
    }

    try {
      setManualPaymentLoading(true);
      const orderId = selectedOrder.orderId || selectedOrder.id;
      
      const paymentData = {
        paymentMethod: String(paymentMethod).toUpperCase(),
        paymentPercentage: percentageNum,
        paymentNotes: paymentNotes?.trim() || undefined
      };

      console.log('Creating payment with data:', paymentData);

      await paymentsAPI.createDealerWorkflowPayment(orderId, paymentData);

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

  // ========== INSTALLMENT FUNCTIONS - IMPROVED ==========
  
  const calculateInstallmentPreview = (totalAmount, months, annualInterestRate) => {
    if (!totalAmount || !months || months <= 0) return null;
    
    const monthlyRate = annualInterestRate / 100 / 12;
    let monthlyPayment;
    
    if (monthlyRate === 0) {
      monthlyPayment = totalAmount / months;
    } else {
      monthlyPayment = totalAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                       (Math.pow(1 + monthlyRate, months) - 1);
    }
    
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - totalAmount;
    
    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      months
    };
  };

  const handleOpenInstallmentModal = async (payment) => {
    const paymentId = payment.paymentId || payment.id;
    if (!paymentId) {
      showErrorToast('Payment ID không hợp lệ');
      return;
    }

    setSelectedPaymentForInstallment(payment);
    
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const formData = {
      months: 12,
      annualInterestRate: 0,
      firstDueDate: defaultDate.toISOString().split('T')[0]
    };
    setInstallmentForm(formData);
    
    // Calculate initial preview
    const preview = calculateInstallmentPreview(
      payment.amount || 0,
      formData.months,
      formData.annualInterestRate
    );
    setInstallmentPreview(preview);

    try {
      setInstallmentLoading(true);
      const schedule = await installmentsAPI.getByPayment(paymentId);
      setInstallmentSchedule(Array.isArray(schedule) ? schedule : []);
    } catch (error) {
      console.error('Error loading installment schedule:', error);
      setInstallmentSchedule([]);
    } finally {
      setInstallmentLoading(false);
    }

    setShowInstallmentModal(true);
  };

  const handleInstallmentFormChange = (field, value) => {
    const newForm = { ...installmentForm, [field]: value };
    setInstallmentForm(newForm);
    
    // Update preview when form changes
    if (field === 'months' || field === 'annualInterestRate') {
      const preview = calculateInstallmentPreview(
        selectedPaymentForInstallment?.amount || 0,
        field === 'months' ? value : newForm.months,
        field === 'annualInterestRate' ? value : newForm.annualInterestRate
      );
      setInstallmentPreview(preview);
    }
  };

  const handleCreateInstallment = async (e) => {
    e?.preventDefault();
    if (!selectedPaymentForInstallment) {
      showErrorToast('Payment không hợp lệ');
      return;
    }

    const paymentId = selectedPaymentForInstallment.paymentId || selectedPaymentForInstallment.id;
    const totalAmount = selectedPaymentForInstallment.amount || 0;

    if (!installmentForm.firstDueDate) {
      showErrorToast('Vui lòng chọn ngày đến hạn đầu tiên');
      return;
    }

    if (!installmentForm.months || installmentForm.months <= 0) {
      showErrorToast('Vui lòng nhập số tháng hợp lệ (1-36)');
      return;
    }

    if (installmentForm.months > 36) {
      showErrorToast('Số tháng tối đa là 36 tháng');
      return;
    }

    if (installmentForm.annualInterestRate < 0 || installmentForm.annualInterestRate > 100) {
      showErrorToast('Lãi suất phải từ 0% đến 100%');
      return;
    }

    try {
      setInstallmentCreating(true);
      const payload = {
        paymentId: Number(paymentId),
        totalAmount: Number(totalAmount),
        months: Number(installmentForm.months),
        annualInterestRate: Number(installmentForm.annualInterestRate) || 0,
        firstDueDate: installmentForm.firstDueDate
      };

      await installmentsAPI.create(payload);
      showSuccessToast('Tạo kế hoạch trả góp thành công');

      const schedule = await installmentsAPI.getByPayment(paymentId);
      setInstallmentSchedule(Array.isArray(schedule) ? schedule : []);
    } catch (error) {
      console.error('Error creating installment:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setInstallmentCreating(false);
    }
  };

  const handlePayInstallment = async (transactionId) => {
    if (!transactionId) {
      showErrorToast('Transaction ID không hợp lệ');
      return;
    }

    try {
      await installmentsAPI.payInstallment(transactionId, 'INSTALLMENT');
      showSuccessToast('Đánh dấu kỳ trả góp đã thanh toán thành công');

      const paymentId = selectedPaymentForInstallment?.paymentId || selectedPaymentForInstallment?.id;
      if (paymentId) {
        const schedule = await installmentsAPI.getByPayment(paymentId);
        setInstallmentSchedule(Array.isArray(schedule) ? schedule : []);
      }
    } catch (error) {
      console.error('Error paying installment:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const handleDeleteInstallment = async () => {
    if (!selectedPaymentForInstallment) {
      showErrorToast('Payment không hợp lệ');
      return;
    }

    const paymentId = selectedPaymentForInstallment.paymentId || selectedPaymentForInstallment.id;

    try {
      await installmentsAPI.delete(paymentId);
      showSuccessToast('Đã xóa kế hoạch trả góp');
      setInstallmentSchedule([]);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting installment:', error);
      showErrorToast(handleAPIError(error));
    }
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

  const calculateChartData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months = [];
    
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
          monthData.revenue += amount / 1000;
        } else if (status === 'PENDING' || status === 'pending') {
          monthData.pending += amount / 1000;
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
                      {(() => {
                        const dateValue = payment.paidDate || 
                                        payment.paymentDate || 
                                        payment.createdDate || 
                                        payment.createdAt || 
                                        payment.date || 
                                        payment.timestamp || 
                                        null;
                        
                        if (dateValue) {
                          try {
                            const date = new Date(dateValue);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleDateString('vi-VN');
                            }
                          } catch (e) {
                            console.warn('Invalid date value:', dateValue);
                          }
                        }
                        return 'N/A';
                      })()}
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
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                            <i className="bx bx-credit-card" style={{ marginRight: '4px' }}></i>
                            Pay Now
                          </button>
                        )}
                        {(status === 'COMPLETED' || status === 'completed') && (
                          <button
                            className="btn btn-outline"
                            style={{ fontSize: '12px' }}
                            onClick={() => handleOpenInstallmentModal(payment)}
                            title="Tạo hoặc xem kế hoạch trả góp"
                          >
                            <i className="bx bx-calendar" style={{ marginRight: '4px' }}></i>
                            Trả góp
                          </button>
                        )}
                      </div>
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

      {/* Installment Modal - IMPROVED VERSION */}
      {showInstallmentModal && selectedPaymentForInstallment && (
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
          zIndex: 1000,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Quản lý trả góp - Payment #{selectedPaymentForInstallment.paymentId || selectedPaymentForInstallment.id}</h3>
              <button 
                onClick={() => {
                  setShowInstallmentModal(false);
                  setSelectedPaymentForInstallment(null);
                  setInstallmentSchedule([]);
                  setInstallmentPreview(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            {/* Payment Info */}
            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Số tiền</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-primary)' }}>
                    ${(selectedPaymentForInstallment.amount || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Phương thức</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                    {selectedPaymentForInstallment.paymentMethod || 'VNPay'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Trạng thái</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-success)' }}>
                    {selectedPaymentForInstallment.status === 'COMPLETED' ? 'Hoàn thành' : selectedPaymentForInstallment.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Create Installment Form */}
            {installmentSchedule.length === 0 && (
              <form onSubmit={handleCreateInstallment} style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                padding: '20px',
                marginBottom: '24px',
                background: 'var(--color-bg)'
              }}>
                <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                  <i className="bx bx-plus-circle" style={{ marginRight: '8px' }}></i>
                  Tạo kế hoạch trả góp
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Số tháng * <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>(1-36)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={installmentForm.months}
                      onChange={(e) => handleInstallmentFormChange('months', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Lãi suất năm (%) <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>(0-100)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={installmentForm.annualInterestRate}
                      onChange={(e) => handleInstallmentFormChange('annualInterestRate', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Ngày đến hạn đầu tiên *
                    </label>
                    <input
                      type="date"
                      value={installmentForm.firstDueDate}
                      onChange={(e) => handleInstallmentFormChange('firstDueDate', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Preview Section */}
                {installmentPreview && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    borderRadius: 'var(--radius)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}>
                    <h5 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="bx bx-calculator"></i>
                      Dự kiến thanh toán
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', opacity: '0.9', marginBottom: '4px' }}>Trả hàng tháng</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>
                          ${installmentPreview.monthlyPayment.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', opacity: '0.9', marginBottom: '4px' }}>Tổng tiền phải trả</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>
                          ${installmentPreview.totalPayment.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', opacity: '0.9', marginBottom: '4px' }}>Tổng lãi suất</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>
                          ${installmentPreview.totalInterest.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', opacity: '0.9', marginBottom: '4px' }}>Số kỳ</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>
                          {installmentPreview.months} tháng
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowInstallmentModal(false);
                      setSelectedPaymentForInstallment(null);
                      setInstallmentSchedule([]);
                      setInstallmentPreview(null);
                    }}
                    disabled={installmentCreating}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={installmentCreating}
                  >
                    {installmentCreating ? (
                      <>
                        <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <i className="bx bx-plus" style={{ marginRight: '6px' }}></i>
                        Tạo kế hoạch trả góp
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Installment Schedule */}
            {installmentLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', color: 'var(--color-primary)' }}></i>
                <div style={{ marginTop: '12px', color: 'var(--color-text-muted)' }}>Đang tải lịch trả góp...</div>
              </div>
            ) : installmentSchedule.length > 0 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="bx bx-list-ul"></i>
                    Lịch trả góp ({installmentSchedule.length} kỳ)
                  </h4>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '12px', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <i className="bx bx-trash" style={{ marginRight: '4px' }}></i>
                    Xóa kế hoạch
                  </button>
                </div>

                {/* Summary Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px',
                  padding: '16px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Tổng số tiền</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-primary)' }}>
                      ${installmentSchedule.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Đã thanh toán</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-success)' }}>
                      {installmentSchedule.filter(item => (item.status || '').toUpperCase() === 'PAID').length} / {installmentSchedule.length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Chưa thanh toán</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-warning)' }}>
                      ${installmentSchedule
                        .filter(item => (item.status || '').toUpperCase() !== 'PAID')
                        .reduce((sum, item) => sum + (item.amount || 0), 0)
                        .toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Tiến độ</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-info)' }}>
                      {Math.round((installmentSchedule.filter(item => (item.status || '').toUpperCase() === 'PAID').length / installmentSchedule.length) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    height: '8px',
                    background: 'var(--color-bg)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      width: `${(installmentSchedule.filter(item => (item.status || '').toUpperCase() === 'PAID').length / installmentSchedule.length) * 100}%`,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>#</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Ngày đến hạn</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Số tiền</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installmentSchedule.map((item, index) => {
                        const status = (item.status || '').toUpperCase();
                        const transactionId = item.transactionId || item.id;
                        const isPaid = status === 'PAID';
                        const dueDate = item.dueDate ? new Date(item.dueDate) : null;
                        const isOverdue = dueDate && !isPaid && dueDate < new Date();
                        
                        return (
                          <tr key={transactionId || index} style={{ 
                            borderBottom: '1px solid var(--color-border)',
                            background: isPaid ? 'rgba(16, 185, 129, 0.05)' : isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                          }}>
                            <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                              {item.installmentNumber || index + 1}
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>
                              <div>
                                {dueDate ? dueDate.toLocaleDateString('vi-VN') : 'N/A'}
                              </div>
                              {isOverdue && (
                                <div style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="bx bx-error-circle"></i>
                                  Quá hạn
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>
                              ${(item.amount || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: 'var(--radius)',
                                background: isPaid ? 'var(--color-success)' : isOverdue ? 'var(--color-error)' : 'var(--color-warning)',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {isPaid ? (
                                  <>
                                    <i className="bx bx-check-circle"></i>
                                    Đã trả
                                  </>
                                ) : isOverdue ? (
                                  <>
                                    <i className="bx bx-error-circle"></i>
                                    Quá hạn
                                  </>
                                ) : (
                                  <>
                                    <i className="bx bx-time"></i>
                                    Chờ trả
                                  </>
                                )}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              {isPaid ? (
                                <span style={{ fontSize: '12px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <i className="bx bx-check-double"></i>
                                  Hoàn thành
                                </span>
                              ) : (
                                <button
                                  className="btn btn-primary"
                                  style={{ fontSize: '12px' }}
                                  onClick={() => handlePayInstallment(transactionId)}
                                >
                                  <i className="bx bx-check" style={{ marginRight: '4px' }}></i>
                                  Đánh dấu đã trả
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-calendar-x" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Chưa có lịch trả góp</div>
                <div style={{ fontSize: '14px' }}>Vui lòng tạo kế hoạch trả góp ở form bên trên</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <i className="bx bx-error-circle" style={{ fontSize: '48px', color: 'var(--color-error)' }}></i>
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: '12px' }}>Xác nhận xóa</h3>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Bạn có chắc chắn muốn xóa kế hoạch trả góp này? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--color-error)' }}
                onClick={handleDeleteInstallment}
              >
                <i className="bx bx-trash" style={{ marginRight: '6px' }}></i>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;