import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ordersAPI } from '../../utils/api/ordersAPI';
import { quotesAPI } from '../../utils/api/quotesAPI';
import { installmentsAPI } from '../../utils/api/installmentsAPI';
import { customersAPI } from '../../utils/api/customersAPI';
import { vehiclesAPI } from '../../utils/api/vehiclesAPI';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const coalesceText = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
};

const composeFullName = (data) => {
  if (!data || typeof data !== 'object') return '';
  const parts = [
    data.fullName,
    data.fullname,
    data.full_name,
    data.displayName,
    data.display_name,
    data.name,
    data.customerName,
    data.customerFullName,
    data.customer_full_name,
  ];

  for (const part of parts) {
    if (typeof part === 'string' && part.trim().length > 0) {
      return part.trim();
    }
  }

  const firstName =
    data.firstName ||
    data.firstname ||
    data.first_name ||
    data.givenName ||
    data.given_name ||
    '';
  const lastName =
    data.lastName ||
    data.lastname ||
    data.last_name ||
    data.familyName ||
    data.family_name ||
    '';

  const resolved = [firstName, lastName].map((val) => (typeof val === 'string' ? val.trim() : '')).filter(Boolean);
  return resolved.join(' ');
};

const ensureObject = (value) => (value && typeof value === 'object' ? value : null);

const normalizeOrder = (order) => {
  if (!order || typeof order !== 'object') return null;

  const resolvedCustomer =
    ensureObject(order.customer) ||
    ensureObject(order.customerInfo) ||
    ensureObject(order.customerDetails) ||
    ensureObject(order.customerData) ||
    ensureObject(order.customerResponse) ||
    ensureObject(order.customerDto) ||
    ensureObject(order.quote?.customer);

  const resolvedVehicle =
    ensureObject(order.vehicle) ||
    ensureObject(order.vehicleInfo) ||
    ensureObject(order.vehicleDetails) ||
    ensureObject(order.vehicleData) ||
    ensureObject(order.vehicleResponse) ||
    ensureObject(order.vehicleDto) ||
    ensureObject(order.quote?.vehicle);

  const primaryOrderDetail = Array.isArray(order.orderDetails) && order.orderDetails.length > 0 ? order.orderDetails[0] : null;
  const detailVehicle =
    ensureObject(primaryOrderDetail?.vehicle) ||
    (primaryOrderDetail?.vehicleInfo && ensureObject(primaryOrderDetail.vehicleInfo)) ||
    (primaryOrderDetail?.vehicleDetails && ensureObject(primaryOrderDetail.vehicleDetails)) ||
    null;

  const detailVehicleName = coalesceText(
    primaryOrderDetail?.vehicleName,
    primaryOrderDetail?.vehicle?.name,
    primaryOrderDetail?.vehicle?.modelName,
    primaryOrderDetail?.vehicleDisplayName,
    primaryOrderDetail?.vehicleDescription,
    detailVehicle?.name,
    detailVehicle?.modelName,
    detailVehicle?.vehicleName,
    detailVehicle?.displayName
  );

  const quoteInfo = ensureObject(order.quote);
  const quoteDetails = Array.isArray(quoteInfo?.quoteDetails) ? quoteInfo.quoteDetails : [];
  const primaryQuoteDetail = quoteDetails.length > 0 ? quoteDetails[0] : null;
  const quoteDetailVehicle =
    ensureObject(primaryQuoteDetail?.vehicle) ||
    ensureObject(primaryQuoteDetail?.vehicleInfo) ||
    ensureObject(primaryQuoteDetail?.vehicleDetails) ||
    null;
  const quoteVehicle =
    ensureObject(quoteInfo?.vehicle) ||
    quoteDetailVehicle;

  const quoteVehicleName = coalesceText(
    quoteInfo?.vehicleName,
    quoteVehicle?.name,
    quoteVehicle?.model,
    quoteVehicle?.modelName,
    quoteVehicle?.vehicleName,
    quoteVehicle?.displayName,
    quoteVehicle?.title,
    quoteVehicle?.variantName,
    primaryQuoteDetail?.vehicleName,
    primaryQuoteDetail?.vehicleModel,
    primaryQuoteDetail?.vehicleDisplayName,
    primaryQuoteDetail?.vehicleDescription
  );

  const quoteVehicleId =
    quoteVehicle?.id ||
    quoteVehicle?.vehicleId ||
    quoteVehicle?.vehicleID ||
    primaryQuoteDetail?.vehicleId ||
    quoteInfo?.vehicleId ||
    quoteInfo?.vehicleID;

  const customerName =
    coalesceText(
      order.customerName,
      order.customerFullname,
      order.customerFullName,
      order.customer_full_name,
      composeFullName(resolvedCustomer),
      composeFullName(order.customer),
      composeFullName(order.customerInfo),
      composeFullName(order.customerDetails),
      composeFullName(order.customerData),
      composeFullName(order.customerResponse),
      composeFullName(order.customerDto),
      composeFullName(order.customer?.user),
      composeFullName(order.customerInfo?.user),
      composeFullName(order.customerDetails?.user),
      composeFullName(order.customerData?.user),
      resolvedCustomer?.contactName,
      resolvedCustomer?.customerName,
      resolvedCustomer?.customerFullName,
      order.customerEmail
    ) || (order.customerId ? `Customer #${order.customerId}` : 'Customer N/A');

  const vehicleName =
    coalesceText(
      order.vehicleName,
      order.vehicleDisplay,
      order.vehicleModel,
      order.vehicleDisplayName,
      order.vehicleDescription,
      order.vehicleVariant,
      order.vehicle?.vehicleName,
      order.vehicle?.vehicleModel,
      order.vehicle?.modelDisplayName,
      order.vehicle?.model_name,
      order.vehicle?.model,
      order.vehicle?.modelName,
      order.vehicle?.name,
      order.vehicle?.title,
      order.vehicle?.displayName,
      order.vehicle?.display_name,
      order.vehicle?.vehicleTitle,
      // Kết hợp brand và modelName nếu có
      order.vehicle?.brand && order.vehicle?.modelName 
        ? `${order.vehicle.brand} ${order.vehicle.modelName}`
        : null,
      order.vehicle?.brand && order.vehicle?.name
        ? `${order.vehicle.brand} ${order.vehicle.name}`
        : null,
      order.vehicleInfo?.name,
      order.vehicleInfo?.modelName,
      order.vehicleInfo?.vehicleName,
      order.vehicleInfo?.brand && order.vehicleInfo?.modelName
        ? `${order.vehicleInfo.brand} ${order.vehicleInfo.modelName}`
        : null,
      order.vehicleDetails?.name,
      order.vehicleDetails?.modelName,
      order.vehicleDto?.name,
      order.vehicleDto?.modelName,
      order.vehicleResponse?.name,
      order.vehicleResponse?.modelName,
      order.vehicleResponse?.vehicleName,
      resolvedVehicle?.name,
      resolvedVehicle?.modelName,
      resolvedVehicle?.model,
      resolvedVehicle?.vehicleName,
      resolvedVehicle?.displayName,
      resolvedVehicle?.title,
      resolvedVehicle?.brand && resolvedVehicle?.modelName
        ? `${resolvedVehicle.brand} ${resolvedVehicle.modelName}`
        : null,
      quoteVehicleName
    ) ||
    detailVehicleName ||
    (order.vehicleId ? `Vehicle #${order.vehicleId}` : '') ||
    (quoteVehicleId ? `Vehicle #${quoteVehicleId}` : 'Vehicle N/A');

  const orderIdValue = order.orderId ?? order.id;
  const orderNumber =
    coalesceText(
      order.orderNumber,
      order.orderCode,
      order.orderReference,
      order.orderRef,
      order.referenceCode,
      order.referenceNumber,
      orderIdValue
    ) || (orderIdValue ? `ORD-${orderIdValue}` : '');

  const paymentMethodRaw = coalesceText(
    order.paymentMethod,
    order.paymentType,
    order.paymentMethodName,
    order.payment?.method,
    order.paymentInfo?.method
  );

  const approvalStatus = (order.approvalStatus || order.orderApprovalStatus || order.workflowStatus || '').toUpperCase();
  const status = (order.status || order.orderStatus || '').toUpperCase();

  return {
    ...order,
    resolvedCustomer:
      resolvedCustomer ||
      (order.customerId
        ? { id: order.customerId, fullName: customerName }
        : null),
    resolvedVehicle:
      resolvedVehicle ||
      (order.vehicleId
        ? { id: order.vehicleId, name: vehicleName }
        : quoteVehicleId
        ? { id: quoteVehicleId, name: vehicleName }
        : null),
    displayCustomerName: customerName,
    displayVehicleName: vehicleName,
    displayOrderNumber: orderNumber || 'N/A',
    displayPaymentMethod: paymentMethodRaw ? paymentMethodRaw.toUpperCase() : 'N/A',
    normalizedApprovalStatus: approvalStatus,
    normalizedStatus: status,
  };
};

const normalizeOrdersList = (data) =>
  Array.isArray(data) ? data.map(normalizeOrder).filter(Boolean) : [];

const extractOrderTimestamp = (order) => {
  if (!order) return 0;
  const candidates = [
    order.createdDate,
    order.createdAt,
    order.creationDate,
    order.created_on,
    order.createdOn,
    order.orderDate,
    order.orderedAt,
    order.updatedDate,
    order.updatedAt,
    order.approvedDate,
    order.approvedAt,
    order.deliveryDate,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const time = new Date(candidate).getTime();
    if (!Number.isNaN(time)) {
      return time;
    }
  }

  const numericFallback = Number(order.orderId ?? order.id ?? 0);
  return Number.isNaN(numericFallback) ? 0 : numericFallback;
};

const sortOrdersByNewest = (list = []) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => extractOrderTimestamp(b) - extractOrderTimestamp(a));
};

const INSTALLMENT_MONTH_OPTIONS = [3, 6, 9, 12];
const ORDERS_PER_PAGE = 5;

const addDaysToDateString = (dateString, days) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const normalizeDateInput = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.trim().length === 0) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const computeDefaultFirstDueDate = (orderDate, deliveryDate, fallbackDate) => {
  const normalizedDelivery = normalizeDateInput(deliveryDate);
  if (normalizedDelivery) return normalizedDelivery;

  const normalizedFallback = normalizeDateInput(fallbackDate);
  if (normalizedFallback) return normalizedFallback;

  const normalizedOrder = normalizeDateInput(orderDate);
  if (normalizedOrder) return addDaysToDateString(normalizedOrder, 30);
  return '';
};

const formatCurrency = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `$${value.toLocaleString()}`;
};

const normalizePossibleId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'object') {
    const candidates = [
      value.id,
      value.ID,
      value.userId,
      value.userID,
      value.user?.id,
      value.user?.userId,
      value.ownerId,
      value.owner?.id,
    ];
    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null && candidate !== '') {
        return candidate;
      }
    }
    return null;
  }
  return value;
};

const getQuoteIdentifier = (quote) => {
  if (!quote || typeof quote !== 'object') return null;
  const candidates = [
    quote.quoteId,
    quote.id,
    quote.quoteID,
    quote.idQuote,
    quote.workflowQuoteId,
  ];
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== '') {
      return String(candidate);
    }
  }
  return null;
};

const getQuoteOwnerId = (quote) => {
  if (!quote || typeof quote !== 'object') return null;
  const candidates = [
    quote.userId,
    quote.user?.id,
    quote.user?.userId,
    quote.createdById,
    quote.createdBy,
    quote.createdBy?.id,
    quote.createdBy?.userId,
    quote.ownerId,
    quote.owner?.id,
    quote.owner?.userId,
    quote.managerId,
    quote.manager?.id,
  ];
  for (const candidate of candidates) {
    const normalized = normalizePossibleId(candidate);
    if (normalized !== null) {
      return normalized;
    }
  }
  return null;
};

const getQuoteCreatorRole = (quote) => {
  const role =
    quote?.creatorRole ||
    quote?.createdByRole ||
    quote?.createdBy?.role ||
    quote?.creator?.role ||
    quote?.ownerRole;
  return typeof role === 'string' ? role.toUpperCase() : '';
};

const isQuoteApprovedForOrder = (quote) => {
  if (!quote || typeof quote !== 'object') return false;
  const approvalStatus = (quote.approvalStatus || quote.workflowStatus || '').toUpperCase();
  const status = (quote.status || '').toUpperCase();
  const readyFlag = quote.readyForOrder === true || quote.readyForOrder === 'true';
  const canCreateFlag = quote.canCreateOrder === true || quote.canCreateOrder === 'true';
  return (
    readyFlag ||
    canCreateFlag ||
    approvalStatus === 'APPROVED' ||
    approvalStatus === 'EVM_APPROVED' ||
    (approvalStatus === 'APPROVED' && (status === 'ACCEPTED' || status === 'APPROVED' || status === 'READY'))
  );
};

const shouldUseEVMWorkflowForQuote = (quote) => getQuoteCreatorRole(quote) === 'DEALER_MANAGER';

const orderFormGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
};

const orderFormFullWidthStyle = {
  gridColumn: '1 / -1',
};

const orderSummaryCardStyle = {
  marginBottom: '16px',
  padding: '16px',
  borderRadius: 'calc(var(--radius) * 1.2)',
  background: 'var(--color-surface)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 18px 36px rgba(15, 23, 42, 0.22)',
};

const installmentPreviewCardStyle = {
  marginTop: '12px',
  padding: '16px',
  borderRadius: 'calc(var(--radius) * 1.1)',
  background: 'var(--color-bg)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
};

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
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState('');
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderDetailBase, setOrderDetailBase] = useState(null);
  const [selectedInstallmentMonths, setSelectedInstallmentMonths] = useState(12);
  const [installmentPreview, setInstallmentPreview] = useState(null);
  const [installmentPreviewLoading, setInstallmentPreviewLoading] = useState(false);
  const [installmentPreviewError, setInstallmentPreviewError] = useState('');
  const [installmentFirstDueDate, setInstallmentFirstDueDate] = useState('');
  const [customerLookup, setCustomerLookup] = useState({});
  const [vehicleLookup, setVehicleLookup] = useState({});
  const [quoteLookup, setQuoteLookup] = useState({});
  const pendingQuoteIdsRef = useRef(new Set());

  // 1. THÊM STATE CHO TAB MỚI
  // 'all_dealer' (tất cả orders của dealer), 'my_orders' (chính manager tạo), 'staff_orders' (staff tạo)
  const [tabFilter, setTabFilter] = useState('all_dealer'); 
  const [currentPage, setCurrentPage] = useState(1);
  
  const userRole = user?.role?.toUpperCase().replace(/-/g, '_');
  const userId = user?.id || user?.userId || user?.user?.id;
  const userDealerId = user?.dealerId || user?.user?.dealerId;

  const resolveLookupCustomer = useCallback(
    (order) => {
      if (!order || !customerLookup || Object.keys(customerLookup).length === 0) return null;
      const candidateIds = new Set();

      const pushId = (value) => {
        if (value === undefined || value === null || value === '') return;
        candidateIds.add(String(value));
      };

      const collectFromObject = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        pushId(obj.id);
        pushId(obj.customerId);
        pushId(obj.customerID);
        pushId(obj.userId);
        pushId(obj.user?.id);
        pushId(obj.user?.userId);
      };

      pushId(order.customerId);
      collectFromObject(order.customer);
      collectFromObject(order.customerInfo);
      collectFromObject(order.customerDetails);
      collectFromObject(order.customerData);
      collectFromObject(order.customerResponse);
      collectFromObject(order.customerDto);
      collectFromObject(order.resolvedCustomer);
      collectFromObject(order.quote?.customer);

      const primaryDetail = Array.isArray(order.orderDetails) && order.orderDetails.length > 0 ? order.orderDetails[0] : null;
      if (primaryDetail) {
        collectFromObject(primaryDetail.customer);
        pushId(primaryDetail.customerId);
      }

      for (const id of candidateIds) {
        if (customerLookup[id]) {
          return customerLookup[id];
        }
      }

      return null;
    },
    [customerLookup]
  );

  const resolveLookupVehicle = useCallback(
    (order) => {
      if (!order) return null;
      const hasVehicleLookup = vehicleLookup && Object.keys(vehicleLookup).length > 0;
      const hasQuoteLookup = quoteLookup && Object.keys(quoteLookup).length > 0;
      if (!hasVehicleLookup && !hasQuoteLookup) return null;
      const candidateIds = new Set();

      const pushId = (value) => {
        if (value === undefined || value === null || value === '') return;
        candidateIds.add(String(value));
      };

      const collectFromObject = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        pushId(obj.id);
        pushId(obj.vehicleId);
        pushId(obj.vehicleID);
        pushId(obj.inventoryId);
        pushId(obj.inventory?.id);
      };

      pushId(order.vehicleId);
      pushId(order.quote?.vehicleId);
      pushId(order.quote?.vehicleID);
      collectFromObject(order.vehicle);
      collectFromObject(order.vehicleInfo);
      collectFromObject(order.vehicleDetails);
      collectFromObject(order.vehicleData);
      collectFromObject(order.vehicleResponse);
      collectFromObject(order.vehicleDto);
      collectFromObject(order.resolvedVehicle);
      collectFromObject(order.quote?.vehicle);

      const primaryDetail = Array.isArray(order.orderDetails) && order.orderDetails.length > 0 ? order.orderDetails[0] : null;
      if (primaryDetail) {
        pushId(primaryDetail.vehicleId);
        collectFromObject(primaryDetail.vehicle);
        collectFromObject(primaryDetail.vehicleInfo);
        collectFromObject(primaryDetail.vehicleDetails);
      }

      const quoteId =
        order.quoteId ||
        order.quote?.quoteId ||
        order.quote?.id ||
        order.quote?.quoteID ||
        null;

      if (quoteId) {
        const resolvedQuote = quoteLookup?.[String(quoteId)];
        if (resolvedQuote) {
          pushId(resolvedQuote.vehicleId);
          pushId(resolvedQuote.vehicleID);
          collectFromObject(resolvedQuote.vehicle);

          const quoteDetails = Array.isArray(resolvedQuote.quoteDetails) ? resolvedQuote.quoteDetails : [];
          const quotePrimaryDetail = quoteDetails.length > 0 ? resolvedQuote.quoteDetails[0] : null;
          if (quotePrimaryDetail) {
            pushId(quotePrimaryDetail.vehicleId);
            collectFromObject(quotePrimaryDetail.vehicle);
            collectFromObject(quotePrimaryDetail.vehicleInfo);
            collectFromObject(quotePrimaryDetail.vehicleDetails);
          }
        }
      }

      for (const id of candidateIds) {
        if (vehicleLookup && vehicleLookup[id]) {
          return vehicleLookup[id];
        }
      }

      if (quoteId) {
        const quoteVehicleFallback = quoteLookup?.[String(quoteId)]?.vehicle;
        if (quoteVehicleFallback) {
          return ensureObject(quoteVehicleFallback);
        }
      }

      return null;  
    },
    [vehicleLookup, quoteLookup]
  );

  const resolveVehicleTypeName = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const candidates = [
        value.typeName,
        value.name,
        value.displayName,
        value.description,
        value.title,
      ].filter(Boolean);
      if (candidates.length > 0) {
        return candidates[0];
      }
      if (value.id !== undefined && value.id !== null) {
        return `Vehicle Type #${value.id}`;
      }
    }
    return null;
  };

  const getVehicleTypeLabelFromOrder = (order) => {
    if (!order) return null;
    const candidateSources = [];

    if (order.resolvedVehicle) {
      candidateSources.push(order.resolvedVehicle.vehicleType);
      candidateSources.push(order.resolvedVehicle.type);
      candidateSources.push(order.resolvedVehicle.vehicleCategory);
    }

    if (Array.isArray(order.orderDetails) && order.orderDetails.length > 0) {
      const detail = order.orderDetails[0];
      candidateSources.push(detail.vehicleType);
      candidateSources.push(detail.vehicle?.vehicleType);
      candidateSources.push(detail.vehicle?.type);
    }

    const quoteData = order.quoteData || order.quote;
    if (quoteData) {
      candidateSources.push(quoteData.vehicleType);
      if (Array.isArray(quoteData.quoteDetails) && quoteData.quoteDetails.length > 0) {
        const quoteDetail = quoteData.quoteDetails[0];
        candidateSources.push(quoteDetail.vehicleType);
        candidateSources.push(quoteDetail.vehicle?.vehicleType);
      }
    }

    for (const source of candidateSources) {
      const label = resolveVehicleTypeName(source);
      if (label) return label;
    }

    return null;
  };

  const enhancedOrders = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) return [];
    return orders.map((order) => {
      const lookupCustomer = resolveLookupCustomer(order);
      const lookupVehicle = resolveLookupVehicle(order);

      const quoteIdForLookup =
        order.quoteId ||
        order.quote?.quoteId ||
        order.quote?.id ||
        order.quote?.quoteID ||
        null;
      const quoteData = quoteIdForLookup ? quoteLookup?.[String(quoteIdForLookup)] : null;
      const quoteDetails = Array.isArray(quoteData?.quoteDetails) ? quoteData.quoteDetails : [];
      const quotePrimaryDetail = quoteDetails.length > 0 ? quoteData.quoteDetails[0] : null;
      const quoteVehicleCandidate = ensureObject(
        quoteData?.vehicle ||
          quotePrimaryDetail?.vehicle ||
          quotePrimaryDetail?.vehicleInfo ||
          quotePrimaryDetail?.vehicleDetails
      );
      const quoteVehicleId =
        quoteData?.vehicleId ||
        quoteData?.vehicleID ||
        quoteVehicleCandidate?.id ||
        quotePrimaryDetail?.vehicleId ||
        null;
      const quoteVehicleNameFromLookup = quoteData
        ? coalesceText(
            quoteData.vehicleName,
            quoteVehicleCandidate?.name,
            quoteVehicleCandidate?.model,
            quoteVehicleCandidate?.modelName,
            quoteVehicleCandidate?.vehicleName,
            quoteVehicleCandidate?.displayName,
            quoteVehicleCandidate?.title,
            quoteVehicleCandidate?.variantName,
            // Kết hợp brand và modelName nếu có
            quoteVehicleCandidate?.brand && quoteVehicleCandidate?.modelName 
              ? `${quoteVehicleCandidate.brand} ${quoteVehicleCandidate.modelName}`
              : null,
            quoteVehicleCandidate?.brand && quoteVehicleCandidate?.name
              ? `${quoteVehicleCandidate.brand} ${quoteVehicleCandidate.name}`
              : null,
            quotePrimaryDetail?.vehicleName,
            quotePrimaryDetail?.vehicleModel,
            quotePrimaryDetail?.vehicleDisplayName,
            quotePrimaryDetail?.vehicleDescription
          )
        : '';

      const displayCustomerName = lookupCustomer
        ? composeFullName(lookupCustomer) || lookupCustomer.email || lookupCustomer.phone || order.displayCustomerName
        : order.displayCustomerName;

      // Lấy vehicle từ orderDetails nếu có
      const primaryOrderDetail = Array.isArray(order.orderDetails) && order.orderDetails.length > 0 ? order.orderDetails[0] : null;
      const orderDetailVehicle = primaryOrderDetail?.vehicle || primaryOrderDetail?.vehicleInfo || primaryOrderDetail?.vehicleDetails;
      const orderDetailVehicleName = orderDetailVehicle
        ? coalesceText(
            orderDetailVehicle.name,
            orderDetailVehicle.model,
            orderDetailVehicle.modelName,
            orderDetailVehicle.vehicleName,
            orderDetailVehicle.displayName,
            orderDetailVehicle.title,
            orderDetailVehicle.variantName,
            // Kết hợp brand và modelName nếu có
            orderDetailVehicle.brand && orderDetailVehicle.modelName 
              ? `${orderDetailVehicle.brand} ${orderDetailVehicle.modelName}`
              : null,
            orderDetailVehicle.brand && orderDetailVehicle.name
              ? `${orderDetailVehicle.brand} ${orderDetailVehicle.name}`
              : null,
            primaryOrderDetail?.vehicleName,
            primaryOrderDetail?.vehicleModel,
            primaryOrderDetail?.vehicleDisplayName
          )
        : null;

      let displayVehicleName = lookupVehicle
        ? coalesceText(
            lookupVehicle.name,
            lookupVehicle.model,
            lookupVehicle.modelName,
            lookupVehicle.vehicleName,
            lookupVehicle.displayName,
            lookupVehicle.title,
            lookupVehicle.variantName,
            // Kết hợp brand và modelName nếu có
            lookupVehicle.brand && lookupVehicle.modelName 
              ? `${lookupVehicle.brand} ${lookupVehicle.modelName}`
              : null,
            lookupVehicle.brand && lookupVehicle.name
              ? `${lookupVehicle.brand} ${lookupVehicle.name}`
              : null
          ) || order.displayVehicleName
        : order.displayVehicleName;

      // Ưu tiên: orderDetailVehicleName > quoteVehicleNameFromLookup > displayVehicleName
      if (!displayVehicleName || displayVehicleName.includes('Vehicle N/A')) {
        displayVehicleName =
          orderDetailVehicleName ||
          quoteVehicleNameFromLookup ||
          displayVehicleName ||
          (quoteVehicleId ? `Vehicle #${quoteVehicleId}` : displayVehicleName);
      }

      const resolvedCustomer = order.resolvedCustomer || (lookupCustomer ? { ...lookupCustomer } : order.resolvedCustomer);
      
      // Ưu tiên: orderDetailVehicle > lookupVehicle > quoteVehicleCandidate > order.resolvedVehicle
      const resolvedVehicle =
        orderDetailVehicle ||
        order.resolvedVehicle ||
        (lookupVehicle ? { ...lookupVehicle } : null) ||
        (quoteVehicleCandidate ? { ...quoteVehicleCandidate } : null);

      return {
        ...order,
        displayCustomerName,
        displayVehicleName,
        resolvedCustomer,
        resolvedVehicle,
        quoteData: quoteData || order.quote,
      };
    });
  }, [orders, resolveLookupCustomer, resolveLookupVehicle, quoteLookup]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(enhancedOrders) || enhancedOrders.length === 0) {
      return [];
    }

    const loweredSearch = searchTerm.trim().toLowerCase();
    const normalizedUserId = userId !== undefined && userId !== null ? String(userId) : '';

    const statusGroups = {
      pending: ['pending', 'await', 'wait', 'review', 'processing', 'in_progress', 'submitted', 'under_review'],
      approved: ['approved', 'accepted', 'confirmed'],
      rejected: ['rejected', 'declined', 'denied', 'cancelled', 'canceled'],
      delivered: ['delivered', 'completed', 'fulfilled', 'shipped', 'closed'],
    };

    const matchStatusFilter = (order) => {
      if (filterStatus === 'all') return true;
      const keywords = statusGroups[filterStatus];
      if (!keywords || keywords.length === 0) return true;

      const statusCandidates = [
        order.normalizedStatus,
        order.status,
        order.orderStatus,
        order.workflowStatus,
        order.deliveryStatus,
      ];
      const approvalCandidates = [
        order.normalizedApprovalStatus,
        order.approvalStatus,
        order.orderApprovalStatus,
        order.workflowApprovalStatus,
      ];

      const combined = [...statusCandidates, ...approvalCandidates]
        .map((value) => (typeof value === 'string' ? value.toLowerCase() : ''))
        .filter(Boolean);

      if (combined.length === 0) return filterStatus === 'all';

      return combined.some((value) => keywords.some((keyword) => value.includes(keyword)));
    };

    const getOrderCreatorId = (order) => {
      const candidates = [
        normalizePossibleId(order.createdBy),
        normalizePossibleId(order.createdBy?.user),
        normalizePossibleId(order.createdById),
        normalizePossibleId(order.ownerId),
        normalizePossibleId(order.userId),
        normalizePossibleId(order.createdByUserId),
      ];

      for (const candidate of candidates) {
        if (candidate !== null && candidate !== undefined && candidate !== '') {
          return String(candidate);
        }
      }
      return null;
    };

    const matchesSearch = (order) => {
      if (!loweredSearch) return true;

      const searchableValues = [
        order.displayOrderNumber,
        order.orderNumber,
        order.orderCode,
        order.orderReference,
        order.orderRef,
        order.id,
        order.orderId,
        order.quoteId,
        order.displayCustomerName,
        order.customerName,
        composeFullName(order.resolvedCustomer),
        composeFullName(order.customer),
        order.customer?.email,
        order.customer?.phone,
        order.displayVehicleName,
        order.vehicleName,
        order.vehicle?.name,
        order.vehicle?.model,
      ];

      const flattened = searchableValues
        .flatMap((value) => {
          if (value === undefined || value === null) return [];
          if (typeof value === 'string') return [value.toLowerCase()];
          if (typeof value === 'number') return [String(value).toLowerCase()];
          return [];
        });

      if (flattened.length === 0) return false;
      return flattened.some((value) => value.includes(loweredSearch));
    };

    return enhancedOrders.filter((order) => {
      if (!matchStatusFilter(order)) return false;

      if (!matchesSearch(order)) return false;

      if (userRole === 'DEALER_MANAGER') {
        const creatorId = getOrderCreatorId(order);
        const isMyOrder = normalizedUserId && creatorId ? creatorId === normalizedUserId : false;

        if (tabFilter === 'my_orders' && !isMyOrder) return false;
        if (tabFilter === 'staff_orders' && isMyOrder) return false;
      }

      return true;
    });
  }, [enhancedOrders, searchTerm, filterStatus, tabFilter, userRole, userId]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, tabFilter, userRole, userId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const quoteTotalAmount = useMemo(() => {
    if (!selectedQuote) return 0;
    const candidates = [
      selectedQuote.finalTotal,
      selectedQuote.totalAmount,
      selectedQuote.total,
      selectedQuote.totalPrice,
      selectedQuote.grandTotal,
      selectedQuote.netTotal
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
      if (typeof candidate === 'string') {
        const numeric = Number(candidate);
        if (!Number.isNaN(numeric)) {
          return numeric;
        }
      }
    }
    return 0;
  }, [selectedQuote]);

  const quotePaymentId = useMemo(() => {
    if (!selectedQuote) return null;
    const candidates = [
      selectedQuote.paymentId,
      selectedQuote.payment?.id,
      selectedQuote.payment?.paymentId,
      selectedQuote.payment?.paymentID,
      selectedQuote.payment?.idPayment
    ];
    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null) {
        return candidate;
      }
    }
    return null;
  }, [selectedQuote]);

  const quoteInterestRate = useMemo(() => {
    if (!selectedQuote) return 0;
    const candidates = [
      selectedQuote.installmentInterestRate,
      selectedQuote.annualInterestRate,
      selectedQuote.interestRate,
      selectedQuote.interest?.rate
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        const numeric = Number(candidate);
        if (!Number.isNaN(numeric)) {
          return numeric;
        }
      }
    }
    return 0;
  }, [selectedQuote]);

  const quoteSuggestedFirstDueDate = useMemo(() => {
    if (!selectedQuote) return '';
    const candidates = [
      selectedQuote.installmentFirstDueDate,
      selectedQuote.firstInstallmentDueDate,
      selectedQuote.firstDueDate,
      selectedQuote.expectedDeliveryDate,
      selectedQuote.estimatedDeliveryDate,
      selectedQuote.deliveryDate,
      selectedQuote.delivery?.expectedDate,
      selectedQuote.delivery?.estimatedDeliveryDate
    ];

    for (const candidate of candidates) {
      const normalized = normalizeDateInput(candidate);
      if (normalized) {
        return normalized;
      }
    }
    return '';
  }, [selectedQuote]);

  const installmentPreviewSchedule = useMemo(() => {
    if (!installmentPreview || !Array.isArray(installmentPreview.schedule)) {
      return [];
    }
    return installmentPreview.schedule;
  }, [installmentPreview]);

  const hasInstallmentSchedule = installmentPreviewSchedule.length > 0;
  const activeOrderDetail = useMemo(() => {
    const detail = orderDetail || orderDetailBase || null;
    if (!detail) return null;

    const lookupCustomer = resolveLookupCustomer(detail);
    const lookupVehicle = resolveLookupVehicle(detail);

    const quoteIdForLookup =
      detail.quoteId ||
      detail.quote?.quoteId ||
      detail.quote?.id ||
      detail.quote?.quoteID ||
      null;
    const quoteData = quoteIdForLookup ? quoteLookup?.[String(quoteIdForLookup)] : null;
    const quoteDetails = Array.isArray(quoteData?.quoteDetails) ? quoteData.quoteDetails : [];
    const quotePrimaryDetail = quoteDetails.length > 0 ? quoteData.quoteDetails[0] : null;
    const quoteVehicleCandidate = ensureObject(
      quoteData?.vehicle ||
        quotePrimaryDetail?.vehicle ||
        quotePrimaryDetail?.vehicleInfo ||
        quotePrimaryDetail?.vehicleDetails
    );
    const quoteVehicleId =
      quoteData?.vehicleId ||
      quoteData?.vehicleID ||
      quoteVehicleCandidate?.id ||
      quotePrimaryDetail?.vehicleId ||
      null;
    const quoteVehicleNameFromLookup = quoteData
      ? coalesceText(
          quoteData.vehicleName,
          quoteVehicleCandidate?.name,
          quoteVehicleCandidate?.model,
          quoteVehicleCandidate?.modelName,
          quoteVehicleCandidate?.vehicleName,
          quoteVehicleCandidate?.displayName,
          quoteVehicleCandidate?.title,
          quoteVehicleCandidate?.variantName,
          // Kết hợp brand và modelName nếu có
          quoteVehicleCandidate?.brand && quoteVehicleCandidate?.modelName 
            ? `${quoteVehicleCandidate.brand} ${quoteVehicleCandidate.modelName}`
            : null,
          quoteVehicleCandidate?.brand && quoteVehicleCandidate?.name
            ? `${quoteVehicleCandidate.brand} ${quoteVehicleCandidate.name}`
            : null,
          quotePrimaryDetail?.vehicleName,
          quotePrimaryDetail?.vehicleModel,
          quotePrimaryDetail?.vehicleDisplayName,
          quotePrimaryDetail?.vehicleDescription
        )
      : '';

    const displayCustomerName = lookupCustomer
      ? composeFullName(lookupCustomer) || lookupCustomer.email || lookupCustomer.phone || detail.displayCustomerName
      : detail.displayCustomerName;

    // Lấy vehicle từ orderDetails nếu có
    const primaryOrderDetail = Array.isArray(detail.orderDetails) && detail.orderDetails.length > 0 ? detail.orderDetails[0] : null;
    const orderDetailVehicle = primaryOrderDetail?.vehicle || primaryOrderDetail?.vehicleInfo || primaryOrderDetail?.vehicleDetails;
    const orderDetailVehicleName = orderDetailVehicle
      ? coalesceText(
          orderDetailVehicle.name,
          orderDetailVehicle.model,
          orderDetailVehicle.modelName,
          orderDetailVehicle.vehicleName,
          orderDetailVehicle.displayName,
          orderDetailVehicle.title,
          orderDetailVehicle.variantName,
          // Kết hợp brand và modelName nếu có
          orderDetailVehicle.brand && orderDetailVehicle.modelName 
            ? `${orderDetailVehicle.brand} ${orderDetailVehicle.modelName}`
            : null,
          orderDetailVehicle.brand && orderDetailVehicle.name
            ? `${orderDetailVehicle.brand} ${orderDetailVehicle.name}`
            : null,
          primaryOrderDetail?.vehicleName,
          primaryOrderDetail?.vehicleModel,
          primaryOrderDetail?.vehicleDisplayName
        )
      : null;

    let displayVehicleName = lookupVehicle
      ? coalesceText(
          lookupVehicle.name,
          lookupVehicle.model,
          lookupVehicle.modelName,
          lookupVehicle.vehicleName,
          lookupVehicle.displayName,
          lookupVehicle.title,
          lookupVehicle.variantName,
          // Kết hợp brand và modelName nếu có
          lookupVehicle.brand && lookupVehicle.modelName 
            ? `${lookupVehicle.brand} ${lookupVehicle.modelName}`
            : null,
          lookupVehicle.brand && lookupVehicle.name
            ? `${lookupVehicle.brand} ${lookupVehicle.name}`
            : null
        ) || detail.displayVehicleName
      : detail.displayVehicleName;

    // Ưu tiên: orderDetailVehicleName > quoteVehicleNameFromLookup > displayVehicleName
    if (!displayVehicleName || displayVehicleName.includes('Vehicle N/A')) {
      displayVehicleName =
        orderDetailVehicleName ||
        quoteVehicleNameFromLookup ||
        displayVehicleName ||
        (quoteVehicleId ? `Vehicle #${quoteVehicleId}` : displayVehicleName);
    }

    return {
      ...detail,
      displayCustomerName: displayCustomerName || detail.displayCustomerName,
      displayVehicleName: displayVehicleName || detail.displayVehicleName,
      resolvedCustomer: detail.resolvedCustomer || lookupCustomer || detail.resolvedCustomer,
      resolvedVehicle:
        detail.resolvedVehicle ||
        lookupVehicle ||
        quoteVehicleCandidate ||
        detail.resolvedVehicle,
      quoteData: quoteData || detail.quote,
    };
  }, [orderDetail, orderDetailBase, resolveLookupCustomer, resolveLookupVehicle, quoteLookup]);

  const canCreateFromQuote = useCallback(() => {
    if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') return false;
    if (userRole !== 'DEALER_STAFF' && userRole !== 'DEALER_MANAGER') return false;
    return true; // DEALER_STAFF và DEALER_MANAGER đều có thể tạo order từ quote
  }, [userRole]);

  const canApproveOrder = useCallback(
    (order) => {
      if (!order) return false;
      if (!userRole) return false;

      const normalizedRole = String(userRole).toUpperCase();
      if (!['DEALER_MANAGER', 'EVM_MANAGER', 'ADMIN'].includes(normalizedRole)) {
        return false;
      }

      const approvalStatus = (
        order.normalizedApprovalStatus ||
        order.approvalStatus ||
        order.orderApprovalStatus ||
        order.workflowApprovalStatus ||
        ''
      ).toUpperCase();

      const status = (
        order.normalizedStatus ||
        order.status ||
        order.orderStatus ||
        order.workflowStatus ||
        ''
      ).toUpperCase();

      const pendingApprovalKeywords = [
        'PENDING',
        'PENDING_APPROVAL',
        'AWAITING_APPROVAL',
        'WAITING',
        'UNDER_REVIEW',
        'SUBMITTED',
        'REVIEW',
        'PROCESSING',
      ];

      const isAlreadyFinalized = ['APPROVED', 'REJECTED', 'DELIVERED', 'CANCELLED', 'CANCELED'].some((keyword) =>
        approvalStatus.includes(keyword) || status.includes(keyword)
      );

      if (isAlreadyFinalized) {
        return false;
      }

      const combined = [approvalStatus, status].filter(Boolean);
      if (combined.length === 0) {
        return false;
      }

      const hasPendingStatus = combined.some((value) => pendingApprovalKeywords.some((keyword) => value.includes(keyword)));
      if (!hasPendingStatus) {
        return false;
      }

      // Kiểm tra workflow type dựa trên customerId
      // customerId = null: Order từ DEALER_MANAGER gửi cho EVM (workflow API) - chỉ EVM_MANAGER có thể approve
      // customerId có giá trị: Order từ DEALER_STAFF gửi cho DEALER_MANAGER (dealer-workflow API) - chỉ DEALER_MANAGER có thể approve
      const orderCustomerId = order.customerId || order.customer?.id || order.customer?.customerId;
      const isEVMWorkflowOrder = orderCustomerId === null || orderCustomerId === undefined;

      if (normalizedRole === 'DEALER_MANAGER') {
        // DEALER_MANAGER chỉ có thể approve orders từ dealer-workflow (customerId có giá trị)
        // Không thể approve orders từ EVM workflow (customerId = null)
        return !isEVMWorkflowOrder;
      } else if (normalizedRole === 'EVM_MANAGER' || normalizedRole === 'ADMIN') {
        // EVM_MANAGER chỉ có thể approve orders từ EVM workflow (customerId = null)
        return isEVMWorkflowOrder;
      }

      return false;
    },
    [userRole]
  );

  // Load orders based on role
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        let data = [];
        
        if (userRole === 'DEALER_STAFF' && userId) {
          // DEALER_STAFF: Get their own orders
          data = await ordersAPI.getByUser(userId);
        } else if (userRole === 'DEALER_MANAGER' && userDealerId) {
          // DEALER_MANAGER: Get ALL orders of their dealer (Manager's own and staff's)
          data = await ordersAPI.getOrdersByDealerId(userDealerId);
        } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
          // EVM_MANAGER/ADMIN: Chỉ lấy orders từ workflow (pending EVM approval)
          data = await ordersAPI.getPendingEVMApproval();
        } else {
          // Fallback cho các roles khác hoặc nếu không có dealerId
          data = await ordersAPI.getAll();
        }
        
        setOrders(sortOrdersByNewest(normalizeOrdersList(data)));
      } catch (error) {
        console.error('Error loading orders:', error);
        showErrorToast(handleAPIError(error));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userRole, userId, userDealerId]);

  // Load approved quotes when opening create from quote modal
  useEffect(() => {
    const loadApprovedQuotes = async () => {
      if (!showCreateFromQuoteModal) return;
      if (userRole !== 'DEALER_STAFF' && userRole !== 'DEALER_MANAGER') return;

      try {
        let quotes = [];

        if (userRole === 'DEALER_STAFF' && userId) {
          // DEALER_STAFF: Sử dụng GET /api/quotes/user/{userId}
          const rawQuotes = await quotesAPI.getByUser(userId);
          quotes = Array.isArray(rawQuotes)
            ? rawQuotes.filter((quote) => {
                const ownerId = getQuoteOwnerId(quote);
                const creatorRole = getQuoteCreatorRole(quote);
                const sameOwner = ownerId !== null && String(ownerId) === String(userId);
                const isStaffQuote = !creatorRole || creatorRole === 'DEALER_STAFF' || creatorRole === 'STAFF';
                // Chỉ lấy quotes đã được approve và sẵn sàng để tạo order
                return sameOwner && isQuoteApprovedForOrder(quote) && isStaffQuote;
              })
            : [];
        } else if (userRole === 'DEALER_MANAGER' && userId) {
          const rawQuotes = await quotesAPI.getApprovedReadyForOrder();
          quotes = Array.isArray(rawQuotes)
            ? rawQuotes.filter((quote) => {
                const ownerId = getQuoteOwnerId(quote);
                const creatorRole = getQuoteCreatorRole(quote);
                return (
                  creatorRole === 'DEALER_MANAGER' &&
                  ownerId !== null &&
                  String(ownerId) === String(userId) &&
                  isQuoteApprovedForOrder(quote)
                );
              })
            : [];
        }

        setAvailableQuotes(quotes);

        if (Array.isArray(quotes) && quotes.length > 0) {
          const updates = {};
          quotes.forEach((quote) => {
            const key = getQuoteIdentifier(quote);
            if (key) {
              updates[key] = quote;
            }
          });
          if (Object.keys(updates).length > 0) {
            setQuoteLookup((prev) => ({ ...prev, ...updates }));
          }
        }
      } catch (error) {
        console.error('Error loading approved quotes:', error);
        showErrorToast(handleAPIError(error));
        setAvailableQuotes([]);
      }
    };

    loadApprovedQuotes();
  }, [showCreateFromQuoteModal, userRole, userId]);

  // Load missing vehicles from availableQuotes
  useEffect(() => {
    if (!Array.isArray(availableQuotes) || availableQuotes.length === 0) return;
    if (!vehicleLookup) return; // Chỉ kiểm tra vehicleLookup 

    const missingVehicleIds = new Set();

    availableQuotes.forEach((quote) => {
      // Lấy vehicleId từ quote
      let vehicleId = quote.vehicleId || quote.vehicle?.id || quote.vehicle?.vehicleId;
      
      // Lấy vehicleId từ quoteDetails
      if (!vehicleId && Array.isArray(quote.quoteDetails) && quote.quoteDetails.length > 0) {
        const detail = quote.quoteDetails[0];
        vehicleId = detail.vehicleId || detail.vehicle?.id || detail.vehicle?.vehicleId;
      }
      
      if (vehicleId !== undefined && vehicleId !== null && vehicleId !== '') {
        const key = String(vehicleId);
        // Kiểm tra vehicleLookup[key] 是否存在，如果不存在则添加到 missingVehicleIds
        if (!vehicleLookup[key]) {
          missingVehicleIds.add(vehicleId);
        }
      }
    });

    if (missingVehicleIds.size === 0) return;

    let isSubscribed = true;

    (async () => {
      try {
        const results = await Promise.allSettled(
          Array.from(missingVehicleIds).map((vehicleId) =>
            vehiclesAPI.getById(vehicleId).catch((error) => {
              console.error(`Failed to fetch vehicle ${vehicleId} for quotes selection:`, error);
              throw error;
            })
          )
        );

        if (!isSubscribed) return;

        const updates = {};
        results.forEach((result, index) => {
          const vehicleId = Array.from(missingVehicleIds)[index];
          if (result.status === 'fulfilled' && result.value) {
            const vehicle = result.value;
            const candidateIds = [
              vehicle.id,
              vehicle.vehicleId,
              vehicle.vehicleID,
              vehicle.inventoryId,
              vehicle.inventory?.id
            ];
            candidateIds.forEach((candidate) => {
              if (candidate !== undefined && candidate !== null && candidate !== '') {
                updates[String(candidate)] = vehicle;
              }
            });
          }
        });

        if (Object.keys(updates).length > 0) {
          setVehicleLookup((prev) => ({ ...prev, ...updates }));
        }
      } catch (error) {
        console.error('Error loading missing vehicles from quotes:', error);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [availableQuotes, vehicleLookup]);

  // Check for selected quote from Quotes component or ApprovalSystem
  useEffect(() => {
    const handleNavigateToOrders = (event) => {
      const quoteId = event.detail?.quoteId;
      const fromEVM = event.detail?.fromEVM || false;
      
      if (quoteId) {
        setShowCreateFromQuoteModal(true);
        // Load quote details
        quotesAPI.getById(quoteId).then(quote => {
          setSelectedQuote(quote);
          setOrderFormData(prev => ({
            ...prev,
            quoteId: quote.quoteId || quote.id,
            customerId: quote.customerId || quote.customer?.customerId || quote.customer?.id,
            dealerId: quote.dealerId || quote.customer?.dealerId || userDealerId || null
          }));
        }).catch(err => {
          console.error('Error loading quote:', err);
        });
      }
    };

    window.addEventListener('navigateToOrders', handleNavigateToOrders);
    return () => window.removeEventListener('navigateToOrders', handleNavigateToOrders);
  }, [userDealerId]);

  useEffect(() => {
    if (!Array.isArray(orders) || orders.length === 0) return;

    const missingQuoteEntries = [];

    orders.forEach((order) => {
      const rawQuoteId =
        order.quoteId ||
        order.quote?.quoteId ||
        order.quote?.id ||
        order.quote?.quoteID ||
        null;

      if (rawQuoteId === undefined || rawQuoteId === null || rawQuoteId === '') return;
      const key = String(rawQuoteId);
      if (quoteLookup[key]) return;
      if (pendingQuoteIdsRef.current.has(key)) return;

      pendingQuoteIdsRef.current.add(key);
      missingQuoteEntries.push({ key, value: rawQuoteId });
    });

    if (missingQuoteEntries.length === 0) return;

    let isSubscribed = true;

    (async () => {
      const results = await Promise.allSettled(
        missingQuoteEntries.map(({ value }) =>
          quotesAPI.getById(value).catch((error) => {
            console.error(`Failed to fetch quote ${value} for orders page:`, error);
            throw error;
          })
        )
      );

      if (!isSubscribed) {
        missingQuoteEntries.forEach(({ key }) => pendingQuoteIdsRef.current.delete(key));
        return;
      }

      const updates = {};
      results.forEach((result, index) => {
        const { key } = missingQuoteEntries[index];
        pendingQuoteIdsRef.current.delete(key);
        if (result.status === 'fulfilled' && result.value) {
          updates[key] = result.value;
        }
      });

      if (Object.keys(updates).length > 0) {
        setQuoteLookup((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [orders, quoteLookup]);

  // Load missing vehicles from orderDetails
  useEffect(() => {
    if (!Array.isArray(orders) || orders.length === 0) return;
    if (!vehicleLookup || Object.keys(vehicleLookup).length === 0) return;

    const missingVehicleIds = new Set();

    orders.forEach((order) => {
      // Lấy vehicleId từ order.orderDetails
      if (Array.isArray(order.orderDetails) && order.orderDetails.length > 0) {
        order.orderDetails.forEach((detail) => {
          const vehicleId = detail.vehicleId || detail.vehicle?.id || detail.vehicle?.vehicleId;
          if (vehicleId !== undefined && vehicleId !== null && vehicleId !== '') {
            const key = String(vehicleId);
            if (!vehicleLookup[key]) {
              missingVehicleIds.add(vehicleId);
            }
          }
        });
      }

      // Lấy vehicleId từ order.vehicleId
      const orderVehicleId = order.vehicleId || order.vehicle?.id || order.vehicle?.vehicleId;
      if (orderVehicleId !== undefined && orderVehicleId !== null && orderVehicleId !== '') {
        const key = String(orderVehicleId);
        if (!vehicleLookup[key]) {
          missingVehicleIds.add(orderVehicleId);
        }
      }
    });

    if (missingVehicleIds.size === 0) return;

    let isSubscribed = true;

    (async () => {
      const results = await Promise.allSettled(
        Array.from(missingVehicleIds).map((vehicleId) =>
          vehiclesAPI.getById(vehicleId).catch((error) => {
            console.error(`Failed to fetch vehicle ${vehicleId} for orders page:`, error);
            throw error;
          })
        )
      );

      if (!isSubscribed) return;

      const updates = {};
      results.forEach((result, index) => {
        const vehicleId = Array.from(missingVehicleIds)[index];
        if (result.status === 'fulfilled' && result.value) {
          const vehicle = result.value;
          const candidateIds = [
            vehicle.id,
            vehicle.vehicleId,
            vehicle.vehicleID,
            vehicle.inventoryId,
            vehicle.inventory?.id
          ];
          candidateIds.forEach((candidate) => {
            if (candidate !== undefined && candidate !== null && candidate !== '') {
              updates[String(candidate)] = vehicle;
            }
          });
        }
      });

      if (Object.keys(updates).length > 0) {
        setVehicleLookup((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [orders, vehicleLookup]);

  useEffect(() => {
    let isMounted = true;

    const loadReferenceData = async () => {
      try {
        const customerPromise =
          userDealerId && (userRole === 'DEALER_MANAGER' || userRole === 'DEALER_STAFF')
            ? customersAPI.getByDealer(userDealerId)
            : customersAPI.getAll();

        const [customersResult, vehiclesResult] = await Promise.allSettled([
          customerPromise,
          vehiclesAPI.getAll()
        ]);

        if (!isMounted) {
          return;
        }

        if (customersResult.status === 'fulfilled' && Array.isArray(customersResult.value)) {
          const map = {};
          customersResult.value.forEach((customer) => {
            const candidateIds = [
              customer.id,
              customer.customerId,
              customer.customerID,
              customer.userId,
              customer.user?.id,
              customer.user?.userId
            ];
            candidateIds.forEach((candidate) => {
              if (candidate !== undefined && candidate !== null && candidate !== '') {
                map[String(candidate)] = customer;
              }
            });
          });
          setCustomerLookup(map);
        } else if (customersResult.status === 'rejected') {
          console.error('Failed to load customers for orders page:', customersResult.reason);
        }

        if (vehiclesResult.status === 'fulfilled' && Array.isArray(vehiclesResult.value)) {
          const map = {};
          vehiclesResult.value.forEach((vehicle) => {
            const candidateIds = [
              vehicle.id,
              vehicle.vehicleId,
              vehicle.vehicleID,
              vehicle.inventoryId,
              vehicle.inventory?.id
            ];
            candidateIds.forEach((candidate) => {
              if (candidate !== undefined && candidate !== null && candidate !== '') {
                map[String(candidate)] = vehicle;
              }
            });
          });
          setVehicleLookup(map);
        } else if (vehiclesResult.status === 'rejected') {
          console.error('Failed to load vehicles for orders page:', vehiclesResult.reason);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading reference data for orders page:', error);
        }
      }
    };

    loadReferenceData();

    return () => {
      isMounted = false;
    };
  }, [userRole, userDealerId]);

  useEffect(() => {
    if (showOrderForm && selectedQuote) {
      if (!installmentFirstDueDate) {
        const defaultDueDate = computeDefaultFirstDueDate(
          orderFormData.orderDate,
          orderFormData.deliveryDate,
          quoteSuggestedFirstDueDate
        );
        setInstallmentFirstDueDate(defaultDueDate);
      }
    } else if (!showOrderForm) {
      setInstallmentPreview(null);
      setInstallmentPreviewError('');
      setInstallmentFirstDueDate('');
      setSelectedInstallmentMonths(12);
    }
  }, [
    showOrderForm,
    selectedQuote,
    orderFormData.orderDate,
    orderFormData.deliveryDate,
    installmentFirstDueDate,
    quoteSuggestedFirstDueDate
  ]);

  const resolveStatusTokens = (status, approvalStatus) => {
    const toUpper = (value) =>
      typeof value === 'string' ? value.trim().toUpperCase() : '';
    const tokens = [
      toUpper(status),
      toUpper(approvalStatus),
    ].filter(Boolean);
    return tokens;
  };

  const hasKeyword = (tokens, candidates) =>
    tokens.some((token) => candidates.some((candidate) => token.includes(candidate)));

  const getStatusColor = (status, approvalStatus) => {
    const tokens = resolveStatusTokens(status, approvalStatus);
    if (hasKeyword(tokens, ['REJECT', 'DECLINE', 'CANCEL'])) return 'var(--color-error)';
    if (hasKeyword(tokens, ['COMPLETE', 'DELIVER'])) return 'var(--color-success)';
    if (hasKeyword(tokens, ['APPROV'])) return 'var(--color-info)';
    if (hasKeyword(tokens, ['PEND', 'REVIEW', 'PROCESS'])) return 'var(--color-warning)';
    return 'var(--color-text-muted)';
  };

  const getStatusLabel = (status, approvalStatus) => {
    const tokens = resolveStatusTokens(status, approvalStatus);
    if (hasKeyword(tokens, ['REJECT', 'DECLINE', 'CANCEL'])) return 'Rejected';
    if (hasKeyword(tokens, ['DELIVER'])) return 'Delivered';
    if (hasKeyword(tokens, ['COMPLETE'])) return 'Completed';
    if (hasKeyword(tokens, ['APPROV'])) return 'Approved';
    if (hasKeyword(tokens, ['PEND', 'REVIEW', 'PROCESS'])) return 'Pending Approval';
    return tokens[0] || 'Unknown';
  };

  const handleCreateFromQuote = () => {
    setShowCreateFromQuoteModal(true);
  };

  const handleViewOrderDetails = async (order) => {
    const orderId = order?.orderId || order?.id;
    if (!orderId) {
      const message = 'Không tìm thấy Order ID để xem chi tiết.';
      showErrorToast(message);
      return;
    }

    setShowOrderDetailModal(true);
    setOrderDetailLoading(true);
    setOrderDetailError('');
    const normalizedBase = normalizeOrder(order);
    setOrderDetailBase(normalizedBase);
    setOrderDetail(null);

    try {
      const data = await ordersAPI.getById(orderId);
      setOrderDetail(normalizeOrder(data) || normalizeOrder(order));
    } catch (error) {
      console.error('Error loading order detail:', error);
      const message = handleAPIError(error);
      setOrderDetailError(message);
      showErrorToast(message);
      setOrderDetail(normalizedBase);
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleSelectQuote = (quote) => {
    if (!quote) return;

    // Kiểm tra quote phải thuộc về user hiện tại
    const ownerId = getQuoteOwnerId(quote);
    const creatorRole = getQuoteCreatorRole(quote);
    const sameOwner = ownerId !== null && String(ownerId) === String(userId);

    if (!sameOwner) {
      showErrorToast('Bạn chỉ có thể tạo order từ quote do chính mình tạo.');
      return;
    }

    // Kiểm tra role của quote creator phải khớp với user role
    if (userRole === 'DEALER_STAFF') {
      const isStaffQuote = !creatorRole || creatorRole === 'DEALER_STAFF' || creatorRole === 'STAFF';
      if (!isStaffQuote) {
        showErrorToast('Dealer Staff chỉ có thể tạo order từ quote do chính mình tạo.');
        return;
      }
    } else if (userRole === 'DEALER_MANAGER') {
      if (creatorRole !== 'DEALER_MANAGER') {
        showErrorToast('Dealer Manager chỉ có thể tạo order từ quote do chính mình tạo.');
        return;
      }
    }

    // Kiểm tra quote đã được approve chưa
    if (!isQuoteApprovedForOrder(quote)) {
      showErrorToast('Quote này chưa được approve hoặc chưa sẵn sàng để tạo order.');
      return;
    }

    const quoteKey = getQuoteIdentifier(quote);
    if (quoteKey) {
      setQuoteLookup((prev) => (prev[quoteKey] ? prev : { ...prev, [quoteKey]: quote }));
    }

    setSelectedQuote(quote);
    
    // DEALER_MANAGER: customerId phải là null
    // DEALER_STAFF: lấy customerId từ quote
    let extractedCustomerId = null;
    if (userRole === 'DEALER_STAFF') {
      // Xử lý customerId có thể là object hoặc ID
      extractedCustomerId = quote.customerId;
      if (extractedCustomerId && typeof extractedCustomerId === 'object') {
        extractedCustomerId = extractedCustomerId.customerId || extractedCustomerId.id || extractedCustomerId.userId;
      }
      if (!extractedCustomerId) {
        extractedCustomerId = quote.customer?.customerId || quote.customer?.id || quote.customer?.userId;
      }
    }
    // DEALER_MANAGER: customerId = null (không lấy từ quote)
    
    setOrderFormData((prev) => ({
      ...prev,
      quoteId: quote.quoteId || quote.id,
      customerId: extractedCustomerId, // null cho DEALER_MANAGER, có giá trị cho DEALER_STAFF
      dealerId: quote.dealerId || quote.customer?.dealerId || userDealerId || null
    }));
    const quoteDueDateCandidates = [
      quote.installmentFirstDueDate,
      quote.firstInstallmentDueDate,
      quote.firstDueDate,
      quote.expectedDeliveryDate,
      quote.estimatedDeliveryDate,
      quote.deliveryDate,
      quote.delivery?.expectedDate,
      quote.delivery?.estimatedDeliveryDate,
    ];
    let suggestedFromQuote = '';
    for (const candidate of quoteDueDateCandidates) {
      const normalized = normalizeDateInput(candidate);
      if (normalized) {
        suggestedFromQuote = normalized;
        break;
      }
    }
    const defaultDueDate = computeDefaultFirstDueDate(
      orderFormData.orderDate,
      orderFormData.deliveryDate,
      suggestedFromQuote || quoteSuggestedFirstDueDate
    );
    setInstallmentFirstDueDate(defaultDueDate);
    setSelectedInstallmentMonths(12);
    setInstallmentPreview(null);
    setInstallmentPreviewError('');
    setShowCreateFromQuoteModal(false);
    setShowOrderForm(true);
  };

  const handleDismissOrderForm = () => {
    setShowOrderForm(false);
    setSelectedQuote(null);
    setInstallmentPreview(null);
    setInstallmentPreviewError('');
    setInstallmentFirstDueDate('');
    setSelectedInstallmentMonths(12);
    setInstallmentPreviewLoading(false);
  };

  const handleCloseOrderDetailModal = () => {
    setShowOrderDetailModal(false);
    setOrderDetail(null);
    setOrderDetailBase(null);
    setOrderDetailError('');
    setOrderDetailLoading(false);
  };

  const handleInstallmentFirstDueDateChange = (value) => {
    setInstallmentFirstDueDate(value);
    setInstallmentPreview(null);
    setInstallmentPreviewError('');
  };

  const handlePreviewInstallment = async (months) => {
    if (!selectedQuote) {
      setInstallmentPreviewError('Please select a quote before previewing installment plans.');
      return;
    }

    const normalizedMonths = Number(months);
    if (!Number.isFinite(normalizedMonths) || normalizedMonths <= 0) {
      setInstallmentPreviewError('Invalid installment duration.');
      return;
    }

    const effectiveFirstDueDate =
      installmentFirstDueDate ||
      computeDefaultFirstDueDate(orderFormData.orderDate, orderFormData.deliveryDate, quoteSuggestedFirstDueDate);

    if (!effectiveFirstDueDate) {
      const message = 'Please set the first installment due date before previewing.';
      setInstallmentPreviewError(message);
      showErrorToast(message);
      return;
    }

    if (!quoteTotalAmount || quoteTotalAmount <= 0) {
      const message = 'Quote total amount is missing or invalid. Unable to preview installment plan.';
      setInstallmentPreviewError(message);
      showErrorToast(message);
      return;
    }

    setSelectedInstallmentMonths(normalizedMonths);
    setInstallmentPreview(null);
    setInstallmentPreviewLoading(true);
    setInstallmentPreviewError('');

    try {
      const payload = {
        paymentId: quotePaymentId ?? null,
        totalAmount: Number(quoteTotalAmount),
        months: normalizedMonths,
        annualInterestRate: Number.isFinite(quoteInterestRate) ? quoteInterestRate : 0,
        firstDueDate: effectiveFirstDueDate
      };

      const result = await installmentsAPI.preview(payload);
      setInstallmentPreview(result);
    } catch (error) {
      console.error('Error previewing installment plan from order modal:', error);
      const message = handleAPIError(error);
      setInstallmentPreview(null);
      setInstallmentPreviewError(message);
      showErrorToast(message);
    } finally {
      setInstallmentPreviewLoading(false);
    }
  };

  const handleCreateOrderFromQuote = async (e) => {
    e.preventDefault();
    
    // Ưu tiên kiểm tra selectedQuote vì user đã chọn quote
    if (!selectedQuote) {
      showErrorToast('Please select a quote');
      return;
    }

    if (!userId) {
      showErrorToast('User ID not found');
      return;
    }

    const activeQuote = selectedQuote;
    
    // Đảm bảo orderFormData có quoteId từ selectedQuote
    const quoteId = activeQuote.quoteId || activeQuote.id;
    
    if (!quoteId) {
      showErrorToast('Quote ID is missing. Please re-select the quote.');
      return;
    }
    
    // DEALER_MANAGER: customerId phải là null (quotes từ EVM đã có customerId = null)
    // DEALER_STAFF: lấy customerId từ quote và phải có giá trị
    let customerId = null;
    if (userRole === 'DEALER_STAFF') {
      // Xử lý customerId có thể là object hoặc ID
      customerId = activeQuote.customerId;
      if (customerId && typeof customerId === 'object') {
        customerId = customerId.customerId || customerId.id || customerId.userId;
      }
      if (!customerId) {
        customerId = activeQuote.customer?.customerId || activeQuote.customer?.id || activeQuote.customer?.userId;
      }
      
      if (!customerId) {
        showErrorToast('Customer information is missing from the quote. Please re-select the quote.');
        return;
      }
    }
    // DEALER_MANAGER: customerId = null (không cần kiểm tra)
    
    // Cập nhật orderFormData để đảm bảo có đầy đủ thông tin
    setOrderFormData(prev => ({
      ...prev,
      quoteId: quoteId,
      customerId: customerId, // null cho DEALER_MANAGER, có giá trị cho DEALER_STAFF
      dealerId: prev.dealerId || activeQuote.dealerId || activeQuote.customer?.dealerId || userDealerId || null
    }));

    // Kiểm tra quote phải thuộc về user hiện tại
    const ownerId = getQuoteOwnerId(activeQuote);
    const creatorRole = getQuoteCreatorRole(activeQuote);
    const sameOwner = ownerId !== null && String(ownerId) === String(userId);

    if (!sameOwner) {
      showErrorToast('Bạn chỉ có thể tạo order từ quote do chính mình tạo.');
      return;
    }

    // Kiểm tra role của quote creator phải khớp với user role
    if (userRole === 'DEALER_STAFF') {
      const isStaffQuote = !creatorRole || creatorRole === 'DEALER_STAFF' || creatorRole === 'STAFF';
      if (!isStaffQuote) {
        showErrorToast('Dealer Staff chỉ có thể tạo order từ quote do chính mình tạo.');
        return;
      }
    } else if (userRole === 'DEALER_MANAGER') {
      if (creatorRole !== 'DEALER_MANAGER') {
        showErrorToast('Dealer Manager chỉ có thể tạo order từ quote do chính mình tạo.');
        return;
      }
    }

    // Kiểm tra quote đã được approve chưa
    if (!isQuoteApprovedForOrder(activeQuote)) {
      showErrorToast('Quote này chưa được approve hoặc chưa sẵn sàng để tạo order.');
      return;
    }

    try {
      const derivedDealerId =
        orderFormData.dealerId ||
        activeQuote?.dealerId ||
        activeQuote?.customer?.dealerId ||
        userDealerId ||
        null;

      if (!derivedDealerId) {
        showErrorToast('Dealer information is missing for this quote. Please ensure the quote has a dealer assigned.');
        return;
      }

      // Sử dụng quoteId từ activeQuote hoặc orderFormData
      const finalQuoteId = quoteId || orderFormData.quoteId;
      // DEALER_MANAGER: customerId phải là null
      // DEALER_STAFF: customerId từ orderFormData (đã được validate ở trên)
      const finalCustomerId = userRole === 'DEALER_MANAGER' ? null : (customerId || orderFormData.customerId);
      
      // Lấy vehicleId từ quote
      const vehicleId = activeQuote.vehicleId || 
                        activeQuote.vehicle?.id || 
                        activeQuote.vehicle?.vehicleId ||
                        activeQuote.quoteDetails?.[0]?.vehicleId ||
                        activeQuote.quoteDetails?.[0]?.vehicle?.id ||
                        null;
      
      // EVM_MANAGER không được tạo order
      if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        showErrorToast('EVM Manager cannot create orders. Only approve orders.');
        return;
      }

      // DEALER_MANAGER: Sử dụng workflow API (/api/workflow/orders/create-from-approved-quote), customerId = null
      if (userRole === 'DEALER_MANAGER') {
        // Đảm bảo customerId là null cho DEALER_MANAGER
        const orderData = {
          quoteId: finalQuoteId,
          customerId: null, // DEALER_MANAGER: customerId phải là null
          dealerId: Number(derivedDealerId),
          userId: userId,
          orderDate: orderFormData.orderDate ? new Date(orderFormData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          paymentMethod: orderFormData.paymentMethod || 'VNPAY',
          paymentPercentage: typeof orderFormData.paymentPercentage === 'number'
            ? orderFormData.paymentPercentage
            : 0,
          notes: orderFormData.notes || '',
          orderDetails: vehicleId ? [{
            vehicleId: Number(vehicleId),
            quantity: 1,
            unitPrice: activeQuote.finalTotal || activeQuote.totalAmount || 0
          }] : []
        };
        
        await ordersAPI.createFromEVMApprovedQuote(orderData);
        showSuccessToast('Order created from quote successfully. Waiting for EVM Manager approval.');
      } 
      // DEALER_STAFF: Sử dụng dealer-workflow API (/api/dealer-workflow/orders/create-from-approved-quote), customerId phải có
      else if (userRole === 'DEALER_STAFF') {
        if (!finalCustomerId) {
          showErrorToast('Customer information is required for creating order.');
          return;
        }
        
        const orderData = {
          quoteId: finalQuoteId,
          customerId: finalCustomerId, // DEALER_STAFF: customerId phải có
          dealerId: Number(derivedDealerId),
          userId: userId,
          orderDate: orderFormData.orderDate ? new Date(orderFormData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          paymentMethod: orderFormData.paymentMethod || 'VNPAY',
          paymentPercentage: typeof orderFormData.paymentPercentage === 'number'
            ? orderFormData.paymentPercentage
            : 0,
          notes: orderFormData.notes || '',
          orderDetails: vehicleId ? [{
            vehicleId: Number(vehicleId),
            quantity: 1,
            unitPrice: activeQuote.finalTotal || activeQuote.totalAmount || 0
          }] : []
        };
        
        await ordersAPI.createFromApprovedQuote(orderData, userId);
        showSuccessToast('Order created from quote successfully. Waiting for Dealer Manager approval.');
      } 
      else {
        const orderData = {
          quoteId: finalQuoteId,
          customerId: finalCustomerId,
          dealerId: Number(derivedDealerId),
          orderDate: orderFormData.orderDate ? new Date(orderFormData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          deliveryDate: orderFormData.deliveryDate ? new Date(orderFormData.deliveryDate).toISOString().split('T')[0] : null,
          paymentMethod: orderFormData.paymentMethod || 'VNPAY',
          paymentPercentage: typeof orderFormData.paymentPercentage === 'number'
            ? orderFormData.paymentPercentage
            : 0,
          notes: orderFormData.notes || '',
          userId: userId,
          orderDetails: vehicleId ? [{
            vehicleId: Number(vehicleId),
            quantity: 1,
            unitPrice: activeQuote.finalTotal || activeQuote.totalAmount || 0
          }] : []
        };
        
        await ordersAPI.create(orderData);
        showSuccessToast('Order created from quote successfully');
      }
      
      // Reload orders based on role
      let reloadedOrders = [];
      if (userRole === 'DEALER_STAFF' && userId) {
        reloadedOrders = await ordersAPI.getByUser(userId);
      } else if (userRole === 'DEALER_MANAGER' && userDealerId) {
        reloadedOrders = await ordersAPI.getOrdersByDealerId(userDealerId);
      }
      // EVM/Admin reload pending only or use fallback getAll
      else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        reloadedOrders = await ordersAPI.getPendingEVMApproval();
      } else {
        reloadedOrders = await ordersAPI.getAll();
      }
      
      setOrders(sortOrdersByNewest(normalizeOrdersList(reloadedOrders)));
      
      // Reset form
      handleDismissOrderForm();
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
      let reloadedOrders = [];
      if (userRole === 'DEALER_STAFF' && userId) {
        reloadedOrders = await ordersAPI.getByUser(userId);
      } else if (userRole === 'DEALER_MANAGER' && userDealerId) {
        reloadedOrders = await ordersAPI.getOrdersByDealerId(userDealerId);
      }
      else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        reloadedOrders = await ordersAPI.getPendingEVMApproval();
      } else {
        reloadedOrders = await ordersAPI.getAll();
      }
      setOrders(sortOrdersByNewest(normalizeOrdersList(reloadedOrders)));
      
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
      let reloadedOrders = [];
      if (userRole === 'DEALER_STAFF' && userId) {
        reloadedOrders = await ordersAPI.getByUser(userId);
      } else if (userRole === 'DEALER_MANAGER' && userDealerId) {
        reloadedOrders = await ordersAPI.getOrdersByDealerId(userDealerId);
      }
      else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
        reloadedOrders = await ordersAPI.getPendingEVMApproval();
      } else {
        reloadedOrders = await ordersAPI.getAll();
      }
      setOrders(sortOrdersByNewest(normalizeOrdersList(reloadedOrders)));
    } catch (error) {
      console.error('Error rejecting order:', error);
      showErrorToast(handleAPIError(error));
    }
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
  const pendingOrders = orders.filter(o => ((o.normalizedApprovalStatus || o.approvalStatus || o.orderApprovalStatus || '').toUpperCase()) === 'PENDING_APPROVAL').length;
  const approvedOrders = orders.filter(o => ((o.normalizedApprovalStatus || o.approvalStatus || o.orderApprovalStatus || '').toUpperCase()) === 'APPROVED').length;
  
  // Tính số lượng Orders theo tab cho Dealer Manager
  const myOrdersCount = enhancedOrders.filter((order) => {
    const creatorId =
      normalizePossibleId(order.createdBy) ??
      normalizePossibleId(order.createdBy?.user) ??
      normalizePossibleId(order.createdById) ??
      normalizePossibleId(order.ownerId) ??
      normalizePossibleId(order.userId) ??
      normalizePossibleId(order.createdByUserId);

    if (creatorId === null || creatorId === undefined || creatorId === '') return false;
    if (userId === undefined || userId === null || userId === '') return false;
    return String(creatorId) === String(userId);
  }).length;
  const staffOrdersCount = enhancedOrders.length - myOrdersCount; // Chỉ chính xác nếu API chỉ trả về orders của Dealer
  const startIndex = filteredOrders.length === 0 ? 0 : (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = filteredOrders.length === 0 ? 0 : Math.min(startIndex + paginatedOrders.length, filteredOrders.length);

  return (
    <div className="main">
      {/* Order Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        {[
          { label: 'Total Orders', value: orders.length, icon: 'bx-receipt', gradient: ['rgba(239,68,68,0.18)', 'rgba(239,68,68,0.05)'], border: 'rgba(239,68,68,0.35)', subtext: 'Across all sources' },
          { label: 'Pending Approval', value: pendingOrders, icon: 'bx-time', gradient: ['rgba(251,191,36,0.25)', 'rgba(251,191,36,0.07)'], border: 'rgba(251,191,36,0.45)', subtext: 'Awaiting manager review' },
          { label: 'Approved', value: approvedOrders, icon: 'bx-check-circle', gradient: ['rgba(52,211,153,0.25)', 'rgba(52,211,153,0.08)'], border: 'rgba(52,211,153,0.45)', subtext: 'Ready for delivery' },
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: 'bx-dollar-circle', gradient: ['rgba(59,130,246,0.25)', 'rgba(59,130,246,0.08)'], border: 'rgba(59,130,246,0.45)', subtext: 'Booked via orders' }
        ].map((stat, index) => (
          <div
            key={stat.label}
            style={{
              padding: '20px',
              borderRadius: '18px',
              background: `linear-gradient(135deg, ${stat.gradient[0]}, ${stat.gradient[1]})`,
              border: `1px solid ${stat.border}`,
              boxShadow: '0 20px 40px rgba(15,23,42,0.35)',
              minHeight: '150px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{stat.label}</div>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(15,23,42,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '18px'
              }}>
                <i className={`bx ${stat.icon}`}></i>
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-text)' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{stat.subtext}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Orders Management</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              Track every quote that turned into a confirmed purchase order.
            </p>
          </div>
          {canCreateFromQuote() && (
            <button className="btn btn-primary" onClick={handleCreateFromQuote} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="bx bx-cart"></i>
              Create from Quote
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
            <input
              type="text"
              placeholder="Search by order no., customer, vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 42px',
                border: '1px solid var(--color-border)',
                borderRadius: '999px',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['all', 'pending', 'approved', 'rejected', 'delivered'].map((status) => {
              const isActive = filterStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: isActive ? '1px solid transparent' : '1px solid var(--color-border)',
                    background: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--color-text)',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {userRole === 'DEALER_MANAGER' && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '8px',
              borderRadius: '999px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)'
            }}
          >
            {[
              { key: 'all_dealer', label: `All Dealer Orders (${orders.length})` },
              { key: 'my_orders', label: `My Orders (${myOrdersCount})` },
              { key: 'staff_orders', label: `Staff Orders (${staffOrdersCount})` }
            ].map((tab) => {
              const isActive = tabFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setTabFilter(tab.key)}
                  style={{
                    flex: '1 1 140px',
                    minWidth: '140px',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '10px 16px',
                    background: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--color-text-muted)',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Orders List */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {paginatedOrders.map(order => {
            // Kiểm tra order có customerId không (null = EVM workflow order từ DEALER_MANAGER)
            const orderCustomerId = order.customerId || order.customer?.id || order.customer?.customerId;
            const isEVMWorkflowOrder = orderCustomerId === null || orderCustomerId === undefined;
            
            // DEALER_MANAGER 的 My Orders: customerId = null 的订单不显示 customer，只显示 vehicle
            const shouldShowCustomer = !(userRole === 'DEALER_MANAGER' && isEVMWorkflowOrder);
            
            const customerName = shouldShowCustomer
              ? (order.displayCustomerName ||
                 order.customer?.fullName ||
                 order.customerName ||
                 'N/A')
              : null;
            const vehicleName =
              order.displayVehicleName ||
              order.vehicle?.name ||
              order.vehicleName ||
              'N/A';
            const totalAmount = order.totalAmount || order.amount || 0;
            const orderNumber =
              order.displayOrderNumber ||
              order.orderNumber ||
              order.orderId?.toString() ||
              'N/A';
            const status =
              order.normalizedStatus ||
              order.status ||
              order.orderStatus ||
              '';
            const approvalStatus =
              order.normalizedApprovalStatus ||
              order.approvalStatus ||
              order.orderApprovalStatus ||
              '';
            const statusColor = getStatusColor(status, approvalStatus);
            const statusLabel = getStatusLabel(status, approvalStatus);
            // Thẻ đánh dấu Order của Manager/Staff
            const isMyOrder = (order.createdBy?.id || order.createdBy?.userId || order.userId)?.toString() === userId?.toString();
            const creatorTag = userRole === 'DEALER_MANAGER' && isMyOrder ? ' (You)' : userRole === 'DEALER_MANAGER' && !isMyOrder ? ' (Staff)' : '';

            return (
              <div key={order.orderId || order.id} style={{ 
                padding: '20px',
                background: 'rgba(15,23,42,0.55)',
                borderRadius: '20px',
                border: `1px solid ${isMyOrder ? 'var(--color-primary)' : 'var(--color-border)'}`,
                boxShadow: '0 20px 40px rgba(15,23,42,0.45)',
                backdropFilter: 'blur(6px)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>{orderNumber}{creatorTag}</h3>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius)',
                        background: 'rgba(255,255,255,0.04)',
                        color: statusColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
                      {vehicleName}
                    </div>
                    {customerName && (
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                        Customer: {customerName}
                      </div>
                    )}
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      Order Date · {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
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
                      {order.displayPaymentMethod || order.paymentMethod || 'N/A'}
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
                      onClick={() => handleViewOrderDetails(order)}
                    >
                      <i className="bx bx-show"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrders.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {filteredOrders.length === 0
                ? 'No orders to display'
                : `Showing ${startIndex + 1}-${endIndex} of ${filteredOrders.length} orders`}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 12px' }}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    className="btn"
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: isActive ? '1px solid transparent' : '1px solid var(--color-border)',
                      background: isActive ? 'var(--color-primary)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--color-text)',
                      fontWeight: 600
                    }}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 12px' }}
              >
                Next
              </button>
            </div>
          </div>
        )}

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
                  // DEALER_STAFF: 显示客户名称 + 车辆名称
                  // DEALER_MANAGER: 只显示车辆名称
                  const shouldShowCustomer = userRole === 'DEALER_STAFF';
                  
                  let customerName = null;
                  if (shouldShowCustomer) {
                    // Lấy customer từ quote hoặc customerLookup
                    const quoteCustomerId = quote.customerId || quote.customer?.id || quote.customer?.customerId;
                    if (quoteCustomerId) {
                      const customer = customerLookup[String(quoteCustomerId)] || quote.customer;
                      if (customer) {
                        customerName = customer.fullName || customer.name || customer.email || customer.phone || `Customer #${quoteCustomerId}`;
                      } else {
                        customerName = quote.customerName || 'N/A';
                      }
                    } else {
                      customerName = quote.customerName || 'N/A';
                    }
                  }
                  
                  // Lấy vehicle từ nhiều nguồn
                  let vehicleName = 'N/A';
                  
                  // 1. Từ quote.vehicle object
                  if (quote.vehicle) {
                    if (quote.vehicle.brand && quote.vehicle.modelName) {
                      vehicleName = `${quote.vehicle.brand} ${quote.vehicle.modelName}`;
                    } else if (quote.vehicle.modelName) {
                      vehicleName = quote.vehicle.modelName;
                    } else if (quote.vehicle.name) {
                      vehicleName = quote.vehicle.name;
                    } else if (quote.vehicle.brand && quote.vehicle.name) {
                      vehicleName = `${quote.vehicle.brand} ${quote.vehicle.name}`;
                    }
                  }
                  
                  // 2. Từ quote.vehicleName
                  if (vehicleName === 'N/A' && quote.vehicleName) {
                    vehicleName = quote.vehicleName;
                  }
                  
                  // 3. Từ quoteDetails[0].vehicle
                  if (vehicleName === 'N/A' && Array.isArray(quote.quoteDetails) && quote.quoteDetails.length > 0) {
                    const detail = quote.quoteDetails[0];
                    const detailVehicle = detail.vehicle || detail.vehicleInfo || detail.vehicleDetails;
                    if (detailVehicle) {
                      if (detailVehicle.brand && detailVehicle.modelName) {
                        vehicleName = `${detailVehicle.brand} ${detailVehicle.modelName}`;
                      } else if (detailVehicle.modelName) {
                        vehicleName = detailVehicle.modelName;
                      } else if (detailVehicle.name) {
                        vehicleName = detailVehicle.name;
                      }
                    }
                    if (vehicleName === 'N/A' && detail.vehicleName) {
                      vehicleName = detail.vehicleName;
                    }
                  }
                  
                  // 4. Từ vehicleLookup qua vehicleId
                  if (vehicleName === 'N/A') {
                    // Tìm vehicleId từ nhiều nguồn
                    let vehicleId = quote.vehicleId || 
                      quote.vehicle?.id || 
                      quote.vehicle?.vehicleId;
                    
                    // Nếu chưa có vehicleId, tìm từ quoteDetails
                    if (!vehicleId && Array.isArray(quote.quoteDetails) && quote.quoteDetails.length > 0) {
                      const detail = quote.quoteDetails[0];
                      vehicleId = detail.vehicleId || 
                        detail.vehicle?.id || 
                        detail.vehicle?.vehicleId ||
                        detail.vehicleInfo?.id ||
                        detail.vehicleDetails?.id;
                    }
                    
                    // Tìm từ quoteLookup nếu quote 已经被加载
                    if (!vehicleId && quote.quoteId) {
                      const quoteData = quoteLookup[String(quote.quoteId || quote.id)];
                      if (quoteData) {
                        vehicleId = quoteData.vehicleId || 
                          quoteData.vehicle?.id || 
                          quoteData.vehicle?.vehicleId;
                        if (!vehicleId && Array.isArray(quoteData.quoteDetails) && quoteData.quoteDetails.length > 0) {
                          const detail = quoteData.quoteDetails[0];
                          vehicleId = detail.vehicleId || detail.vehicle?.id || detail.vehicle?.vehicleId;
                        }
                      }
                    }
                    
                    if (vehicleId && vehicleLookup[String(vehicleId)]) {
                      const lookupVehicle = vehicleLookup[String(vehicleId)];
                      if (lookupVehicle.brand && lookupVehicle.modelName) {
                        vehicleName = `${lookupVehicle.brand} ${lookupVehicle.modelName}`;
                      } else if (lookupVehicle.modelName) {
                        vehicleName = lookupVehicle.modelName;
                      } else if (lookupVehicle.name) {
                        vehicleName = lookupVehicle.name;
                      } else if (lookupVehicle.brand && lookupVehicle.name) {
                        vehicleName = `${lookupVehicle.brand} ${lookupVehicle.name}`;
                      } else if (lookupVehicle.vehicleName) {
                        vehicleName = lookupVehicle.vehicleName;
                      }
                    } else if (vehicleId) {
                      // Nếu có vehicleId nhưng chưa có trong lookup，显示 vehicleId
                      vehicleName = `Vehicle #${vehicleId}`;
                    }
                  }
                  
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
                            {customerName ? `${customerName} - ${vehicleName}` : vehicleName}
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
            padding: '28px',
            width: '96%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Create Order from Quote</h3>
              <button 
                onClick={handleDismissOrderForm}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleCreateOrderFromQuote}>
              <div style={orderSummaryCardStyle}>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Quote</div>
                <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                  #{selectedQuote.quoteId || selectedQuote.id} - ${(selectedQuote.finalTotal || selectedQuote.totalAmount || 0).toLocaleString()}
                </div>
              </div>

              <div style={orderFormGridStyle}>
                {/* Customer Selection - chỉ hiển thị cho DEALER_STAFF */}
                {userRole === 'DEALER_STAFF' && (
                  <div style={orderFormFullWidthStyle}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Customer *
                    </label>
                    <select
                      value={orderFormData.customerId || ''}
                      onChange={(e) => setOrderFormData({...orderFormData, customerId: e.target.value ? Number(e.target.value) : null})}
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
                      <option value="">-- Select Customer --</option>
                      {Object.values(customerLookup).map((customer) => {
                        const customerId = customer.id || customer.customerId || customer.userId;
                        const customerName = composeFullName(customer) || customer.email || customer.phone || `Customer #${customerId}`;
                        return (
                          <option key={customerId} value={customerId}>
                            {customerName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

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
                    <option value="CASH">Cash - pay in full</option>
                    <option value="TRANSFER">Bank Transfer</option>
                    <option value="VNPAY">VNPay - online payment</option>
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
                        {percent === 0 ? '0 (pay later via VNPay)' : `${percent}%`}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={orderFormFullWidthStyle}>
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

                <div style={{ ...orderFormFullWidthStyle }}>
                  <div style={installmentPreviewCardStyle}>
                    <div style={{ fontWeight: '600', color: 'var(--color-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="bx bx-pie-chart-alt-2" style={{ fontSize: '18px', color: 'var(--color-primary)' }}></i>
                      Installment Plan Preview (Optional)
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                      Choose an installment bundle to preview payments before creating the order. Be sure to set the first due date.
                    </p>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                        First Installment Due Date *
                      </label>
                      <input
                        type="date"
                        value={installmentFirstDueDate}
                        onChange={(e) => handleInstallmentFirstDueDateChange(e.target.value)}
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

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {INSTALLMENT_MONTH_OPTIONS.map((months) => {
                        const isActive = selectedInstallmentMonths === months;
                        return (
                          <button
                            key={months}
                            type="button"
                            className="btn"
                            style={{
                              padding: '8px 14px',
                              borderRadius: 'var(--radius)',
                              border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                              background: isActive ? 'var(--color-primary)' : 'var(--color-bg)',
                              color: isActive ? '#fff' : 'var(--color-text)',
                              fontWeight: 600,
                              fontSize: '13px',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => handlePreviewInstallment(months)}
                            disabled={installmentPreviewLoading}
                          >
                            {isActive && installmentPreviewLoading ? (
                              <>
                                <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                                Calculating...
                              </>
                            ) : (
                              `${months} months`
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {installmentPreviewError && (
                      <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '12px' }}>
                        {installmentPreviewError}
                      </div>
                    )}

                    {installmentPreviewLoading && !installmentPreview && (
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="bx bx-loader-alt bx-spin"></i>
                        Loading installment plan...
                      </div>
                    )}

                    {installmentPreview && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                          {[
                            { label: 'Principal total', value: formatCurrency(Number(installmentPreview.totalAmount || 0)) },
                            { label: 'VAT', value: formatCurrency(Number(installmentPreview.vatAmount || 0)) },
                            { label: 'Interest', value: formatCurrency(Number(installmentPreview.interestAmount || 0)) },
                            { label: 'Total payable', value: formatCurrency(Number(installmentPreview.totalPayable || 0)) },
                            { label: 'Term (months)', value: installmentPreview.months },
                            { label: 'Payment per period', value: formatCurrency(Number(installmentPreview.monthlyPayment || 0)) }
                          ].map((item) => (
                            <div
                              key={item.label}
                              style={{
                                padding: '12px',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius)',
                                background: 'var(--color-bg)'
                              }}
                            >
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                {item.label}
                              </div>
                              <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        {hasInstallmentSchedule ? (
                          <div
                            style={{
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius)',
                              overflow: 'hidden'
                            }}
                          >
                            <div style={{ padding: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                              Installment breakdown
                            </div>
                            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: '10px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'left' }}>#</th>
                                    <th style={{ padding: '10px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'left' }}>Due date</th>
                                    <th style={{ padding: '10px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'right' }}>Amount</th>
                                    <th style={{ padding: '10px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center' }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {installmentPreviewSchedule.map((item) => {
                                    const status = (item.status || '').toUpperCase();
                                    return (
                                      <tr
                                        key={`${item.installmentNumber}-${item.dueDate || 'unknown'}`}
                                        style={{ borderBottom: '1px solid var(--color-border)' }}
                                      >
                                        <td style={{ padding: '10px', fontSize: '13px', color: 'var(--color-text)' }}>
                                          {item.installmentNumber}
                                        </td>
                                        <td style={{ padding: '10px', fontSize: '13px', color: 'var(--color-text)' }}>
                                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td
                                          style={{
                                            padding: '10px',
                                            fontSize: '13px',
                                            color: 'var(--color-primary)',
                                            textAlign: 'right',
                                            fontWeight: 600
                                          }}
                                        >
                                          {formatCurrency(Number(item.amount || 0))}
                                        </td>
                                        <td style={{ padding: '10px', fontSize: '12px', textAlign: 'center' }}>
                                          <span
                                            style={{
                                              display: 'inline-block',
                                              padding: '4px 10px',
                                              borderRadius: '999px',
                                              background: 'var(--color-bg)',
                                              color:
                                                status === 'PAID'
                                                  ? 'var(--color-success)'
                                                  : status === 'PENDING'
                                                  ? 'var(--color-warning)'
                                                  : 'var(--color-text-muted)',
                                              fontWeight: 600
                                            }}
                                          >
                                            {status || 'UNKNOWN'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '12px',
                              border: '1px dashed var(--color-border)',
                              borderRadius: 'var(--radius)',
                              color: 'var(--color-text-muted)',
                              fontSize: '13px'
                            }}
                          >
                            No installment data available for this plan.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={handleDismissOrderForm}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderDetailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'calc(var(--radius) * 1.2)',
            padding: '24px',
            width: '92%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 48px rgba(15, 23, 42, 0.32)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-text)' }}>Order Details</h3>
                {activeOrderDetail?.displayOrderNumber && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    #{activeOrderDetail.displayOrderNumber}
                  </div>
                )}
              </div>
              <button
                onClick={handleCloseOrderDetailModal}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            {orderDetailLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                <div>Loading order details...</div>
              </div>
            ) : orderDetailError && !activeOrderDetail ? (
              <div style={{ padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-error)' }}>
                {orderDetailError || 'Unable to load order details.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orderDetailError && (
                  <div style={{ padding: '12px', borderRadius: 'var(--radius)', border: '1px solid rgba(248, 113, 113, 0.3)', background: 'rgba(248, 113, 113, 0.08)', color: 'var(--color-error)', fontSize: '13px' }}>
                    {orderDetailError}
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Status</div>
                    <div style={{ fontWeight: 700, color: getStatusColor(activeOrderDetail?.status, activeOrderDetail?.approvalStatus) }}>
                      {getStatusLabel(activeOrderDetail?.status, activeOrderDetail?.approvalStatus)}
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Created At</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {activeOrderDetail?.orderDate ? new Date(activeOrderDetail.orderDate).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Payment Method</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {activeOrderDetail?.displayPaymentMethod || activeOrderDetail?.paymentMethod || 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Total Amount</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {typeof activeOrderDetail?.totalAmount === 'number'
                        ? `$${Number(activeOrderDetail.totalAmount).toLocaleString()}`
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Customer info only for Dealer Staff */}
                {userRole === 'DEALER_STAFF' && (
                  <div style={{ padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      Customer
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                      <div><span style={{ color: 'var(--color-text)' }}>Name:</span> {activeOrderDetail?.displayCustomerName || 'N/A'}</div>
                      {activeOrderDetail?.resolvedCustomer?.email && (
                        <div><span style={{ color: 'var(--color-text)' }}>Email:</span> {activeOrderDetail.resolvedCustomer.email}</div>
                      )}
                      {activeOrderDetail?.resolvedCustomer?.phone && (
                        <div><span style={{ color: 'var(--color-text)' }}>Phone:</span> {activeOrderDetail.resolvedCustomer.phone}</div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  <div style={{ padding: '16px 16px 8px', fontWeight: 600, color: 'var(--color-text)', fontSize: '14px' }}>
                    Vehicle / Product
                  </div>
                  <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {[
                      { label: 'Full Name', value: activeOrderDetail?.displayVehicleName || activeOrderDetail?.resolvedVehicle?.modelName || 'N/A' },
                      { label: 'Brand', value: activeOrderDetail?.resolvedVehicle?.brand },
                      { label: 'Model', value: activeOrderDetail?.resolvedVehicle?.modelName || activeOrderDetail?.resolvedVehicle?.model },
                      { label: 'Variant', value: activeOrderDetail?.resolvedVehicle?.variantName },
                      { label: 'Year', value: activeOrderDetail?.resolvedVehicle?.yearOfManufacture },
                      { label: 'Vehicle Type', value: getVehicleTypeLabelFromOrder(activeOrderDetail) },
                      { label: 'VIN', value: activeOrderDetail?.resolvedVehicle?.vin }
                    ].filter(item => item.value).map((item) => (
                      <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 600 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {(activeOrderDetail?.notes || activeOrderDetail?.internalNotes) && (
                  <div style={{ padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      Notes
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                      {activeOrderDetail?.notes || activeOrderDetail?.internalNotes}
                    </div>
                  </div>
                )}

                {activeOrderDetail?.quoteId && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Source Quote: #{activeOrderDetail.quoteId}
                  </div>
                )}
              </div>
            )}
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
                {selectedOrder.displayOrderNumber || selectedOrder.orderNumber || selectedOrder.orderId}
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