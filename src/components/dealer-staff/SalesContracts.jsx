import React, { useEffect, useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { contractsAPI, ordersAPI, customersAPI, vehiclesAPI } from '../../utils/api';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

// ----------------------
// CLOUDINARY UTILS
// ----------------------
const CLOUDINARY_CONFIG = {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dfmg8qv7g',
  upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'SWP-EVM',
};

const mapResourceType = (resourceType) => {
  if (!resourceType || resourceType === 'auto') return 'image';
  return resourceType; // 'image' | 'raw' | 'video'
};

/**
 * Uploads file to Cloudinary. Returns full response JSON (contains public_id, secure_url, resource_type, format, etc).
 * resourceType should be 'image' or 'raw'. For PDFs we will upload twice: raw (original) and image (thumbnail).
 */
export const uploadFile = async (file, resourceType = 'auto') => {
  try {
    const rt = mapResourceType(resourceType);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
    formData.append('resource_type', rt);

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/${rt}/upload`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

// ----------------------
// HELPERS (same as your file, lightly adjusted)
// ----------------------
const parseContractDocumentMeta = (value) => {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && parsed.type === 'CONTRACT_META_V1') {
      return parsed;
    }
  } catch (error) {
    // not JSON meta
  }
  return null;
};

const normalizeContract = (contract) => {
  if (!contract) return null;
  const customer = contract.customer || contract.customerInfo || {};
  const order = contract.order || contract.orderInfo || {};
  const status = (contract.status || contract.contractStatus || 'ACTIVE').toUpperCase();

  const documentMeta = parseContractDocumentMeta(contract.documentImage);

  let documentImage = documentMeta?.cachedPdfUrl || documentMeta?.pdfUrl || contract.documentImage || '';

  return {
    raw: contract,
    id: contract.contractId || contract.id || contract.contractCode || `CON-${contract.orderId || 'N/A'}`,
    customerName:
      contract.customerName ||
      customer.fullName ||
      customer.name ||
      `Customer #${contract.customerId || customer.id || 'N/A'}`,
    customerId: contract.customerId || customer.id || null,
    orderId: contract.orderId || order.orderId || order.id || null,
    orderNumber: order.orderNumber || `ORD-${order.orderId || order.id || 'N/A'}`,
    dealerId: contract.dealerId || order.dealerId || null,
    status,
    documentImage,
    documentMeta,
    signatureUrl: documentMeta?.signatureUrl || contract.signatureUrl || null,
    notes: documentMeta?.notes || contract.notes || '',
    signedDate: contract.signedDate || contract.createdDate || contract.createdAt || '',
    createdAt: contract.createdAt || contract.createdDate || '',
    updatedAt: contract.updatedAt || '',
    totalAmount: order.totalAmount || order.amount || 0,
  };
};

function formatCurrency(value) {
  const numeric = Number(value || 0);
  if (Number.isNaN(numeric)) {
    return '0 ₫';
  }
  const formatted = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }).format(numeric);
  return formatted.replace(/\u00A0/g, ' ');
}

async function getBase64FromUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const enrichOrderWithVehicles = async (order) => {
  if (!order) return order;
  const details = order.orderDetails || order.orderDetailDTOList || order.items || [];
  if (!Array.isArray(details) || details.length === 0) {
    return { ...order, orderDetails: Array.isArray(order.orderDetails) ? order.orderDetails : [] };
  }
  const vehicleIds = [
    ...new Set(
      details
        .map((detail) => detail.vehicleId || detail.vehicle?.id || detail.vehicle?.vehicleId)
        .filter(Boolean)
    ),
  ];
  if (vehicleIds.length === 0) {
    return { ...order, orderDetails: details };
  }
  const vehicleMap = new Map();
  await Promise.all(
    vehicleIds.map(async (vehicleId) => {
      try {
        const vehicle = await vehiclesAPI.getById(vehicleId);
        vehicleMap.set(vehicleId, vehicle);
      } catch (error) {
        console.warn('Failed to load vehicle info for ID', vehicleId, error);
      }
    })
  );
  const enrichedDetails = details.map((detail) => {
    const vehicleId = detail.vehicleId || detail.vehicle?.id || detail.vehicle?.vehicleId;
    const vehicle = vehicleMap.get(vehicleId);
    const existingVehicle = detail.vehicle || detail.vehicleInfo || null;
    return {
      ...detail,
      vehicle: vehicle || existingVehicle || null,
      vehicleInfo: vehicle || existingVehicle || null,
      vehicleName:
        detail.vehicleName ||
        vehicle?.name ||
        vehicle?.modelName ||
        existingVehicle?.name ||
        existingVehicle?.modelName ||
        null,
    };
  });
  return {
    ...order,
    orderDetails: enrichedDetails,
  };
};

const extractCustomerSnapshot = (customer) => {
  if (!customer) return null;
  const address =
    customer.address ||
    [
      customer.addressLine1,
      customer.addressLine2,
      customer.city,
      customer.province,
      customer.country,
    ]
      .filter(Boolean)
      .join(', ');

  return {
    id: customer.id || customer.customerId || null,
    fullName: customer.fullName || customer.name || customer.customerName || '',
    email: customer.email || '',
    phone: customer.phone || customer.phoneNumber || '',
    address,
  };
};

const extractOrderSnapshot = (order) => {
  if (!order) return null;
  const resolvedOrderId = order.orderId || order.id || null;
  const baseFields = {
    id: resolvedOrderId,
    orderId: resolvedOrderId,
    quoteId: order.quoteId || null,
    dealerId: order.dealerId || null,
    customerId: order.customerId || null,
    orderDate: order.orderDate || null,
    deliveryDate: order.deliveryDate || order.expectedDeliveryDate || null,
    paymentMethod: order.paymentMethod || order.payment_method || null,
    paymentStatus: order.paymentStatus || null,
    totalAmount: order.totalAmount,
    paidAmount: order.paidAmount,
    remainingAmount: order.remainingAmount,
  };

  const items = Array.isArray(order.orderDetails)
    ? order.orderDetails.map((detail) => ({
        vehicleId: detail.vehicleId || null,
        vehicleName:
          detail.vehicleName ||
          detail.vehicle?.name ||
          detail.vehicle?.modelName ||
          null,
        quantity: detail.quantity || detail.qty || 1,
        unitPrice: detail.unitPrice || detail.price || 0,
        totalAmount: detail.totalAmount || detail.lineTotal || 0,
      }))
    : [];

  return {
    ...baseFields,
    orderDetails: items,
  };
};

const isDataUri = (value) => typeof value === 'string' && value.startsWith('data:');

const extractMimeFromDataUri = (dataUri) => {
  if (!dataUri) return '';
  const match = dataUri.match(/^data:(.*?);/);
  return match ? match[1] : '';
};

const dataUriToBlob = (dataUri) => {
  if (!dataUri) return null;
  const arr = dataUri.split(',');
  if (arr.length < 2) return null;
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
  const binaryString = atob(arr[1]);
  const len = binaryString.length;
  const u8arr = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    u8arr[i] = binaryString.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
};

const dataUriToFile = (dataUri, filename) => {
  const blob = dataUriToBlob(dataUri);
  if (!blob) return null;
  if (typeof File !== 'undefined') {
    return new File([blob], filename, { type: blob.type || 'application/pdf' });
  }
  const fallbackBlob = new Blob([blob], { type: blob.type || 'application/pdf' });
  try {
    fallbackBlob.name = filename;
  } catch (error) {
    // ignore
  }
  return fallbackBlob;
};

const inferMimeFromUrl = (url) => {
  if (!url) return '';
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.pdf')) return 'application/pdf';
  if (clean.match(/\.(png|jpg|jpeg|gif)$/)) return 'image/png';
  return '';
};

const getExtensionFromMime = (mimeType) => {
  const normalized = (mimeType || '').toLowerCase();
  if (normalized === 'application/pdf') return 'pdf';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'jpg';
  if (normalized === 'image/gif') return 'gif';
  return '';
};

const sanitizeFilenameSegment = (value) => {
  return String(value || 'contract')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'contract';
};

const buildContractFilename = (contract, mimeType = 'application/pdf') => {
  const reference =
    contract?.orderId ||
    contract?.raw?.orderId ||
    contract?.raw?.contractId ||
    contract?.id ||
    'contract';
  const extension = getExtensionFromMime(mimeType) || 'pdf';
  return `sales-contract-${sanitizeFilenameSegment(reference)}.${extension}`;
};

const createObjectUrl = (blob) => {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('Object URL API is not available.');
  }
  return URL.createObjectURL(blob);
};

const revokeObjectUrl = (objectUrl) => {
  if (!objectUrl) return;
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(objectUrl);
  }
};

// ----------------------
// generateContractPdf (unchanged, returns data URI string)
// ----------------------
async function generateContractPdf({
  order,
  customer,
  dealer,
  dealerName,
  staff,
  notes,
  signatureUrl,
  contractDate,
}) {
  if (!order || !customer) {
    throw new Error('Missing order or customer information for contract PDF.');
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setProperties({
    title: `Sales Contract #${order.orderId || order.id || ''}`,
    subject: 'Electric Vehicle Sales Contract',
  });
  doc.setFont('helvetica', 'normal');

  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 25;
  const marginX = 20;

  const moveCursor = (spacing = 8) => {
    cursorY += spacing;
    if (cursorY > 280) {
      doc.addPage();
      cursorY = 20;
      doc.setFontSize(12);
    }
  };

  const addSectionTitle = (title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, marginX, cursorY);
    moveCursor(6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
  };

  const addText = (text, indent = 0, spacing = 7) => {
    const x = marginX + indent;
    const lines = Array.isArray(text) ? text : [text];
    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, pageWidth - x - 20);
      wrapped.forEach((wrappedLine) => {
        doc.text(wrappedLine, x, cursorY);
        moveCursor(spacing);
      });
    });
  };

  doc.setFontSize(18);
  doc.text('Electric Vehicle Sales Contract', pageWidth / 2, cursorY, {
    align: 'center',
  });
  doc.setFontSize(12);
  moveCursor(12);

  addSectionTitle('General Information');
  const contractDateText = contractDate
    ? new Date(contractDate).toLocaleDateString('vi-VN')
    : new Date().toLocaleDateString('vi-VN');
  addText(`Contract Date: ${contractDateText}`);
  if (dealerName) addText(`Dealer: ${dealerName}`);
  addText(`Dealer ID: ${dealer || 'N/A'}`);
  addText(`Order ID: ${order.orderId || order.id || 'N/A'}`);
  moveCursor(2);

  addSectionTitle('Customer Information');
  addText(`Name: ${customer.fullName || customer.name || customer.customerName || 'N/A'}`);
  if (customer.email) addText(`Email: ${customer.email}`);
  if (customer.phone || customer.phoneNumber) {
    addText(`Phone: ${customer.phone || customer.phoneNumber}`);
  }
  const customerAddress =
    customer.address ||
    [customer.addressLine1, customer.addressLine2, customer.city, customer.province]
      .filter(Boolean)
      .join(', ');
  if (customerAddress) {
    addText(`Address: ${customerAddress}`);
  }
  moveCursor(2);

  addSectionTitle('Order Summary');
  const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : null;
  if (orderDate) addText(`Order Date: ${orderDate}`);
  if (order.deliveryDate) {
    addText(`Expected Delivery: ${new Date(order.deliveryDate).toLocaleDateString('vi-VN')}`);
  }
  if (order.paymentMethod || order.payment_method) {
    addText(`Payment Method: ${order.paymentMethod || order.payment_method}`);
  }
  moveCursor(2);

  addSectionTitle('Vehicle Details');
  const orderItems = order.orderDetails || order.orderDetailDTOList || order.items || [];

  if (Array.isArray(orderItems) && orderItems.length > 0) {
    const columnHeaders = ['Vehicle', 'Qty', 'Unit Price', 'Line Total'];
    const columnWidths = [80, 20, 35, 35];

    doc.setFont('helvetica', 'bold');
    columnHeaders.reduce((currentX, header, index) => {
      doc.text(header, marginX + currentX, cursorY);
      return currentX + columnWidths[index];
    }, 0);
    moveCursor(6);
    doc.setFont('helvetica', 'normal');

    orderItems.forEach((detail) => {
      const vehicleInfo = detail.vehicle || detail.vehicleInfo || {};
      const vehicleName =
        detail.vehicleName ||
        vehicleInfo.name ||
        vehicleInfo.modelName ||
        `Vehicle #${detail.vehicleId || ''}`;
      const quantity = detail.quantity || detail.qty || 1;
      const unitPriceRaw =
        detail.unitPrice !== undefined && detail.unitPrice !== null
          ? detail.unitPrice
          : detail.price !== undefined && detail.price !== null
            ? detail.price
            : detail.listedPrice || 0;
      const unitPrice = Number(unitPriceRaw || 0);
      const lineTotalValue =
        detail.totalAmount !== undefined && detail.totalAmount !== null
          ? Number(detail.totalAmount)
          : unitPrice * quantity;
      const vehicleLines = doc.splitTextToSize(vehicleName, columnWidths[0] - 2);
      const requiredHeight = Math.max(vehicleLines.length * 6, 8);

      vehicleLines.forEach((line, i) => {
        doc.text(line, marginX, cursorY + i * 6);
      });
      doc.text(String(quantity), marginX + columnWidths[0], cursorY + 4);
      doc.text(formatCurrency(unitPrice), marginX + columnWidths[0] + columnWidths[1], cursorY + 4);
      doc.text(formatCurrency(lineTotalValue), marginX + columnWidths[0] + columnWidths[1] + columnWidths[2], cursorY + 4);
      moveCursor(requiredHeight + 2);
    });
  } else {
    addText('No detailed vehicle information available.', 4, 8);
  }

  const totalAmount =
    order.totalAmount ||
    order.amount ||
    order.finalTotal ||
    order.summaryTotal ||
    0;
  const paidAmount = order.paidAmount || 0;
  const remainingAmount =
    order.remainingAmount !== undefined ? order.remainingAmount : Math.max(totalAmount - paidAmount, 0);

  moveCursor(2);
  addSectionTitle('Financial Summary');
  addText(`Total Amount: ${formatCurrency(totalAmount)}`, 4);
  addText(`Paid Amount: ${formatCurrency(paidAmount)}`, 4);
  addText(`Outstanding Balance: ${formatCurrency(remainingAmount)}`, 4);
  if (order.depositAmount) {
    addText(`Deposit: ${formatCurrency(order.depositAmount)}`, 4);
  }
  if (order.paymentStatus) {
    addText(`Payment Status: ${order.paymentStatus}`, 4);
  }
  if (notes) {
    moveCursor(2);
    addSectionTitle('Additional Notes');
    addText(notes, 4);
  }

  moveCursor(2);
  addSectionTitle('Terms & Conditions');
  const terms = [
    'The customer agrees to the purchase details as outlined in this contract.',
    'Payment obligations must be fulfilled according to the agreed schedule. Late payments may incur additional charges.',
    'Vehicle delivery will be coordinated by the dealer upon confirmation of payment and completion of necessary paperwork.',
    'Warranty and after-sales services are provided according to manufacturer and dealer policies.',
    'Any amendments to this contract must be confirmed in writing and signed by both parties.',
  ];
  terms.forEach((term, idx) => addText(`${idx + 1}. ${term}`, 4));

  moveCursor(6);
  addSectionTitle('Signatures');
  const signatureBlockHeight = 30;
  const sectionWidth = (pageWidth - marginX * 2) / 2;

  doc.setFont('helvetica', 'bold');
  doc.text('Dealer Representative', marginX, cursorY);
  doc.text('Customer', marginX + sectionWidth, cursorY);
  moveCursor(8);
  doc.setFont('helvetica', 'normal');

  const staffName = staff?.name || 'Authorized Representative';
  const staffContact = [staff?.email, staff?.phone].filter(Boolean).join(' • ');
  doc.text(staffName, marginX, cursorY + signatureBlockHeight - 12);
  if (staffContact) {
    doc.setFont('helvetica', 'italic');
    doc.text(staffContact, marginX, cursorY + signatureBlockHeight - 6);
    doc.setFont('helvetica', 'normal');
  }

  const customerName = customer.fullName || customer.name || customer.customerName || 'Customer';
  doc.text(customerName, marginX + sectionWidth, cursorY + signatureBlockHeight - 6);

  if (signatureUrl) {
    try {
      const signatureDataUrl = await getBase64FromUrl(signatureUrl);
      doc.addImage(signatureDataUrl, 'PNG', marginX + sectionWidth, cursorY, Math.min(sectionWidth - 10, 60), signatureBlockHeight - 12);
    } catch (e) {
      console.warn('Failed to load signature image from URL:', signatureUrl, e);
      doc.setFont('helvetica', 'italic');
      doc.text('(Signature load failed)', marginX + sectionWidth, cursorY + 10);
      doc.setFont('helvetica', 'normal');
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('(Signature on file)', marginX + sectionWidth, cursorY + 10);
    doc.setFont('helvetica', 'normal');
  }
  moveCursor(signatureBlockHeight + 4);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  addText('This contract is generated electronically. Please keep a copy for your records.', 0, 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  return doc.output('datauristring');
}

// ----------------------
// SalesContracts component
// ----------------------
const defaultFormState = {
  customerId: '',
  orderId: '',
  dealerId: '',
  documentImage: '',
  notes: '',
};

const SalesContracts = ({ user }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [formData, setFormData] = useState(defaultFormState);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [orderPreview, setOrderPreview] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderModalLoading, setOrderModalLoading] = useState(false);
  const [viewingContract, setViewingContract] = useState(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState('');
  const [documentPreviewLoading, setDocumentPreviewLoading] = useState(false);
  const [documentPreviewMime, setDocumentPreviewMime] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const dealerId = user?.dealerId || user?.user?.dealerId || user?.user?.dealer?.id || null;
  const staffDisplayName =
    user?.fullName ||
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Authorized Representative';
  const dealerDisplayName = user?.dealerName || user?.dealer?.name || (dealerId ? `Dealer #${dealerId}` : '');

  const canvasRef = useRef(null);
  const drawingStateRef = useRef({ isDrawing: false, lastX: 0, lastY: 0 });
  const previewObjectUrlRef = useRef(null);

  const releasePreviewObjectUrl = () => {
    if (previewObjectUrlRef.current) {
      revokeObjectUrl(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  };

  const normalizedRole = user?.role?.toUpperCase().replace(/-/g, '_');
  const isDealerRole = normalizedRole === 'DEALER_MANAGER' || normalizedRole === 'DEALER_STAFF';

  const loadContracts = async (options = {}) => {
    try {
      setLoading(true);
      const { search } = options;
      let data;
      if (search && search.trim()) {
        data = await contractsAPI.searchByCustomerName(search.trim());
      } else if (isDealerRole && dealerId) {
        data = await contractsAPI.getByDealer(dealerId);
      } else {
        data = await contractsAPI.getAll();
      }
      const normalized = Array.isArray(data) ? data.map(normalizeContract).filter(Boolean) : [];
      setContracts(normalized);
    } catch (error) {
      console.error('Error loading contracts:', error);
      showErrorToast(handleAPIError(error));
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedRole, dealerId]);

  useEffect(() => {
    return () => {
      releasePreviewObjectUrl();
    };
  }, []);

  const resetForm = () => {
    setFormData({ ...defaultFormState, dealerId: dealerId ? String(dealerId) : '' });
    setSignatureUrl('');
    setSignatureError('');
    releasePreviewObjectUrl();
    setDocumentPreviewUrl('');
    setDocumentPreviewMime('');
    setDocumentPreviewLoading(false);
    setShowDocumentModal(false);
  };

  const handleOpenModal = async () => {
    resetForm();
    setShowModal(true);
    setReferenceLoading(true);
    setTimeout(() => {
      initializeCanvas();
    }, 50);

    try {
      const [orders, customers] = await Promise.all([
        dealerId ? ordersAPI.getByDealer(dealerId) : ordersAPI.getAll(),
        dealerId ? customersAPI.getByDealer(dealerId) : customersAPI.getAll(),
      ]);
      setAvailableOrders(Array.isArray(orders) ? orders : []);
      setAvailableCustomers(Array.isArray(customers) ? customers : []);
    } catch (error) {
      console.error('Error loading contract references:', error);
      showErrorToast(handleAPIError(error));
      setAvailableOrders([]);
      setAvailableCustomers([]);
    } finally {
      setReferenceLoading(false);
    }
  };

  // ---------- handleSubmit: generate PDF, upload raw + thumb, save meta ----------
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.orderId || !formData.customerId) {
      showErrorToast('Please select order and customer');
      return;
    }
    if (!dealerId && !formData.dealerId) {
      showErrorToast('Dealer information is required');
      return;
    }
    if (!signatureUrl) {
      showErrorToast('Please capture and upload the contract signature before saving.');
      return;
    }

    try {
      setSubmitting(true);
      const orderId = Number(formData.orderId);
      const customerId = Number(formData.customerId);

      const [orderResponse, customerResponse] = await Promise.all([
        ordersAPI.getById(orderId),
        customersAPI.getById(customerId),
      ]);

      if (!orderResponse) throw new Error('Unable to load order details for contract PDF.');
      if (!customerResponse) throw new Error('Unable to load customer details for contract PDF.');

      const hydratedOrder = await enrichOrderWithVehicles(orderResponse);
      const pdfDataUri = await generateContractPdf({
        order: hydratedOrder,
        customer: customerResponse,
        dealer: Number(dealerId || formData.dealerId),
        dealerName: dealerDisplayName,
        staff: {
          name: staffDisplayName,
          email: user?.email,
          phone: user?.phoneNumber || user?.phone,
        },
        notes: formData.notes || '',
        signatureUrl,
        contractDate: new Date().toISOString(),
      });

      const pdfFile = dataUriToFile(pdfDataUri, `sales-contract-${orderId}.pdf`);
      if (!pdfFile) throw new Error('Failed to prepare contract PDF file.');

      // Upload original PDF as raw (preserve original) and also upload image to generate thumbnail
      const uploadRaw = await uploadFile(pdfFile, 'raw');    // original pdf
      // Upload image to rasterize first page as thumbnail
      const uploadThumb = await uploadFile(pdfFile, 'image'); // cloud will rasterize page 1

      const pdfUrl = uploadRaw.secure_url;
      const pdfPublicId = uploadRaw.public_id;
      const thumbUrl = uploadThumb.secure_url;
      const thumbPublicId = uploadThumb.public_id;

      const documentMeta = {
        type: 'CONTRACT_META_V1',
        signatureUrl,
        notes: formData.notes || '',
        dealerId: Number(dealerId || formData.dealerId),
        customerId,
        orderId,
        staffName: staffDisplayName,
        generatedAt: new Date().toISOString(),
        cachedPdfUrl: thumbUrl,
        cachedPdfPublicId: thumbPublicId,
        pdfUrl,
        pdfPublicId,
        customerSnapshot: extractCustomerSnapshot(customerResponse),
        orderSnapshot: extractOrderSnapshot(hydratedOrder),
      };

      const payload = {
        documentImage: JSON.stringify(documentMeta),
        customerId,
        orderId,
        dealerId: Number(dealerId || formData.dealerId),
      };

      await contractsAPI.create(payload);
      showSuccessToast('Contract created successfully');
      setShowModal(false);
      resetForm();
      loadContracts();
    } catch (error) {
      console.error('Error creating contract:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = () => {
    loadContracts({ search: searchTerm });
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    loadContracts();
  };

  const handleViewOrder = async (contract) => {
    if (!contract) return;
    const contractId = contract.raw?.contractId || contract.raw?.id || contract.id;
    if (!contractId) {
      showErrorToast('Contract information is missing');
      return;
    }
    try {
      setOrderModalLoading(true);
      setShowOrderModal(true);
      setViewingContract(contract);
      let order = contract.documentMeta?.orderSnapshot || null;
      if (!order && contract.orderId) {
        try {
          order = await ordersAPI.getById(contract.orderId);
        } catch (fetchError) {
          console.warn('Unable to fetch order by ID for modal, fallback to contract endpoint:', fetchError);
        }
      }
      if (!order) order = await contractsAPI.getOrderByContract(contractId);
      const hydrated = await enrichOrderWithVehicles(order);
      setOrderPreview(hydrated);
    } catch (error) {
      console.error('Error loading order for contract:', error);
      showErrorToast(handleAPIError(error));
      setOrderPreview(null);
    } finally {
      setOrderModalLoading(false);
    }
  };

  // --------------- Canvas signature handlers (unchanged except upload usage) ---------------
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const width = 480;
    const height = 220;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(ratio, ratio);
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.lineWidth = 2.5;
    context.strokeStyle = '#111827';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  };

  const getCanvasCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (event.touches && event.touches[0]) {
      return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handleDrawStart = (event) => {
    const { x, y } = getCanvasCoordinates(event);
    drawingStateRef.current.isDrawing = true;
    drawingStateRef.current.lastX = x;
    drawingStateRef.current.lastY = y;
    event.preventDefault();
    setSignatureError('');
  };

  const handleDrawMove = (event) => {
    if (!drawingStateRef.current.isDrawing) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(event);

    context.beginPath();
    context.moveTo(drawingStateRef.current.lastX, drawingStateRef.current.lastY);
    context.lineTo(x, y);
    context.stroke();

    drawingStateRef.current.lastX = x;
    drawingStateRef.current.lastY = y;
  };

  const handleDrawEnd = (event) => {
    if (!drawingStateRef.current.isDrawing) return;
    handleDrawMove(event);
    drawingStateRef.current.isDrawing = false;
    event.preventDefault();
  };

  const handleClearSignature = () => {
    initializeCanvas();
    setSignatureUrl('');
  };

  const handleUploadSignature = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        setSignatureError('Canvas is not ready. Please try again.');
        return;
      }

      const blank = document.createElement('canvas');
      blank.width = canvas.width;
      blank.height = canvas.height;
      if (canvas.toDataURL() === blank.toDataURL()) {
        setSignatureError('Please provide a signature before uploading.');
        return;
      }

      setUploadingSignature(true);
      setSignatureError('');
      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `contract-signature-${Date.now()}.png`, { type: 'image/png' });

      // Upload signature as image
      const uploaded = await uploadFile(file, 'image');
      setSignatureUrl(uploaded.secure_url);
      showSuccessToast('Signature uploaded successfully');
    } catch (error) {
      console.error('Signature upload failed:', error);
      setSignatureError(error.message || 'Failed to upload the signature');
      showErrorToast(handleAPIError(error));
    } finally {
      setUploadingSignature(false);
    }
  };

  // --------------- prepareContractDocument & preview/download ---------------
  const prepareContractDocument = async (contract) => {
    if (!contract) throw new Error('Contract data is missing.');
    const existingMeta = contract.documentMeta || parseContractDocumentMeta(contract.documentImage);

    let documentUrl = existingMeta?.cachedPdfUrl || existingMeta?.pdfUrl || null;

    if (!documentUrl && contract.documentImage && typeof contract.documentImage === 'string' && !contract.documentImage.startsWith('{')) {
      documentUrl = contract.documentImage;
    }

    if (documentUrl && typeof documentUrl === 'string' && !isDataUri(documentUrl)) {
      return {
        url: documentUrl,
        mime: inferMimeFromUrl(documentUrl) || 'image/png',
        meta: existingMeta || null,
      };
    }
    if (isDataUri(documentUrl)) {
      return {
        url: documentUrl,
        mime: extractMimeFromDataUri(documentUrl) || 'application/pdf',
        meta: existingMeta || null,
      };
    }

    // regenerate PDF if not found
    const contractId = contract.raw?.contractId || contract.raw?.id || contract.id;
    if (!contractId || !contract.customerId) {
      throw new Error('Cannot regenerate contract: missing order/customer info.');
    }

    let order = existingMeta?.orderSnapshot || null;
    if (contract.orderId && !order) {
      try {
        order = await ordersAPI.getById(contract.orderId);
      } catch (error) {
        console.warn('Unable to fetch order by ID:', error);
      }
    }
    if (!order) order = await contractsAPI.getOrderByContract(contractId);

    order = await enrichOrderWithVehicles(order);
    const customer = existingMeta?.customerSnapshot || (await customersAPI.getById(contract.customerId));
    const signatureSource = existingMeta?.signatureUrl || contract.signatureUrl || null;

    const dataUri = await generateContractPdf({
      order,
      customer,
      dealer: contract.dealerId || dealerId,
      dealerName: dealerDisplayName,
      staff: {
        name: existingMeta?.staffName || staffDisplayName,
        email: user?.email,
        phone: user?.phoneNumber || user?.phone,
      },
      notes: existingMeta?.notes || contract.notes || '',
      signatureUrl: signatureSource,
      contractDate: contract.signedDate || contract.createdAt || existingMeta?.generatedAt,
    });

    const file = dataUriToFile(dataUri, `contract-regenerated-${contractId}.pdf`);
    if (!file) throw new Error('Failed to regenerate PDF file.');

    // Upload regenerated files (raw + image thumbnail)
    const uploadRaw = await uploadFile(file, 'raw');
    const uploadThumb = await uploadFile(file, 'image');

    // Optionally, could update contract meta via API here to persist regenerated urls (left to you)
    return {
      url: uploadThumb.secure_url,
      mime: inferMimeFromUrl(uploadThumb.secure_url) || 'image/png',
      meta: {
        ...existingMeta,
        cachedPdfUrl: uploadThumb.secure_url,
        cachedPdfPublicId: uploadThumb.public_id,
        pdfUrl: uploadRaw.secure_url,
        pdfPublicId: uploadRaw.public_id,
      },
    };
  };

  const handlePreviewContractDocument = async (contract) => {
    try {
      setShowDocumentModal(true);
      setDocumentPreviewLoading(true);
      setDocumentPreviewUrl('');
      setDocumentPreviewMime('');
      releasePreviewObjectUrl();

      const prepared = await prepareContractDocument(contract);
      if (!prepared || !prepared.url) throw new Error('Contract document is not available.');

      if (isDataUri(prepared.url)) {
        const blob = dataUriToBlob(prepared.url);
        const mimeType = extractMimeFromDataUri(prepared.url) || 'application/pdf';
        const objectUrl = createObjectUrl(blob);
        previewObjectUrlRef.current = objectUrl;
        setDocumentPreviewMime(mimeType);
        setDocumentPreviewUrl(objectUrl);
      } else {
        // direct url (Cloudinary secure_url). If it's an image, show <img>, if pdf show iframe.
        const mimeType = prepared.mime || inferMimeFromUrl(prepared.url);
        setDocumentPreviewMime(mimeType || 'image/png');
        setDocumentPreviewUrl(prepared.url);
      }
    } catch (error) {
      releasePreviewObjectUrl();
      console.error('Error preparing contract document for preview:', error);
      showErrorToast(error.message || 'Unable to load contract document.');
      setShowDocumentModal(false);
    } finally {
      setDocumentPreviewLoading(false);
    }
  };

  const handleDownloadContract = async (contract) => {
    try {
      const meta = contract.documentMeta || parseContractDocumentMeta(contract.documentImage);
      if (!meta) throw new Error('No document meta');

      const cloud = CLOUDINARY_CONFIG.cloud_name;
      const filename = buildContractFilename(contract, 'application/pdf');
      const safeFilename = filename.replace(/\s/g, '_');

      // Prefer original raw pdf public_id
      if (meta.pdfPublicId) {
        const downloadUrl = `https://res.cloudinary.com/${cloud}/raw/upload/fl_attachment:${encodeURIComponent(safeFilename)}/${meta.pdfPublicId}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Fallback: direct secure_url (pdfUrl)
      if (meta.pdfUrl) {
        const link = document.createElement('a');
        link.href = meta.pdfUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // If only have thumbnail image, try to convert/raster -> pdf via transformation
      if (meta.cachedPdfPublicId) {
        const downloadUrl = `https://res.cloudinary.com/${cloud}/image/upload/fl_attachment:${encodeURIComponent(safeFilename)},f_pdf/${meta.cachedPdfPublicId}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      throw new Error('No downloadable document available.');
    } catch (err) {
      console.error(err);
      showErrorToast(err.message || 'Unable to download contract document.');
    }
  };

  const handleCloseDocumentPreview = () => {
    releasePreviewObjectUrl();
    setShowDocumentModal(false);
    setDocumentPreviewUrl('');
    setDocumentPreviewMime('');
    setDocumentPreviewLoading(false);
  };

  const isPdfDocument = (url) => {
    if (documentPreviewMime) {
      return documentPreviewMime.toLowerCase() === 'application/pdf';
    }
    if (!url) return false;
    if (url.startsWith('data:application/pdf')) return true;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.pdf') || lowerUrl.includes('application/pdf');
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const statusMatch = filterStatus === 'all' || contract.status.toLowerCase() === filterStatus.toLowerCase();
      return statusMatch;
    });
  }, [contracts, filterStatus]);

  const totalContracts = contracts.length;
  const activeContracts = contracts.filter((contract) => contract.status === 'ACTIVE').length;

  // ----------------------
  // RENDER
  // ----------------------
  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h2>Sales Contracts</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={handleResetSearch}>
              <i className="bx bx-refresh"></i>
              Reset
            </button>
            <button className="btn btn-primary" onClick={handleOpenModal}>
              <i className="bx bx-plus"></i>
              Create Contract
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Contracts', value: totalContracts, icon: 'bx-file', color: 'var(--color-primary)' },
            { label: 'Active Contracts', value: activeContracts, icon: 'bx-check-circle', color: 'var(--color-success)' },
          ].map((stat, index) => (
            <div key={index} style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px' }}>
                  <i className={`bx ${stat.icon}`}></i>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{stat.label}</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '14px' }}
              />
            </div>
          </div>
          <button className="btn btn-outline" onClick={handleSearch}>Search</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'active', 'completed', 'expired', 'cancelled'].map((status) => (
              <button key={status} onClick={() => setFilterStatus(status)} className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`} style={{ textTransform: 'capitalize' }}>
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
            <div>Loading contracts...</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={tableHeaderStyle}>Contract ID</th>
                    <th style={tableHeaderStyle}>Customer</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Status</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={tableCellStyle}><strong>{contract.id}</strong></td>
                      <td style={tableCellStyle}>{contract.customerName}</td>
                      <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: 'var(--radius)', background: 'var(--color-bg)', color: contract.status === 'ACTIVE' ? 'var(--color-success)' : contract.status === 'COMPLETED' ? 'var(--color-info)' : contract.status === 'CANCELLED' ? 'var(--color-error)' : 'var(--color-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                          {contract.status}
                        </span>
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => handlePreviewContractDocument(contract)}>
                            <i className="bx bx-show"></i> Preview
                          </button>
                          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => handleDownloadContract(contract)}>
                            <i className="bx bx-download"></i> Download
                          </button>
                          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => handleViewOrder(contract)}>
                            <i className="bx bx-spreadsheet"></i> Order
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredContracts.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-file" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <div>No contracts found.</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Contract Modal */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle}>
            <div style={modalHeaderStyle}>
              <h3>Create Contract</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={closeButtonStyle}><i className="bx bx-x"></i></button>
            </div>

            {referenceLoading ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '36px' }}></i>
                <div style={{ marginTop: '12px' }}>Loading reference data...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Order *</label>
                    <select value={formData.orderId} onChange={(e) => setFormData((prev) => ({ ...prev, orderId: e.target.value }))} style={inputStyle} required>
                      <option value="">Select order</option>
                      {availableOrders.map((order) => {
                        const id = order.orderId || order.id;
                        const customerName = order.customer?.fullName || order.customerName || `Customer #${order.customerId}`;
                        return <option key={id} value={id}>{`#${id} - ${customerName}`}</option>;
                      })}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Customer *</label>
                    <select value={formData.customerId} onChange={(e) => setFormData((prev) => ({ ...prev, customerId: e.target.value }))} style={inputStyle} required>
                      <option value="">Select customer</option>
                      {availableCustomers.map((customer) => (
                        <option key={customer.id || customer.customerId} value={customer.id || customer.customerId}>
                          {customer.fullName || customer.name || customer.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!dealerId && (
                    <div>
                      <label style={labelStyle}>Dealer ID *</label>
                      <input type="number" value={formData.dealerId} onChange={(e) => setFormData((prev) => ({ ...prev, dealerId: e.target.value }))} style={inputStyle} required />
                    </div>
                  )}

                  <div>
                    <label style={labelStyle}>Contract Signature *</label>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <canvas
                        ref={canvasRef}
                        onMouseDown={handleDrawStart}
                        onMouseMove={handleDrawMove}
                        onMouseUp={handleDrawEnd}
                        onMouseLeave={handleDrawEnd}
                        onTouchStart={handleDrawStart}
                        onTouchMove={handleDrawMove}
                        onTouchEnd={handleDrawEnd}
                        style={{ border: '1px dashed var(--color-border)', borderRadius: '8px', background: '#ffffff', touchAction: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-outline" onClick={handleClearSignature} disabled={uploadingSignature}><i className="bx bx-eraser"></i> Clear</button>
                        <button type="button" className="btn btn-primary" onClick={handleUploadSignature} disabled={uploadingSignature}>
                          {uploadingSignature ? <><i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i> Uploading...</> : <><i className="bx bx-cloud-upload" style={{ marginRight: '6px' }}></i> Upload Signature</>}
                        </button>
                      </div>
                      {signatureError && <div style={{ color: 'var(--color-error)', fontSize: '12px' }}>{signatureError}</div>}
                      {signatureUrl && (
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', background: 'var(--color-surface)' }}>
                          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Uploaded Signature URL</div>
                          <a href={signatureUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', wordBreak: 'break-all' }}>{signatureUrl}</a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Notes</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Additional notes..." />
                  </div>
                </div>

                <div style={modalFooterStyle}>
                  <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); resetForm(); }} disabled={submitting}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i> Creating...</> : <><i className="bx bx-check" style={{ marginRight: '6px' }}></i> Create Contract</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContainerStyle, maxWidth: '640px' }}>
            <div style={modalHeaderStyle}>
              <h3>Order Details</h3>
              <button onClick={() => { setShowOrderModal(false); setOrderPreview(null); setViewingContract(null); }} style={closeButtonStyle}><i className="bx bx-x"></i></button>
            </div>

            {orderModalLoading ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '36px' }}></i>
                <div style={{ marginTop: '12px' }}>Loading order details...</div>
              </div>
            ) : orderPreview ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={orderInfoCardStyle}><span style={orderInfoLabel}>Order ID</span><strong>{orderPreview.orderId || viewingContract?.orderId}</strong></div>
                  <div style={orderInfoCardStyle}><span style={orderInfoLabel}>Customer</span><strong>{orderPreview.customer?.fullName || orderPreview.customerName || viewingContract?.customerName || 'N/A'}</strong></div>
                  <div style={orderInfoCardStyle}><span style={orderInfoLabel}>Total Amount</span><strong>${Number(orderPreview.totalAmount || orderPreview.amount || viewingContract?.totalAmount || 0).toLocaleString()}</strong></div>
                </div>

                <div>
                  <h4 style={{ marginBottom: '8px' }}>Vehicles</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ ...tableHeaderStyle, padding: '8px' }}>Vehicle</th>
                          <th style={{ ...tableHeaderStyle, padding: '8px', textAlign: 'center' }}>Quantity</th>
                          <th style={{ ...tableHeaderStyle, padding: '8px', textAlign: 'right' }}>Unit Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(orderPreview.orderDetails || orderPreview.items || []).map((detail, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '8px', fontSize: '14px' }}>{detail.vehicle?.name || detail.vehicleName || `Vehicle #${detail.vehicleId}`}</td>
                            <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{detail.quantity || detail.qty || 1}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', color: 'var(--color-primary)', fontWeight: 600 }}>${Number(detail.unitPrice || detail.price || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>Unable to load order details.</div>
            )}
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContainerStyle, maxWidth: '720px', width: '90%', height: '80vh' }}>
            <div style={modalHeaderStyle}>
              <h3>Contract Document</h3>
              <button onClick={handleCloseDocumentPreview} style={closeButtonStyle}><i className="bx bx-x"></i></button>
            </div>
            {documentPreviewLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px' }}></i>
                <div style={{ marginTop: '12px' }}>Preparing document preview...</div>
              </div>
            ) : documentPreviewUrl ? (
              isPdfDocument(documentPreviewUrl) ? (
                <iframe src={documentPreviewUrl} title="Contract Document" style={{ width: '100%', height: 'calc(80vh - 80px)', border: 'none', borderRadius: 'var(--radius)', background: '#f5f5f5' }} />
              ) : (
                <img src={documentPreviewUrl} alt="Contract Document" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }} />
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>Unable to load contract preview.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------
// STYLES
// ----------------------
const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
};

const tableCellStyle = {
  padding: '12px',
  fontSize: '14px',
  color: 'var(--color-text)',
  verticalAlign: 'middle',
};

const modalOverlayStyle = {
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
  padding: '16px',
};

const modalContainerStyle = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  padding: '24px',
  width: '100%',
  maxWidth: '520px',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
};

const modalFooterStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '24px',
  justifyContent: 'flex-end',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: 'var(--color-text-muted)',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontSize: '14px',
};

const orderInfoCardStyle = {
  flex: '1 1 160px',
  padding: '12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  background: 'var(--color-bg)',
};

const orderInfoLabel = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--color-text-muted)',
  marginBottom: '4px',
};

export default SalesContracts;