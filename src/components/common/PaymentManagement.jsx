import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { paymentsAPI } from '../../utils/api/paymentsAPI';
import { ordersAPI } from '../../utils/api/ordersAPI';

import { installmentsAPI } from '../../utils/api/installmentsAPI';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const PaymentManagement = ({ user, paymentTabState }) => {
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all relevant orders for lookup

  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  // Payment Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);
  const [detailInstallmentSchedule, setDetailInstallmentSchedule] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const userRole = user?.role?.toUpperCase().replace(/-/g, '_');
  const userId = user?.id || user?.userId || user?.user?.id;
  const userDealerId = user?.dealerId || user?.user?.dealerId;

  const getOrderNumber = (order) => {
    if (!order) return 'ORD-N/A';
    const raw =
      order.displayOrderNumber ||
      order.orderNumber ||
      order.orderCode ||
      null;
    if (raw) return raw;
    const fallbackId = order.orderId || order.id;
    return fallbackId ? `ORD-${fallbackId}` : 'ORD-N/A';
  };

  const getCustomerName = (order) => {
    if (!order) return 'N/A';
    const candidateIds = [
      order.customerId,
      order.customer?.id,
      order.customer?.customerId,
      order.customer?.customer?.id,
    ].filter((value) => value !== undefined && value !== null);



    const fallback =
      order.customer ||
      order.customerInfo ||
      order.customerDetails ||
      null;
    if (fallback) {
      return (
        fallback.fullName ||
        fallback.name ||
        fallback.displayName ||
        fallback.customerName ||
        (fallback.id ? `Customer #${fallback.id}` : 'N/A')
      );
    }

    if (candidateIds.length > 0) {
      return `Customer #${candidateIds[0]}`;
    }
    return 'N/A';
  };

  const getVehicleName = (order) => {
    if (!order) return 'N/A';
    const orderDetails = Array.isArray(order.orderDetails) ? order.orderDetails : [];
    const firstDetail = orderDetails[0];

    const vehicle =
      firstDetail?.vehicle ||
      order.vehicle ||
      order.vehicleInfo ||
      order.vehicleDetails ||
      null;

    if (vehicle) {
      if (vehicle.brand && vehicle.modelName) {
        return `${vehicle.brand} ${vehicle.modelName}`;
      }
      return (
        vehicle.name ||
        vehicle.modelName ||
        vehicle.model ||
        vehicle.vehicleName ||
        vehicle.displayName ||
        vehicle.title ||
        'N/A'
      );
    }

    if (firstDetail?.vehicleId) {
      return `Vehicle #${firstDetail.vehicleId}`;
    }
    if (order.vehicleId) {
      return `Vehicle #${order.vehicleId}`;
    }
    return 'N/A';
  };

  const createVnpayPaymentRecordFromOrder = (order) => {
    if (!order) return null;
    const orderId = order.orderId || order.id;
    const method = (order.paymentMethod || '').toUpperCase();
    if (!orderId || method !== 'VNPAY' || !(order.paidAmount > 0)) {
      return null;
    }

    const normalizedStatus = (order.paymentStatus || '').toUpperCase();
    const fallbackStatus =
      normalizedStatus === 'PAID' || normalizedStatus === 'PARTIALLY_PAID'
        ? 'COMPLETED'
        : 'PENDING';

    return {
      id: `order-${orderId}-payment`,
      orderId,
      orderNumber: getOrderNumber(order),
      customerName: getCustomerName(order),
      vehicleName: getVehicleName(order),
      amount: order.paidAmount,
      paymentMethod: 'VNPAY',
      status: fallbackStatus,
      paymentDate: order.orderDate || new Date().toISOString(),
      paymentStatus: order.paymentStatus || 'PENDING',
    };
  };

  const getPaymentNumericId = (payment) => {
    if (!payment) return 0;
    const raw = payment.paymentId || payment.id || payment.txnRef || payment.vnpayTxnRef;
    if (typeof raw === 'string' && /^\d+$/.test(raw)) {
      return Number(raw);
    }
    const numeric = Number(raw);
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  const resolvePaymentTimestamp = (payment) => {
    if (!payment) return null;
    const candidates = [
      payment.vnpayPayDate,
      payment.payDate,
      payment.paymentDate,
      payment.createdAt,
      payment.createdDate,
      payment.updatedAt,
      payment.updatedDate,
      payment.date,
      payment.timestamp,
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const time = new Date(candidate).getTime();
      if (!Number.isNaN(time)) {
        return time;
      }
    }

    return null;
  };

  const formatPaymentTimestamp = (payment) => {
    const timestamp = resolvePaymentTimestamp(payment);
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US');
  };

  const sortPaymentsByNewest = (list = []) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const idDiff = getPaymentNumericId(b) - getPaymentNumericId(a);
      if (idDiff !== 0) return idDiff;
      const timeB = resolvePaymentTimestamp(b) ?? 0;
      const timeA = resolvePaymentTimestamp(a) ?? 0;
      return timeB - timeA;
    });
  };



  // Load payments and approved orders
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load orders theo role
        let orders = [];
        if (userRole === 'DEALER_STAFF' && userId) {
          orders = await ordersAPI.getByUser(userId);
        } else if (userRole === 'DEALER_MANAGER' && userDealerId) {
          orders = await ordersAPI.getOrdersByDealerId(userDealerId);
        } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
          // EVM Manager và Admin có thể xem tất cả orders
          orders = await ordersAPI.getAll();
        } else {
          // Fallback: thử getAll nếu không có userId hoặc dealerId
          try {
            orders = await ordersAPI.getAll();
          } catch (error) {
            console.warn('Failed to load orders:', error);
            orders = [];
          }
        }

        if (!Array.isArray(orders)) {
          orders = [];
        }

        // Filter orders: Hiển thị orders đã approved HOẶC orders có payment (kể cả chưa approve)
        // Để user có thể xem payment history ngay sau khi tạo order
        const ordersToCheck = Array.isArray(orders) ? orders : [];

        // Load payment info cho tất cả orders để quyết định hiển thị
        const ordersWithPaymentCheck = await Promise.all(
          ordersToCheck.map(async (order) => {
            const orderId = order.orderId || order.id;
            const approvalStatus = order.approvalStatus || order.orderApprovalStatus || '';
            const status = order.status || order.orderStatus || '';

            // Fetch payments to get accurate paid amount
            let payments = [];
            try {
              payments = await paymentsAPI.getDealerWorkflowPayments(orderId);
            } catch (error) {
              // Ignore error
            }

            const calculatedPaidAmount = Array.isArray(payments)
              ? payments
                .filter(p => p.status === 'COMPLETED' || p.status === 'completed')
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
              : 0;

            console.log(`[Debug Payment] Order ${orderId}:`, {
              payments,
              calculatedPaidAmount,
              backendPaidAmount: order.paidAmount,
              totalAmount: order.totalAmount || order.amount
            });

            const paidAmount = calculatedPaidAmount > 0 ? calculatedPaidAmount : (order.paidAmount || 0);
            const totalAmount = order.totalAmount || order.amount || 0;
            const remainingAmount = Math.max(totalAmount - paidAmount, 0);
            const paymentStatus = order.paymentStatus || order.payment_status || (remainingAmount <= 0 && paidAmount > 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIALLY_PAID' : 'UNPAID'));

            // Case 1: Order đã approved
            const isApproved = approvalStatus === 'APPROVED' && status === 'APPROVED';
            // Include if needs payment OR has been paid (fully or partially) so we can show history/remaining actions
            const hasActivity = paymentStatus === 'UNPAID' ||
              paymentStatus === 'PARTIALLY_PAID' ||
              paymentStatus === 'PAID' ||
              paidAmount > 0 ||
              remainingAmount > 0 ||
              !paymentStatus;

            if (isApproved && hasActivity) {
              // Return enriched order with calculated values
              return {
                order: {
                  ...order,
                  paidAmount,
                  remainingAmount,
                  paymentStatus
                },
                shouldShow: true
              };
            }

            // Case 2: Order chưa approved nhưng đã có payment (tạo order với payment percentage)
            const isPending = approvalStatus === 'PENDING_APPROVAL' || status === 'PENDING';
            const hasPayments = Array.isArray(payments) && payments.length > 0;

            // Hiển thị nếu có payment status hoặc có payments hoặc có paidAmount
            const hasPaymentInfo = paymentStatus === 'PARTIALLY_PAID' ||
              paymentStatus === 'PAID' ||
              hasPayments ||
              paidAmount > 0 ||
              remainingAmount > 0;

            if (isPending && hasPaymentInfo) {
              return {
                order: {
                  ...order,
                  paidAmount,
                  remainingAmount,
                  paymentStatus
                },
                shouldShow: true
              };
            }

            return { order, shouldShow: false };
          })
        );

        // Filter chỉ lấy orders nên hiển thị cho section "Orders - Ready for Payment"
        // CHỈ hiển thị orders chưa thanh toán lần đầu (paidAmount = 0)
        // Nếu đã thanh toán 1 phần (paidAmount > 0), sẽ chuyển xuống phần Payment History dưới dạng "Remaining Balance"
        // Filter orders: Lấy danh sách orders cần hiển thị (approved hoặc có payment)
        const ordersToEnrich = ordersWithPaymentCheck
          .filter(item => item.shouldShow)
          .map(item => item.order);

        // Load TẤT CẢ payments từ TẤT CẢ orders (không chỉ approved)
        const allPaymentsFromAllOrders = [];
        for (const order of ordersToCheck) {
          const orderId = order.orderId || order.id;
          if (!orderId) continue;

          const paymentStatus = (order.paymentStatus || order.payment_status || '').toUpperCase();
          const hasActivity =
            paymentStatus === 'PAID' ||
            paymentStatus === 'PARTIALLY_PAID' ||
            (order.paidAmount && order.paidAmount > 0);

          let orderPayments = [];
          if (hasActivity) {
            try {
              const workflowPayments = await paymentsAPI.getDealerWorkflowPayments(orderId);
              if (Array.isArray(workflowPayments)) {
                orderPayments = workflowPayments;
              } else if (Array.isArray(workflowPayments?.payments)) {
                orderPayments = workflowPayments.payments;
              }

              if (!orderPayments.length) {
                const fallbackPayments = await paymentsAPI.getByOrder(orderId);
                if (Array.isArray(fallbackPayments)) {
                  orderPayments = fallbackPayments;
                }
              }
            } catch (error) {
              console.log(`No payments for order ${orderId}:`, error.message);
            }
          }

          if (orderPayments.length) {
            const customerName = getCustomerName(order);
            const vehicleName = getVehicleName(order);
            const orderNumber = getOrderNumber(order);

            const normalizedPayments = orderPayments.map((payment) => ({
              ...payment,
              orderId,
              orderNumber,
              customerName,
              vehicleName,
            }));
            allPaymentsFromAllOrders.push(...normalizedPayments);
          }
        }

        const enrichedOrdersWithPayments = await Promise.all(
          ordersToEnrich.map(async (order) => {
            // ... (Logic enrich order giữ nguyên, nhưng approved list đã được filter ở trên)
            // Copy lại logic enrich để đảm bảo consistency
            const orderId = order.orderId || order.id;
            const orderNumber = getOrderNumber(order);
            const customerName = getCustomerName(order);
            const vehicleName = getVehicleName(order);

            let paymentOverview = null;
            try {
              paymentOverview = await paymentsAPI.getDealerWorkflowPaymentStatus(orderId);
            } catch (error) {
              // optional endpoint - ignore failures
            }

            // Load payments cho order này để tính toán status
            let orderPayments = [];
            try {
              const workflowPayments = await paymentsAPI.getDealerWorkflowPayments(orderId);
              if (Array.isArray(workflowPayments)) {
                orderPayments = workflowPayments;
              } else if (Array.isArray(workflowPayments?.payments)) {
                orderPayments = workflowPayments.payments;
              }
            } catch (error) {
              // ignore
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

            const calculatedPaidAmount = normalizedPayments
              .filter((p) => p.status === 'COMPLETED' || p.status === 'completed')
              .reduce((sum, payment) => sum + (payment.amount || 0), 0);

            const paidAmount =
              (calculatedPaidAmount > 0 ? calculatedPaidAmount : null) ??
              paymentOverview?.totalPaid ??
              paymentOverview?.totalAmountPaid ??
              order.paidAmount ??
              0;

            const remainingAmount =
              Math.max(totalAmount - paidAmount, 0);

            let paymentMethod =
              (paymentOverview?.lastPaymentMethod ||
                order.paymentMethod ||
                order.payment_method ||
                normalizedPayments?.[0]?.paymentMethod ||
                'VNPAY')?.toUpperCase();

            // Treat TRANSFER as VNPAY
            if (paymentMethod === 'TRANSFER') {
              paymentMethod = 'VNPAY';
            }

            let updatedStatus = order.status || order.orderStatus;
            const currentApprovalStatus = order.approvalStatus || order.orderApprovalStatus || '';
            const isApproved = currentApprovalStatus === 'APPROVED' ||
              order.normalizedApprovalStatus === 'APPROVED';

            if (isApproved) {
              if (remainingAmount <= 0) {
                updatedStatus = 'COMPLETED';
              } else {
                updatedStatus = 'APPROVED';
              }
            }

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
              status: updatedStatus,
              normalizedStatus: updatedStatus,
            };
          })
        );

        // Combine payments từ approved orders và tất cả payments đã load
        // Lưu ý: allPaymentsFromAllOrders đã bao gồm payments của approved orders nếu chúng có activity
        // Tuy nhiên, approved orders (top section) là những order chưa thanh toán (paidAmount=0), nên có thể chưa có trong allPaymentsFromAllOrders

        const paymentsFromApprovedOrders = enrichedOrdersWithPayments.flatMap(
          (order) => order.orderPayments || []
        );

        const paymentMap = new Map();
        [...allPaymentsFromAllOrders, ...paymentsFromApprovedOrders].forEach(payment => {
          const paymentId = payment.id || payment.paymentId;
          if (paymentId && !paymentMap.has(paymentId)) {
            paymentMap.set(paymentId, payment);
          }
        });

        const allPayments = sortPaymentsByNewest(Array.from(paymentMap.values()));
        setPayments(allPayments);
        setAllOrders(enrichedOrdersWithPayments);
      } catch (error) {
        console.error('Error loading payments:', error);
        showErrorToast(handleAPIError(error));
        setPayments([]);
        setAllOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userRole, userId, userDealerId, refreshTrigger]);

  useEffect(() => {
    // Refresh khi có fromPaymentResult hoặc orderId trong query params
    if (location.state?.fromPaymentResult) {
      console.log('Returning from payment result - reloading data...');
      setRefreshTrigger(prev => prev + 1);
      window.history.replaceState({}, document.title);
    }

    // Check query params cho orderId và fromPaymentResult
    const searchParams = new URLSearchParams(location.search);
    const orderIdFromUrl = searchParams.get('orderId');
    const fromPaymentResult = searchParams.get('fromPaymentResult');

    if (fromPaymentResult || orderIdFromUrl) {
      console.log('Payment result or OrderId from URL - reloading data...', { orderIdFromUrl, fromPaymentResult });
      setRefreshTrigger(prev => prev + 1);

      // Clear query params sau khi đã load
      const newSearch = new URLSearchParams(location.search);
      newSearch.delete('orderId');
      newSearch.delete('fromPaymentResult');
      window.history.replaceState({}, document.title, location.pathname + (newSearch.toString() ? '?' + newSearch.toString() : ''));
    }

    // Check sessionStorage cho orderId (khi switch từ Orders tab)
    const orderIdFromStorage = sessionStorage.getItem('selectedOrderId');
    if (orderIdFromStorage) {
      console.log('OrderId from sessionStorage - reloading data...', orderIdFromStorage);
      setRefreshTrigger(prev => prev + 1);
      // Clear sau khi đã load
      sessionStorage.removeItem('selectedOrderId');
    }
  }, [location]);

  // Handle paymentTabState from DashboardApp - REMOVED logic as we don't support creating payment here anymore
  useEffect(() => {
    if (paymentTabState?.orderId) {
      console.log('Payment tab state received but payment creation is disabled in this view.');
    }
  }, [paymentTabState]);



  const handleViewPaymentDetail = async (payment) => {
    setSelectedPaymentDetail(payment);
    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailInstallmentSchedule([]);

    try {
      const orderId = payment.orderId || payment.order?.id || payment.order?.orderId;
      if (orderId) {
        // Fetch installment schedule if it exists
        const schedule = await installmentsAPI.getByOrder(orderId);
        if (Array.isArray(schedule) && schedule.length > 0) {
          setDetailInstallmentSchedule(schedule);
        }
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setDetailLoading(false);
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
    return allOrders.find(
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

      </div>

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
                const paymentDateDisplay = formatPaymentTimestamp(payment);

                return (
                  <tr key={payment.paymentId || payment.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      <div>{payment.orderNumber || payment.orderId || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                        {paymentDateDisplay}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>
                      {payment.customer?.fullName || payment.customerName || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>
                      ${(payment.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {(payment.paymentMethod || '').toUpperCase() === 'TRANSFER' ? 'VNPAY' : (payment.paymentMethod || 'VNPay')}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {paymentDateDisplay}
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
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '12px', marginLeft: '8px' }}
                          onClick={() => handleViewPaymentDetail(payment)}
                          title="View Details"
                        >
                          <i className="bx bx-show"></i>
                        </button>
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


      {/* Payment Detail Modal */}
      {
        showDetailModal && selectedPaymentDetail && (
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
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="bx bx-detail"></i>
                  Payment Details
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-text)' }}
                >
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Order Number</label>
                  <div style={{ fontWeight: '600' }}>{selectedPaymentDetail.orderNumber || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Customer</label>
                  <div style={{ fontWeight: '600' }}>{selectedPaymentDetail.customerName || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Amount</label>
                  <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                    ${(selectedPaymentDetail.amount || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Payment Method</label>
                  <div style={{ fontWeight: '600' }}>{selectedPaymentDetail.paymentMethod || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Status</label>
                  <div>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: selectedPaymentDetail.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: selectedPaymentDetail.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-warning)'
                    }}>
                      {selectedPaymentDetail.status || 'PENDING'}
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Date</label>
                  <div style={{ fontWeight: '600' }}>
                    {(() => {
                      const dateStr = selectedPaymentDetail.vnpayPayDate ||
                        selectedPaymentDetail.payDate ||
                        selectedPaymentDetail.createdDate ||
                        selectedPaymentDetail.createdAt ||
                        selectedPaymentDetail.paymentDate;
                      return dateStr ? new Date(dateStr).toLocaleString('en-US') : 'N/A';
                    })()}
                  </div>
                </div>
                {selectedPaymentDetail.txnRef && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Transaction Reference</label>
                    <div style={{ fontFamily: 'monospace', background: 'var(--color-bg)', padding: '8px', borderRadius: '4px' }}>
                      {selectedPaymentDetail.txnRef}
                    </div>
                  </div>
                )}
              </div>

              {/* Installment Schedule Section */}
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '24px' }}></i>
                  <div style={{ marginTop: '8px', fontSize: '12px' }}>Checking for installment schedule...</div>
                </div>
              ) : detailInstallmentSchedule.length > 0 && (
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Installment Schedule</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ padding: '10px', textAlign: 'center' }}>#</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Due Date</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailInstallmentSchedule.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.installmentNumber}</td>
                            <td style={{ padding: '10px' }}>{new Date(item.dueDate).toLocaleDateString('en-US')}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>
                              ${(item.amount || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                background: item.status === 'PAID' ? 'var(--color-success)' : 'var(--color-warning)',
                                color: 'white'
                              }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              {/* Read-only view */}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div >
  );
};

export default PaymentManagement;