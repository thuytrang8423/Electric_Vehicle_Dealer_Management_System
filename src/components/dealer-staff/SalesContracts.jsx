import React, { useEffect, useMemo, useState } from 'react';
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
// HELPERS
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

  // Nếu documentImage là JSON meta (format cũ), parse để lấy URL
  // Nếu là URL string (format mới), dùng trực tiếp
  let documentImage = contract.documentImage || '';
  if (documentImage && documentImage.startsWith('{')) {
    // Format cũ: JSON meta
    documentImage = documentMeta?.cachedPdfUrl || documentMeta?.pdfUrl || documentMeta?.signatureUrl || documentImage;
  } else if (documentImage && !documentImage.startsWith('http') && !documentImage.startsWith('data:')) {
    // Có thể là JSON string chưa parse
    try {
      const parsed = JSON.parse(documentImage);
      documentImage = parsed.cachedPdfUrl || parsed.pdfUrl || parsed.signatureUrl || documentImage;
    } catch (e) {
      // Không phải JSON, dùng trực tiếp
    }
  }

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
    documentImage, // URL string hoặc từ meta
    documentMeta,
    notes: documentMeta?.notes || contract.notes || '',
    signedDate: contract.signedDate || contract.createdDate || contract.createdAt || '',
    createdAt: contract.createdAt || contract.createdDate || '',
    updatedAt: contract.updatedAt || '',
    totalAmount: order.totalAmount || order.amount || 0,
  };
};

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

const inferMimeFromUrl = (url) => {
  if (!url) return '';
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.pdf')) return 'application/pdf';
  if (clean.match(/\.(png|jpg|jpeg|gif)$/)) return 'image/png';
  return '';
};

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [contractImageUrl, setContractImageUrl] = useState('');
  const [contractImageFile, setContractImageFile] = useState(null);
  const [imageError, setImageError] = useState('');
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

  const resetForm = () => {
    setFormData({ ...defaultFormState, dealerId: dealerId ? String(dealerId) : '' });
    setContractImageUrl('');
    setContractImageFile(null);
    setImageError('');
    setDocumentPreviewUrl('');
    setDocumentPreviewMime('');
    setDocumentPreviewLoading(false);
    setShowDocumentModal(false);
  };

  const handleOpenModal = async () => {
    resetForm();
    setShowModal(true);
    setReferenceLoading(true);

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
    if (!contractImageUrl && !contractImageFile) {
      showErrorToast('Vui lòng upload hình ảnh hợp đồng trước khi lưu.');
      return;
    }

    try {
      setSubmitting(true);
      const orderId = Number(formData.orderId);
      const customerId = Number(formData.customerId);

      let imageUrl = contractImageUrl;

      // Nếu có file mới, upload lên Cloudinary
      if (contractImageFile) {
        setUploadingImage(true);
        try {
          const uploaded = await uploadFile(contractImageFile, 'image');
          imageUrl = uploaded.secure_url;
        } catch (uploadError) {
          console.error('Error uploading contract image:', uploadError);
          showErrorToast('Không thể upload hình ảnh hợp đồng. Vui lòng thử lại.');
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      if (!imageUrl) {
        showErrorToast('Vui lòng upload hình ảnh hợp đồng.');
        return;
      }

      const payload = {
        documentImage: imageUrl, // Chỉ lưu URL string, không cần JSON meta
        customerId,
        orderId,
        dealerId: Number(dealerId || formData.dealerId),
      };

      await contractsAPI.create(payload);
      showSuccessToast('Hợp đồng đã được tạo thành công');
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

  const handlePreviewContractDocument = async (contract) => {
    try {
      setShowDocumentModal(true);
      setDocumentPreviewLoading(true);
      setDocumentPreviewUrl('');
      setDocumentPreviewMime('');

      // Lấy image URL từ contract
      let imageUrl = contract.documentImage || '';

      // Nếu là JSON meta (format cũ), parse để lấy URL
      if (imageUrl && imageUrl.startsWith('{')) {
        try {
          const meta = JSON.parse(imageUrl);
          imageUrl = meta.cachedPdfUrl || meta.pdfUrl || meta.signatureUrl || imageUrl;
        } catch (e) {
          // Không phải JSON, dùng trực tiếp
        }
      }

      if (!imageUrl) {
        throw new Error('Hợp đồng chưa có hình ảnh.');
      }

      // Xác định mime type
      const mimeType = inferMimeFromUrl(imageUrl) || 'image/png';
      setDocumentPreviewMime(mimeType);
      setDocumentPreviewUrl(imageUrl);
    } catch (error) {
      console.error('Error loading contract image:', error);
      showErrorToast(error.message || 'Không thể tải hình ảnh hợp đồng.');
      setShowDocumentModal(false);
    } finally {
      setDocumentPreviewLoading(false);
    }
  };


  const handleCloseDocumentPreview = () => {
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
                            <i className="bx bx-show"></i> View
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
                    <label style={labelStyle}>Hình ảnh hợp đồng *</label>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              setImageError('Vui lòng chọn file hình ảnh (PNG, JPG, JPEG, etc.)');
                              return;
                            }
                            // Validate file size (max 10MB)
                            if (file.size > 10 * 1024 * 1024) {
                              setImageError('Kích thước file không được vượt quá 10MB');
                              return;
                            }
                            setContractImageFile(file);
                            setImageError('');
                            // Create preview URL
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setContractImageUrl(event.target.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ display: 'none' }}
                        id="contract-image-input"
                      />
                      <label
                        htmlFor="contract-image-input"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '24px',
                          border: '2px dashed var(--color-border)',
                          borderRadius: 'var(--radius)',
                          background: 'var(--color-surface)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.background = 'var(--color-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.background = 'var(--color-surface)';
                        }}
                      >
                        <i className="bx bx-cloud-upload" style={{ fontSize: '48px', color: 'var(--color-primary)', marginBottom: '8px' }}></i>
                        <div style={{ fontSize: '14px', color: 'var(--color-text)', marginBottom: '4px' }}>
                          Click để chọn hình ảnh hợp đồng
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          PNG, JPG, JPEG (Tối đa 10MB)
                        </div>
                      </label>
                      {contractImageUrl && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Preview:</div>
                          <img
                            src={contractImageUrl}
                            alt="Contract preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '300px',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--color-border)',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                      )}
                      {imageError && <div style={{ color: 'var(--color-error)', fontSize: '12px' }}>{imageError}</div>}
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
                <div style={{ marginTop: '12px' }}>Đang tải hình ảnh hợp đồng...</div>
              </div>
            ) : documentPreviewUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(80vh - 80px)', overflow: 'auto' }}>
                <img
                  src={documentPreviewUrl}
                  alt="Hình ảnh hợp đồng"
                  style={{
                    width: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)'
                  }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>Không thể tải hình ảnh hợp đồng.</div>
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