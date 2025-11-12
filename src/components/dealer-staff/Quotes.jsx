import React, { useState, useEffect } from 'react';
import { quotesAPI } from '../../utils/api/quotesAPI';
import { customersAPI } from '../../utils/api/customersAPI';
import { vehiclesAPI } from '../../utils/api/vehiclesAPI';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const Quotes = ({ user }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: '',
    vehicleId: '',
    quantity: 1,
    unitPrice: '',
    notes: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [customerLookup, setCustomerLookup] = useState({});
  const [vehicleLookup, setVehicleLookup] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [checkingQuoteId, setCheckingQuoteId] = useState(null);

  const userRole = user?.role?.toUpperCase().replace(/-/g, '_');
  const userId = user?.id || user?.userId || user?.user?.id;
  const dealerId = user?.dealerId || user?.user?.dealerId || null;

  // Load quotes based on role
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setLoading(true);
        let data = [];
        
        if (userRole === 'DEALER_STAFF' && userId) {
          // DEALER_STAFF: Get their own quotes
          data = await quotesAPI.getByUser(userId);
        } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
          // EVM_MANAGER/ADMIN: Get all quotes or pending EVM approval
          data = await quotesAPI.getAll();
        } else {
          // Default: Get all quotes
          data = await quotesAPI.getAll();
        }
        
        setQuotes(normalizeQuotes(data));
      } catch (error) {
        console.error('Error loading quotes:', error);
        showErrorToast(handleAPIError(error));
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, [userRole, userId]);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [customers, vehicles] = await Promise.all([
          dealerId ? customersAPI.getByDealer(dealerId) : customersAPI.getAll(),
          vehiclesAPI.getAll(),
        ]);

        setAvailableCustomers(Array.isArray(customers) ? customers : []);
        setAvailableVehicles(Array.isArray(vehicles) ? vehicles : []);
      } catch (error) {
        console.error('Failed to preload quote reference data:', error);
      }
    };

    if ((dealerId || userRole) && (availableCustomers.length === 0 || availableVehicles.length === 0)) {
      loadReferenceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealerId, userRole]);

  useEffect(() => {
    const map = {};
    availableCustomers.forEach((customer) => {
      const key = String(customer.id ?? customer.customerId);
      map[key] = customer;
    });
    setCustomerLookup(map);
  }, [availableCustomers]);

  useEffect(() => {
    const map = {};
    availableVehicles.forEach((vehicle) => {
      const key = String(vehicle.id ?? vehicle.vehicleId);
      map[key] = vehicle;
    });
    setVehicleLookup(map);
  }, [availableVehicles]);

  const getStatusColor = (status, approvalStatus) => {
    // Map approval status to colors
    if (approvalStatus === 'REJECTED') return 'var(--color-error)';
    if (approvalStatus === 'APPROVED' && status === 'ACCEPTED') return 'var(--color-success)';
    if (approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL' || approvalStatus === 'PENDING_EVM_APPROVAL') {
      return 'var(--color-warning)';
    }
    if (approvalStatus === 'DRAFT') return 'var(--color-text-muted)';
    return 'var(--color-info)';
  };

  const getStatusLabel = (status, approvalStatus) => {
    if (approvalStatus === 'REJECTED') return 'Rejected';
    if (approvalStatus === 'APPROVED' && status === 'ACCEPTED') return 'Approved - Ready for Order';
    if (approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL') return 'Pending Manager Approval';
    if (approvalStatus === 'PENDING_EVM_APPROVAL') return 'Pending EVM Approval';
    if (approvalStatus === 'APPROVED' && status === 'DRAFT') return 'Manager Approved - Pending EVM';
    if (approvalStatus === 'DRAFT') return 'Draft';
    return status || 'Unknown';
  };

  const normalizeQuotes = (data) =>
    Array.isArray(data)
      ? data.map((quote) => ({
          ...quote,
          quoteDetails: Array.isArray(quote.quoteDetails)
            ? quote.quoteDetails
            : [],
        }))
      : [];

  const resolveCustomer = (quote) =>
    customerLookup[String(quote.customerId)] || quote.customer;

  const resolveCustomerName = (quote) => {
    const customer = resolveCustomer(quote);
    if (!customer) {
      return quote.customerId ? `Customer #${quote.customerId}` : 'N/A';
    }
    return (
      customer.fullName ||
      customer.name ||
      customer.email ||
      (quote.customerId ? `Customer #${quote.customerId}` : 'N/A')
    );
  };

  const resolveVehicleDetail = (quote) => {
    const firstDetail = Array.isArray(quote.quoteDetails)
      ? quote.quoteDetails[0]
      : null;
    if (!firstDetail) return { detail: null, vehicle: null };
    const vehicle =
      vehicleLookup[String(firstDetail.vehicleId)] || quote.vehicle || null;
    return { detail: firstDetail, vehicle };
  };

  const resolveVehicleName = (quote) => {
    const { detail, vehicle } = resolveVehicleDetail(quote);
    if (vehicle) {
      return (
        vehicle.name ||
        vehicle.model ||
        vehicle.vehicleName ||
        (detail?.vehicleId ? `Vehicle #${detail.vehicleId}` : 'N/A')
      );
    }
    return detail?.vehicleId ? `Vehicle #${detail.vehicleId}` : 'N/A';
  };

  const resolveTotalAmount = (quote) => {
    const { detail } = resolveVehicleDetail(quote);
    return (
      quote.finalTotal ||
      quote.totalAmount ||
      detail?.totalAmount ||
      0
    );
  };

  const handleSubmitForApproval = async (quoteId) => {
    if (!userId) {
      showErrorToast('User ID not found');
      return;
    }

    try {
      await quotesAPI.submitForDealerManagerApproval(quoteId, userId);
      showSuccessToast('Quote submitted for manager approval successfully');
      // Reload quotes
      const data = await quotesAPI.getByUser(userId);
      setQuotes(normalizeQuotes(data));
    } catch (error) {
      console.error('Error submitting quote:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const handleCreateOrder = async (quote) => {
    const id = quote.quoteId || quote.id;
    if (!id) {
      showErrorToast('Quote information is invalid');
      return;
    }

    try {
      setCheckingQuoteId(id);
      const canCreate = await quotesAPI.canCreateOrder(id);

      if (canCreate !== true && canCreate !== 'true') {
        showErrorToast('Quote is not yet eligible to create an order. Please ensure it is approved and accepted.');
        return;
      }

      setSelectedQuote(quote);
      setShowCreateOrderModal(true);
    } catch (error) {
      console.error('Error checking quote eligibility:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setCheckingQuoteId(null);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'draft' && quote.approvalStatus === 'DRAFT') ||
      (selectedStatus === 'pending' && (quote.approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL' || quote.approvalStatus === 'PENDING_EVM_APPROVAL')) ||
      (selectedStatus === 'approved' && quote.approvalStatus === 'APPROVED' && quote.status === 'ACCEPTED') ||
      (selectedStatus === 'rejected' && quote.approvalStatus === 'REJECTED');
    
    const customerName = resolveCustomerName(quote);
    const vehicleName = resolveVehicleName(quote);
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quote.quoteId?.toString().includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });

  const canSubmitForApproval = (quote) => {
    return userRole === 'DEALER_STAFF' && 
           quote.approvalStatus === 'DRAFT' && 
           quote.status === 'DRAFT' &&
           quote.userId === userId;
  };

  const canCreateOrder = (quote) => {
    return (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') &&
           quote.approvalStatus === 'APPROVED' && 
           quote.status === 'ACCEPTED';
  };

  if (loading) {
    return (
      <div className="main">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}></i>
          <div style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>Loading quotes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Quotes Management</h2>
          {userRole === 'DEALER_STAFF' && (
            <button className="btn btn-primary" onClick={() => setShowCreateQuoteModal(true)}>
              <i className="bx bx-plus"></i>
              Create New Quote
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search quotes..."
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
            {['all', 'draft', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`btn ${selectedStatus === status ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Quotes Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Vehicle</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => {
                const customerName = resolveCustomerName(quote);
                const vehicleName = resolveVehicleName(quote);
                const totalAmount = resolveTotalAmount(quote);
                const statusColor = getStatusColor(quote.status, quote.approvalStatus);
                const statusLabel = getStatusLabel(quote.status, quote.approvalStatus);
                
                return (
                  <tr key={quote.quoteId || quote.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', fontWeight: '600' }}>
                      #{quote.quoteId || quote.id}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{customerName}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{vehicleName}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-primary)', fontWeight: '600', textAlign: 'right' }}>
                      ${totalAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: statusColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}>
                        {statusLabel}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {quote.createdDate ? new Date(quote.createdDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {canSubmitForApproval(quote) && (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleSubmitForApproval(quote.quoteId || quote.id)}
                            title="Submit for Manager Approval"
                          >
                            <i className="bx bx-send"></i>
                            Submit
                          </button>
                        )}
                        {canCreateOrder(quote) && (
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--color-success)' }}
                            onClick={() => handleCreateOrder(quote)}
                            title="Create Order from Quote"
                            disabled={checkingQuoteId === (quote.quoteId || quote.id)}
                          >
                            <i className={`bx ${checkingQuoteId === (quote.quoteId || quote.id) ? 'bx-loader-alt bx-spin' : 'bx-cart'}`}></i>
                            {checkingQuoteId === (quote.quoteId || quote.id) ? 'Checking...' : 'Create Order'}
                          </button>
                        )}
                        <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }} title="View Details">
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

        {filteredQuotes.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-file" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No quotes found</div>
          </div>
        )}
      </div>

      {/* Create Quote Modal */}
      {showCreateQuoteModal && (
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
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Create New Quote</h3>
              <button 
                onClick={() => setShowCreateQuoteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            {/* Load options when modal opens */}
            {(() => {
              // Inline effect alternative: when modal renders first time, load lists
              if (availableCustomers.length === 0 || availableVehicles.length === 0) {
                (async () => {
                  try {
                    const [customers, vehicles] = await Promise.all([
                      dealerId ? customersAPI.getByDealer(dealerId) : customersAPI.getAll(),
                      vehiclesAPI.getAll()
                    ]);
                    setAvailableCustomers(Array.isArray(customers) ? customers : []);
                    setAvailableVehicles(Array.isArray(vehicles) ? vehicles : []);
                  } catch (err) {
                    console.error('Failed to load dropdown data:', err);
                  }
                })();
              }
              return null;
            })()}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!userId) {
                showErrorToast('User ID not found');
                return;
              }
              if (!createForm.customerId || !createForm.vehicleId || !createForm.quantity || !createForm.unitPrice) {
                showErrorToast('Please fill in required fields');
                return;
              }
              try {
                setCreateLoading(true);
                const payload = {
                  customerId: Number(createForm.customerId),
                  notes: createForm.notes || '',
                  userId: Number(userId),
                  dealerId: dealerId ? Number(dealerId) : null,
                  creatorRole: 'DEALER_STAFF',
                  quoteDetails: [
                    {
                      vehicleId: Number(createForm.vehicleId),
                      quantity: Number(createForm.quantity),
                      unitPrice: Number(createForm.unitPrice),
                      promotionDiscount: 0,
                    },
                  ],
                };
                await quotesAPI.create(payload);
                showSuccessToast('Quote created successfully');
                // reload list
                const data = await quotesAPI.getByUser(userId);
                setQuotes(normalizeQuotes(data));
                setShowCreateQuoteModal(false);
                setCreateForm({ customerId: '', vehicleId: '', quantity: 1, unitPrice: '', notes: '' });
                setSelectedCustomer(null);
                setSelectedVehicle(null);
              } catch (error) {
                console.error('Error creating quote:', error);
                showErrorToast(handleAPIError(error));
              } finally {
                setCreateLoading(false);
              }
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Customer *
                  </label>
                  <select
                    value={createForm.customerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setCreateForm({ ...createForm, customerId: cid });
                      const c = availableCustomers.find(x => String(x.id || x.customerId) === String(cid));
                      setSelectedCustomer(c || null);
                    }}
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
                    <option value="">Select customer</option>
                    {availableCustomers.map(c => (
                      <option key={c.id || c.customerId} value={c.id || c.customerId}>
                        {(c.fullName || c.name || 'Unknown')} {c.isVip ? '(VIP)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedCustomer?.isVip && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-success)' }}>
                      VIP customer - discount will be applied automatically
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Vehicle *
                  </label>
                  <select
                    value={createForm.vehicleId}
                    onChange={(e) => {
                      const vid = e.target.value;
                      const v = availableVehicles.find(x => String(x.id || x.vehicleId) === String(vid));
                      setSelectedVehicle(v || null);
                      setCreateForm({ 
                        ...createForm, 
                        vehicleId: vid, 
                        unitPrice: v?.listedPrice ? Number(v.listedPrice) : createForm.unitPrice 
                      });
                      // If price not available in the preloaded list, fetch detail to get price
                      if (!v?.listedPrice && vid) {
                        vehiclesAPI.getById(vid).then(detail => {
                          if (detail?.listedPrice) {
                            setCreateForm(prev => ({ ...prev, unitPrice: Number(detail.listedPrice) }));
                          }
                        }).catch(() => {});
                      }
                    }}
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
                    <option value="">Select vehicle</option>
                    {availableVehicles.map(v => (
                      <option key={v.id || v.vehicleId} value={v.id || v.vehicleId}>
                        {(v.name || v.model || 'Vehicle')} {v.brand ? `- ${v.brand}` : ''} {v.listedPrice ? `($${Number(v.listedPrice).toLocaleString()})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={createForm.quantity}
                      onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
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
                      Unit Price ($) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.unitPrice}
                      onChange={(e) => setCreateForm({ ...createForm, unitPrice: e.target.value })}
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
                </div>
                {/* Discount is auto-handled by backend (VIP). Hidden in UI. */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Notes
                  </label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
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
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowCreateQuoteModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  Create Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Order Modal - Will be handled by Orders component */}
      {showCreateOrderModal && selectedQuote && (
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
              <h3>Create Order from Quote</h3>
              <button 
                onClick={() => {
                  setShowCreateOrderModal(false);
                  setSelectedQuote(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
              Quote #{selectedQuote.quoteId || selectedQuote.id} - Total: ${(selectedQuote.finalTotal || selectedQuote.totalAmount || 0).toLocaleString()}
            </p>
            <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
              Redirecting to Orders page to create order...
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setShowCreateOrderModal(false);
                  setSelectedQuote(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  // Store selected quote in localStorage or navigate to Orders with quoteId
                  localStorage.setItem('selectedQuoteForOrder', JSON.stringify(selectedQuote));
                  setShowCreateOrderModal(false);
                  setSelectedQuote(null);
                  // Trigger navigation to Orders - this will be handled by parent component
                  window.dispatchEvent(new CustomEvent('navigateToOrders', { detail: { quoteId: selectedQuote.quoteId || selectedQuote.id } }));
                }}
              >
                Go to Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotes;
