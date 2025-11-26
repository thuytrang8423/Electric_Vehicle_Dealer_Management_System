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

const PaymentManagement = ({ user, paymentTabState }) => {
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
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
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState(null);

  // Payment Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);
  const [detailInstallmentSchedule, setDetailInstallmentSchedule] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const userRole = user?.role?.toUpperCase().replace(/-/g, '_');
  const userId = user?.id || user?.userId || user?.user?.id;
  const userDealerId = user?.dealerId || user?.user?.dealerId;

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
            const paymentStatus = order.paymentStatus || order.payment_status || '';
            const paidAmount = order.paidAmount || 0;
            const remainingAmount = order.remainingAmount || 0;

            // Case 1: Order đã approved và chưa thanh toán đủ
            const isApproved = approvalStatus === 'APPROVED' && status === 'APPROVED';
            const needsPayment = paymentStatus === 'UNPAID' || paymentStatus === 'PARTIALLY_PAID' || !paymentStatus;
            if (isApproved && needsPayment) {
              return { order, shouldShow: true };
            }

            // Case 2: Order chưa approved nhưng đã có payment (tạo order với payment percentage)
            // Hiển thị để có thể xem payment history
            const isPending = approvalStatus === 'PENDING_APPROVAL' || status === 'PENDING';

            // Kiểm tra xem order có payments không
            let hasPayments = false;
            try {
              const payments = await paymentsAPI.getDealerWorkflowPayments(orderId);
              hasPayments = Array.isArray(payments) && payments.length > 0;
            } catch (error) {
              // Ignore error, sẽ dùng paymentStatus từ order
            }

            // Hiển thị nếu có payment status hoặc có payments hoặc có paidAmount
            const hasPaymentInfo = paymentStatus === 'PARTIALLY_PAID' ||
              paymentStatus === 'PAID' ||
              hasPayments ||
              paidAmount > 0 ||
              remainingAmount > 0;

            if (isPending && hasPaymentInfo) {
              return { order, shouldShow: true };
            }

            return { order, shouldShow: false };
          })
        );

        // Filter chỉ lấy orders nên hiển thị cho section "Orders - Ready for Payment"
        const approved = ordersWithPaymentCheck
          .filter(item => item.shouldShow)
          .map(item => item.order);

        // Load TẤT CẢ payments từ TẤT CẢ orders (không chỉ approved)
        const allPaymentsFromAllOrders = [];
        for (const order of ordersToCheck) {
          const orderId = order.orderId || order.id;
          if (!orderId) continue;

          // OPTIMIZATION: Only fetch payments for orders that actually have payment activity
          // Skip UNPAID orders with 0 paidAmount to avoid excessive API calls
          const paymentStatus = (order.paymentStatus || order.payment_status || '').toUpperCase();
          const hasActivity =
            paymentStatus === 'PAID' ||
            paymentStatus === 'PARTIALLY_PAID' ||
            (order.paidAmount && order.paidAmount > 0);

          if (!hasActivity) continue;

          try {
            const orderPayments = await paymentsAPI.getDealerWorkflowPayments(orderId);
            if (Array.isArray(orderPayments) && orderPayments.length > 0) {
              // Get customer và vehicle info
              const customer = customerLookup[String(order.customerId)];
              const customerName = customer?.fullName || customer?.name || `Customer #${order.customerId}`;

              let vehicleName = 'N/A';
              if (order.orderDetails && order.orderDetails.length > 0) {
                const firstDetail = order.orderDetails[0];
                const vehicle = vehicleLookup[String(firstDetail.vehicleId)];
                vehicleName = vehicle?.name || vehicle?.model || `Vehicle #${firstDetail.vehicleId}`;
              }

              const orderNumber = `ORD-${order.id || order.orderId}`;

              // Map payments với thông tin order
              const normalizedPayments = orderPayments.map((payment) => ({
                ...payment,
                orderId,
                orderNumber,
                customerName,
                vehicleName,
              }));

              allPaymentsFromAllOrders.push(...normalizedPayments);
            } else {
              // Nếu không có payments từ API nhưng order có paidAmount và paymentMethod = VNPAY
              // Tạo payment record từ order data để hiển thị
              if (order.paidAmount > 0 && (order.paymentMethod === 'VNPAY' || order.paymentMethod === 'vnpay')) {
                const customer = customerLookup[String(order.customerId)];
                const customerName = customer?.fullName || customer?.name || `Customer #${order.customerId}`;

                let vehicleName = 'N/A';
                if (order.orderDetails && order.orderDetails.length > 0) {
                  const firstDetail = order.orderDetails[0];
                  const vehicle = vehicleLookup[String(firstDetail.vehicleId)];
                  vehicleName = vehicle?.name || vehicle?.model || `Vehicle #${firstDetail.vehicleId}`;
                }

                const orderNumber = `ORD-${order.id || order.orderId}`;

                // Tạo payment record từ order data
                const paymentFromOrder = {
                  id: `order-${orderId}-payment`,
                  orderId,
                  orderNumber,
                  customerName,
                  vehicleName,
                  amount: order.paidAmount,
                  paymentMethod: 'VNPAY',
                  status: order.paymentStatus === 'PARTIALLY_PAID' ? 'COMPLETED' :
                    order.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
                  paymentDate: order.orderDate || new Date().toISOString(),
                  paymentStatus: order.paymentStatus || 'PENDING',
                };

                allPaymentsFromAllOrders.push(paymentFromOrder);
              }
            }
          } catch (error) {
            // Ignore errors, continue với order tiếp theo
            console.log(`No payments for order ${orderId}:`, error.message);

            // Fallback: Nếu order có paidAmount và VNPAY, tạo payment record từ order data
            if (order.paidAmount > 0 && (order.paymentMethod === 'VNPAY' || order.paymentMethod === 'vnpay')) {
              const customer = customerLookup[String(order.customerId)];
              const customerName = customer?.fullName || customer?.name || `Customer #${order.customerId}`;

              let vehicleName = 'N/A';
              if (order.orderDetails && order.orderDetails.length > 0) {
                const firstDetail = order.orderDetails[0];
                const vehicle = vehicleLookup[String(firstDetail.vehicleId)];
                vehicleName = vehicle?.name || vehicle?.model || `Vehicle #${firstDetail.vehicleId}`;
              }

              const orderNumber = `ORD-${order.id || order.orderId}`;

              const paymentFromOrder = {
                id: `order-${orderId}-payment`,
                orderId,
                orderNumber,
                customerName,
                vehicleName,
                amount: order.paidAmount,
                paymentMethod: 'VNPAY',
                status: order.paymentStatus === 'PARTIALLY_PAID' ? 'COMPLETED' :
                  order.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
                paymentDate: order.orderDate || new Date().toISOString(),
                paymentStatus: order.paymentStatus || 'PENDING',
              };

              allPaymentsFromAllOrders.push(paymentFromOrder);
            }
          }
        }

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

            // Tính paidAmount từ tất cả payments completed
            const calculatedPaidAmount = normalizedPayments
              .filter((p) => p.status === 'COMPLETED' || p.status === 'completed')
              .reduce((sum, payment) => sum + (payment.amount || 0), 0);

            const paidAmount =
              paymentOverview?.totalPaid ??
              paymentOverview?.totalAmountPaid ??
              (calculatedPaidAmount > 0 ? calculatedPaidAmount : null) ??
              order.paidAmount ??
              0;

            const remainingAmount =
              paymentOverview?.remainingAmount ??
              Math.max(totalAmount - paidAmount, 0);

            const paymentMethod =
              (paymentOverview?.lastPaymentMethod ||
                order.paymentMethod ||
                order.payment_method ||
                normalizedPayments?.[0]?.paymentMethod ||
                'VNPAY')?.toUpperCase();

            // 🔥 TỰ ĐỘNG CẬP NHẬT ORDER STATUS DỰA TRÊN PAYMENTS
            // Nếu order đã approved, cập nhật status dựa trên remainingAmount
            let updatedStatus = order.status || order.orderStatus;
            const currentApprovalStatus = order.approvalStatus || order.orderApprovalStatus || '';
            const isApproved = currentApprovalStatus === 'APPROVED' ||
              order.normalizedApprovalStatus === 'APPROVED';

            if (isApproved) {
              // Nếu đã trả hết (remainingAmount = 0) → COMPLETED
              // Nếu chưa trả hết (remainingAmount > 0) → APPROVED
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
              // Cập nhật status dựa trên payments
              status: updatedStatus,
              normalizedStatus: updatedStatus,
            };
          })
        );

        // Combine payments từ approved orders và tất cả payments đã load
        const paymentsFromApprovedOrders = enrichedOrdersWithPayments.flatMap(
          (order) => order.orderPayments || []
        );

        // Merge và deduplicate payments (theo id hoặc paymentId)
        const paymentMap = new Map();
        [...allPaymentsFromAllOrders, ...paymentsFromApprovedOrders].forEach(payment => {
          const paymentId = payment.id || payment.paymentId;
          if (paymentId && !paymentMap.has(paymentId)) {
            paymentMap.set(paymentId, payment);
          }
        });

        const allPayments = Array.from(paymentMap.values());
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
  }, [userRole, userId, userDealerId, refreshTrigger, customerLookup, vehicleLookup]);

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

  // Handle paymentTabState from DashboardApp
  useEffect(() => {
    if (paymentTabState?.orderId && approvedOrders.length > 0) {
      const orderId = String(paymentTabState.orderId);
      const order = approvedOrders.find(o => String(o.id || o.orderId) === orderId);

      if (order) {
        console.log('Opening payment modal for order:', orderId, 'Initial Amount:', paymentTabState.initialPaymentAmount);
        handleSelectOrderForPayment(order, paymentTabState.initialPaymentAmount);
      }
    }
  }, [paymentTabState, approvedOrders]);

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
      const amountToPay = paymentAmount > 0 ? paymentAmount : remainingAmount;
      const finalAmount = Math.round(amountToPay); // Ensure integer

      // Calculate percentage for backend reference
      const total = order.totalAmount || order.amount || 0;
      const percentage = total > 0 ? Math.round((finalAmount / total) * 100) : 0;

      const paymentData = {
        orderId: orderId,
        amount: finalAmount,
        paymentPercentage: percentage, // Send percentage just in case backend uses it
        orderType: 'billpayment' // Standard VNPay order type
      };

      console.log('Creating VNPay payment with data:', paymentData);
      const response = await paymentsAPI.createVNPayPayment(paymentData);

      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else if (response.error) {
        showErrorToast(`VNPay error: ${response.error}`);
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

  const handlePayInstallmentDetail = async (item) => {
    if (!selectedPaymentDetail) return;

    const orderId = selectedPaymentDetail.orderId || selectedPaymentDetail.order?.id || selectedPaymentDetail.order?.orderId;
    const scheduleId = item.id;
    const amount = item.amount;
    const paymentMethod = (selectedPaymentDetail.paymentMethod || 'VNPAY').toUpperCase();

    if (paymentMethod === 'VNPAY') {
      try {
        // Use the specific wrapper for installment payments
        const response = await paymentsAPI.createVNPayPaymentForInstallment(orderId, scheduleId, amount);
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else if (response.error) {
          showErrorToast(`VNPay error: ${response.error}`);
        } else {
          showErrorToast('Failed to create VNPay payment');
        }
      } catch (error) {
        console.error('Error creating VNPay payment for installment:', error);
        showErrorToast(handleAPIError(error));
      }
    } else {
      // Manual payment (Cash/Transfer)
      if (!window.confirm(`Confirm marking installment #${item.installmentNumber} as PAID?`)) return;

      try {
        await installmentsAPI.payInstallment(scheduleId);
        showSuccessToast('Installment marked as paid');

        // Refresh schedule in modal
        const schedule = await installmentsAPI.getByOrder(orderId);
        setDetailInstallmentSchedule(Array.isArray(schedule) ? schedule : []);

        // Also refresh main lists
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error paying installment:', error);
        showErrorToast(handleAPIError(error));
      }
    }
  };

  const handleSelectOrderForPayment = (order, initialAmount = null) => {
    setSelectedOrder(order);

    const totalAmount = order.totalAmount || order.amount || 0;
    const paidAmount = order.paidAmount || 0;
    const remainingAmount = order.remainingAmount ?? Math.max(totalAmount - paidAmount, 0);

    // Use initialAmount if provided, otherwise default to remainingAmount
    // Ensure we don't exceed remainingAmount
    let amount = initialAmount || remainingAmount;
    if (amount > remainingAmount) amount = remainingAmount;

    setPaymentAmount(Math.round(amount)); // Ensure integer
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

  const calculateInstallmentPreview = (totalAmount, months) => {
    if (!totalAmount || !months || months <= 0) return null;

    // Interest rate is always 0
    const monthlyPayment = totalAmount / months;
    const totalPayment = totalAmount;
    const totalInterest = 0;

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: 0,
      months
    };
  };

  const handleOpenInstallmentModal = async (payment) => {
    // Lấy orderId từ payment (installment schedule được lưu theo orderId, không phải paymentId)
    const orderId = payment.orderId || payment.order?.id || payment.order?.orderId;
    if (!orderId) {
      showErrorToast('Order ID không hợp lệ');
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
      formData.months
    );
    setInstallmentPreview(preview);

    try {
      setInstallmentLoading(true);
      // SỬA: Dùng orderId thay vì paymentId
      const schedule = await installmentsAPI.getByOrder(orderId);
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
    if (field === 'months') {
      const preview = calculateInstallmentPreview(
        selectedPaymentForInstallment?.amount || 0,
        value
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

    // Lấy orderId từ payment
    const orderId = selectedPaymentForInstallment.orderId ||
      selectedPaymentForInstallment.order?.id ||
      selectedPaymentForInstallment.order?.orderId;

    if (!orderId) {
      showErrorToast('Order ID không hợp lệ');
      return;
    }

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

    // Interest rate is always 0


    try {
      setInstallmentCreating(true);
      const request = {
        totalAmount: Number(totalAmount),
        months: Number(installmentForm.months),
        annualInterestRate: 0,
        firstDueDate: installmentForm.firstDueDate
      };

      // SỬA: Dùng orderId và request object với generate API
      await installmentsAPI.generate(orderId, request);
      showSuccessToast('Tạo kế hoạch trả góp thành công');

      // Refresh schedule
      const schedule = await installmentsAPI.getByOrder(orderId);
      setInstallmentSchedule(Array.isArray(schedule) ? schedule : []);
    } catch (error) {
      console.error('Error creating installment:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setInstallmentCreating(false);
    }
  };

  const handlePayInstallment = async (scheduleId, installmentItem = null) => {
    if (!scheduleId) {
      showErrorToast('Schedule ID không hợp lệ');
      return;
    }

    // Kiểm tra payment method
    const paymentMethod = (selectedPaymentForInstallment?.paymentMethod || 'VNPAY').toUpperCase();

    // Nếu là VNPay, tạo payment qua cổng VNPay
    if (paymentMethod === 'VNPAY') {
      try {
        const orderId = selectedPaymentForInstallment?.orderId ||
          selectedPaymentForInstallment?.order?.id ||
          selectedPaymentForInstallment?.order?.orderId;

        if (!orderId) {
          showErrorToast('Order ID không hợp lệ');
          return;
        }

        const amount = installmentItem?.amount || 0;
        if (amount <= 0) {
          showErrorToast('Số tiền không hợp lệ');
          return;
        }

        // Tạo VNPay payment cho installment
        const response = await paymentsAPI.createVNPayPaymentForInstallment(orderId, scheduleId, amount);

        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else if (response.error) {
          showErrorToast(`VNPay error: ${response.error}`);
        } else {
          showErrorToast('Không thể tạo thanh toán VNPay. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('Error creating VNPay payment for installment:', error);
        showErrorToast(handleAPIError(error));
      }
      return;
    }

    // Nếu là CASH/TRANSFER, chỉ cần đánh dấu đã trả
    try {
      await installmentsAPI.payInstallment(scheduleId);
      showSuccessToast('Đánh dấu kỳ trả góp đã thanh toán thành công');

      // Refresh schedule bằng orderId
      const orderId = selectedPaymentForInstallment?.orderId ||
        selectedPaymentForInstallment?.order?.id ||
        selectedPaymentForInstallment?.order?.orderId;
      if (orderId) {
        const schedule = await installmentsAPI.getByOrder(orderId);
        setInstallmentSchedule(Array.isArray(schedule) ? schedule : []);
        setRefreshTrigger(prev => prev + 1);
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

  const handleConfirmDelivery = async (payment) => {
    if (!payment) return;
    const orderId = payment.orderId || payment.order?.id || payment.order?.orderId;

    if (!orderId) {
      showErrorToast('Order ID không hợp lệ');
      return;
    }

    const confirmAction = window.confirm('Xác nhận đã giao xe cho khách và trừ tồn kho?');
    if (!confirmAction) return;

    setConfirmingDeliveryId(orderId);
    try {
      // Backend tự động xác định status dựa trên order status hiện tại:
      // - Nếu order status là APPROVED (chưa trả hết) → DELIVERED_APPROVED
      // - Nếu order status là COMPLETED (đã trả hết) → DELIVERED
      await ordersAPI.confirmDelivery(orderId);
      showSuccessToast('Đã xác nhận giao xe và trừ kho');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error confirming delivery:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setConfirmingDeliveryId(null);
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
          <h3 style={{ marginBottom: '24px' }}>Orders - Ready for Payment</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Hiển thị orders đã approved hoặc orders đã có payment (kể cả chưa approve)
          </p>
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
                        {(status === 'PENDING' || status === 'pending' || status === 'UNPAID' || status === 'unpaid') && (() => {
                          const paymentMethod = (payment.paymentMethod || 'VNPAY').toUpperCase();
                          const orderId = payment.orderId;

                          // VNPay: Chỉ hiển thị nút "Pay" nếu là đơn trả 100%
                          if (paymentMethod === 'VNPAY') {
                            // Kiểm tra xem có phải trả 100% không
                            const order = findOrderForPayment(payment);
                            const totalAmount = order?.totalAmount || order?.amount || 0;
                            const paymentAmount = payment.amount || 0;
                            const paymentPercentage = totalAmount > 0 && paymentAmount > 0
                              ? Math.round((paymentAmount / totalAmount) * 100)
                              : payment.percentage || payment.paymentPercentage || 0;

                            // Chỉ hiển thị nút "Pay" nếu là trả 100%
                            if (paymentPercentage === 100) {
                              return (
                                <button
                                  className="btn btn-primary"
                                  style={{ fontSize: '12px' }}
                                  onClick={async () => {
                                    try {
                                      const paymentData = { orderId };
                                      const response = await paymentsAPI.createVNPayPayment(paymentData);

                                      if (response.paymentUrl) {
                                        window.location.href = response.paymentUrl;
                                      } else if (response.error) {
                                        showErrorToast(`VNPay error: ${response.error}`);
                                      } else {
                                        showErrorToast('Failed to create VNPay payment. Please try again.');
                                      }
                                    } catch (error) {
                                      console.error('Error creating VNPay payment:', error);
                                      showErrorToast(handleAPIError(error));
                                    }
                                  }}
                                >
                                  <i className="bx bx-credit-card" style={{ marginRight: '4px' }}></i>
                                  Thanh toán VNPay
                                </button>
                              );
                            }
                            // Nếu là trả góp (không phải 100%), không hiển thị nút ở đây
                            // Sẽ hiển thị nút "Trả góp" khi status là COMPLETED
                            return null;
                          }

                          // CASH/TRANSFER: Nút đánh dấu đã trả
                          if (paymentMethod === 'CASH' || paymentMethod === 'TRANSFER') {
                            return (
                              <button
                                className="btn btn-primary"
                                style={{ fontSize: '12px' }}
                                onClick={async () => {
                                  if (!window.confirm('Xác nhận đã nhận thanh toán?')) {
                                    return;
                                  }

                                  try {
                                    // Tìm order để lấy totalAmount
                                    const order = findOrderForPayment(payment);
                                    const totalAmount = order?.totalAmount || order?.amount || payment.amount || 0;
                                    const paymentAmount = payment.amount || 0;

                                    // Tính paymentPercentage dựa trên amount
                                    let paymentPercentage = 100;
                                    if (totalAmount > 0 && paymentAmount > 0) {
                                      paymentPercentage = Math.round((paymentAmount / totalAmount) * 100);
                                    } else if (payment.percentage) {
                                      paymentPercentage = payment.percentage;
                                    }

                                    // Tạo payment record với status COMPLETED
                                    const paymentData = {
                                      paymentMethod: paymentMethod,
                                      paymentPercentage: paymentPercentage,
                                      paymentNotes: 'Đánh dấu đã trả từ payment list'
                                    };

                                    await paymentsAPI.createDealerWorkflowPayment(orderId, paymentData);
                                    showSuccessToast('Đã đánh dấu thanh toán thành công');
                                    setRefreshTrigger(prev => prev + 1);
                                  } catch (error) {
                                    console.error('Error marking payment as paid:', error);
                                    showErrorToast(handleAPIError(error));
                                  }
                                }}
                              >
                                <i className="bx bx-check" style={{ marginRight: '4px' }}></i>
                                Đánh dấu đã trả
                              </button>
                            );
                          }

                          // Fallback: Mở modal payment
                          return (
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
                          );
                        })()}
                        {(status === 'COMPLETED' || status === 'completed') && (() => {
                          // Kiểm tra xem payment có phải là 100% hay không
                          const order = findOrderForPayment(payment);
                          const totalAmount = order?.totalAmount || order?.amount || 0;
                          const paidAmount = order?.paidAmount || 0;
                          const remainingAmount = order?.remainingAmount ?? Math.max(totalAmount - paidAmount, 0);
                          const paymentAmount = payment.amount || 0;
                          const paymentPercentage = totalAmount > 0 && paymentAmount > 0
                            ? Math.round((paymentAmount / totalAmount) * 100)
                            : payment.percentage || payment.paymentPercentage || 0;
                          const paymentMethod = (payment.paymentMethod || 'VNPAY').toUpperCase();

                          // Nếu là VNPay 100% và đã trả hết: hiển thị nút "Giao xe"
                          if (paymentPercentage === 100 && paymentMethod === 'VNPAY' && remainingAmount === 0) {
                            // Chỉ hiển thị nút "Giao xe" cho DEALER_STAFF và DEALER_MANAGER
                            const normalizedRole = (userRole || '').toUpperCase();
                            if (!['DEALER_STAFF', 'DEALER_MANAGER'].includes(normalizedRole)) {
                              return null;
                            }

                            // Kiểm tra xem order đã được giao chưa
                            const orderStatus = (
                              order?.normalizedStatus ||
                              order?.status ||
                              order?.orderStatus ||
                              order?.workflowStatus ||
                              ''
                            ).toUpperCase();

                            const isDelivered =
                              orderStatus.includes('DELIVERED') ||
                              (order?.deliveryStatus && String(order.deliveryStatus).toUpperCase().includes('DELIVERED'));

                            // Kiểm tra order đã approved chưa
                            const isApproved = orderStatus.includes('APPROVED') || orderStatus.includes('COMPLETED');

                            // Nếu chưa giao và đã approved, hiển thị nút "Giao xe"
                            if (!isDelivered && isApproved) {
                              return (
                                <button
                                  className="btn btn-primary"
                                  style={{ fontSize: '12px' }}
                                  onClick={() => handleConfirmDelivery(payment)}
                                  disabled={confirmingDeliveryId === (order?.orderId || order?.id)}
                                  title="Xác nhận giao xe và trừ kho"
                                >
                                  <i className="bx bx-car" style={{ marginRight: '4px' }}></i>
                                  {confirmingDeliveryId === (order?.orderId || order?.id) ? 'Đang giao...' : 'Giao xe'}
                                </button>
                              );
                            }
                            // Nếu đã giao rồi hoặc chưa approved, không hiển thị nút
                            return null;
                          }

                          // Nếu là VNPay và còn nợ: hiển thị nút "Pay" để thanh toán phần còn lại
                          // Cho phép thanh toán kể cả khi không phải 100% (ví dụ trả trước 30% rồi muốn trả nốt)
                          if (paymentMethod === 'VNPAY' && remainingAmount > 0) {
                            return (
                              <button
                                className="btn btn-primary"
                                style={{ fontSize: '12px' }}
                                onClick={async () => {
                                  try {
                                    const orderId = payment.orderId;
                                    // Explicitly send the remaining amount to pay
                                    const paymentData = {
                                      orderId,
                                      amount: remainingAmount
                                    };
                                    const response = await paymentsAPI.createVNPayPayment(paymentData);

                                    if (response.paymentUrl) {
                                      window.location.href = response.paymentUrl;
                                    } else if (response.error) {
                                      showErrorToast(`VNPay error: ${response.error}`);
                                    } else {
                                      showErrorToast('Failed to create VNPay payment. Please try again.');
                                    }
                                  } catch (error) {
                                    console.error('Error creating VNPay payment:', error);
                                    showErrorToast(handleAPIError(error));
                                  }
                                }}
                              >
                                <i className="bx bx-credit-card" style={{ marginRight: '4px' }}></i>
                                Pay Remaining
                              </button>
                            );
                          }

                          // Nếu không phải 100% (trả góp): hiển thị nút trả góp CHỈ KHI CÒN NỢ
                          // Trong modal trả góp sẽ có nút "Pay with VNPay" cho từng kỳ nếu payment method là VNPay
                          if (remainingAmount > 0) {
                            return (
                              <button
                                className="btn btn-outline"
                                style={{ fontSize: '12px' }}
                                onClick={() => handleOpenInstallmentModal(payment)}
                                title="Tạo hoặc xem kế hoạch trả góp"
                              >
                                <i className="bx bx-calendar" style={{ marginRight: '4px' }}></i>
                                Trả góp
                              </button>
                            );
                          }
                          return null;
                        })()}

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
              <strong>Payment Amount:</strong> ${paymentAmount.toLocaleString()}
              <div style={{ marginTop: '8px', fontSize: '12px', opacity: '0.9' }}>
                VNPay will process payment for this amount.
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
                  {/* Interest rate input removed as requested */}
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
                        const scheduleId = item.id; // SỬA: Dùng item.id (scheduleId) thay vì transactionId
                        const isPaid = status === 'PAID';
                        const dueDate = item.dueDate ? new Date(item.dueDate) : null;
                        const isOverdue = dueDate && !isPaid && dueDate < new Date();
                        const paymentMethod = (selectedPaymentForInstallment?.paymentMethod || 'VNPAY').toUpperCase();

                        return (
                          <tr key={scheduleId || index} style={{
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
                              ) : paymentMethod === 'VNPAY' ? (
                                <button
                                  className="btn btn-primary"
                                  style={{ fontSize: '12px' }}
                                  onClick={() => handlePayInstallment(scheduleId, item)}
                                >
                                  <i className="bx bx-credit-card" style={{ marginRight: '4px' }}></i>
                                  Pay with VNPay
                                </button>
                              ) : (
                                <button
                                  className="btn btn-primary"
                                  style={{ fontSize: '12px' }}
                                  onClick={() => handlePayInstallment(scheduleId, item)}
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
      {/* Payment Detail Modal */}
      {showDetailModal && selectedPaymentDetail && (
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
                    return dateStr ? new Date(dateStr).toLocaleString('vi-VN') : 'N/A';
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
                          <td style={{ padding: '10px' }}>{new Date(item.dueDate).toLocaleDateString('vi-VN')}</td>
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
                            {item.status !== 'PAID' && (
                              <button
                                className="btn btn-primary"
                                style={{ fontSize: '11px', padding: '4px 8px', height: 'auto' }}
                                onClick={() => handlePayInstallmentDetail(item)}
                              >
                                {(selectedPaymentDetail.paymentMethod || 'VNPAY').toUpperCase() === 'VNPAY'
                                  ? 'Pay with VNPay'
                                  : 'Mark as Paid'}
                              </button>
                            )}
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
      )}
    </div>
  );
};

export default PaymentManagement;