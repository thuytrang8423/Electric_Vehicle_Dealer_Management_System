import React, { useState, useEffect, useMemo } from 'react';
import { installmentsAPI } from '../../utils/api/installmentsAPI';
import { ordersAPI } from '../../utils/api/ordersAPI';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const InstallmentManagement = ({ user }) => {
  // State for Orders List
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // State for Installment Logic
  const [schedule, setSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [payingScheduleId, setPayingScheduleId] = useState(null);

  // State for Create Plan Form
  const [createForm, setCreateForm] = useState({
    months: 12,
    firstDueDate: '',
  });
  const [previewResult, setPreviewResult] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  // Permissions
  const canManage = useMemo(() => {
    const role = (user?.role || '').toUpperCase();
    return role === 'DEALER_MANAGER' || role === 'ADMIN';
  }, [user]);

  // Fetch Orders on Mount
  useEffect(() => {
    if (canManage) {
      fetchOrders();
    }
  }, [canManage]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      // In a real app, you might want to filter by dealer if the user is a dealer manager
      // For now, we fetch all and filter client-side or assume API handles it
      const data = await ordersAPI.getAll();
      // Filter for eligible orders (e.g., not cancelled)
      const eligibleOrders = Array.isArray(data) ? data.filter(o => o.status !== 'CANCELLED') : [];
      setOrders(eligibleOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showErrorToast('Failed to load orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Filter Orders
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const lowerTerm = searchTerm.toLowerCase();
    return orders.filter(o =>
      String(o.orderId || o.id).includes(lowerTerm) ||
      (o.customerName || '').toLowerCase().includes(lowerTerm) ||
      (o.status || '').toLowerCase().includes(lowerTerm)
    );
  }, [orders, searchTerm]);

  // Handle Order Selection
  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
    setSchedule([]);
    setPreviewResult(null);
    setCreateForm({
      months: 12,
      firstDueDate: new Date().toISOString().split('T')[0] // Default to today
    });

    // Fetch existing schedule
    const orderId = order.orderId || order.id;
    try {
      setLoadingSchedule(true);
      const data = await installmentsAPI.getByOrder(orderId);
      if (Array.isArray(data) && data.length > 0) {
        setSchedule(data);
      } else {
        setSchedule([]);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      // Don't show error toast here, just assume no schedule
      setSchedule([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Handle Preview
  const handlePreview = async () => {
    if (!selectedOrder) return;

    // Calculate remaining amount
    const totalAmount = selectedOrder.totalAmount || selectedOrder.amount || 0;
    const paidAmount = selectedOrder.paidAmount || 0;
    const remaining = Math.max(totalAmount - paidAmount, 0);

    if (remaining <= 0) {
      showErrorToast('This order is fully paid.');
      return;
    }

    const request = {
      totalAmount: remaining,
      months: Number(createForm.months),
      annualInterestRate: 0, // Fixed to 0
      firstDueDate: createForm.firstDueDate
    };

    try {
      setLoadingPreview(true);
      const result = await installmentsAPI.preview(request);
      setPreviewResult(result);
    } catch (error) {
      console.error('Error previewing:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handle Create Plan
  const handleCreatePlan = async () => {
    if (!selectedOrder || !previewResult) return;

    const orderId = selectedOrder.orderId || selectedOrder.id;
    const request = {
      totalAmount: previewResult.totalAmount,
      months: Number(createForm.months),
      annualInterestRate: 0,
      firstDueDate: createForm.firstDueDate
    };

    try {
      setLoadingCreate(true);
      await installmentsAPI.generate(orderId, request);
      showSuccessToast('Installment plan created successfully!');
      // Refresh schedule
      const data = await installmentsAPI.getByOrder(orderId);
      setSchedule(data);
    } catch (error) {
      console.error('Error creating plan:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setLoadingCreate(false);
    }
  };

  // Handle Pay Installment
  const handlePayInstallment = async (item) => {
    if (!window.confirm(`Confirm marking installment #${item.installmentNumber} as PAID?`)) return;

    try {
      setPayingScheduleId(item.id);
      await installmentsAPI.payInstallment(item.id);
      showSuccessToast('Installment marked as paid.');

      // Refresh schedule
      const orderId = selectedOrder.orderId || selectedOrder.id;
      const data = await installmentsAPI.getByOrder(orderId);
      setSchedule(data);
    } catch (error) {
      console.error('Error paying installment:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setPayingScheduleId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="main">
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <i className="bx bx-error" style={{ fontSize: '48px', color: 'var(--color-warning)' }}></i>
          <h3 style={{ marginTop: '16px' }}>Access Denied</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Only Managers can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '20px' }}>Installment Management</h2>

      <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
        {/* LEFT PANEL: ORDER LIST */}
        <div className="card" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search Order ID, Customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)'
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingOrders ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-loader-alt bx-spin"></i> Loading...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No orders found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredOrders.map(order => {
                  const isSelected = selectedOrder && (selectedOrder.orderId || selectedOrder.id) === (order.orderId || order.id);
                  return (
                    <div
                      key={order.orderId || order.id}
                      onClick={() => handleSelectOrder(order)}
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                        borderLeft: isSelected ? '4px solid var(--color-primary)' : '4px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600' }}>#{order.orderNumber || order.orderId || order.id}</span>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)'
                        }}>
                          {order.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{order.customerName || 'Unknown Customer'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Remaining: <span style={{ color: 'var(--color-warning)', fontWeight: '600' }}>
                          ${((order.totalAmount || order.amount || 0) - (order.paidAmount || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: DETAILS */}
        <div className="card" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {!selectedOrder ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              <i className="bx bx-selection" style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}></i>
              <h3>Select an order to manage installments</h3>
            </div>
          ) : (
            <>
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '8px' }}>Order #{selectedOrder.orderNumber || selectedOrder.orderId || selectedOrder.id}</h3>
                <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                  <div>Customer: <b>{selectedOrder.customerName}</b></div>
                  <div>Total: <b>${(selectedOrder.totalAmount || selectedOrder.amount || 0).toLocaleString()}</b></div>
                  <div>Paid: <b style={{ color: 'var(--color-success)' }}>${(selectedOrder.paidAmount || 0).toLocaleString()}</b></div>
                  <div>Remaining: <b style={{ color: 'var(--color-warning)' }}>${((selectedOrder.totalAmount || selectedOrder.amount || 0) - (selectedOrder.paidAmount || 0)).toLocaleString()}</b></div>
                </div>
              </div>

              {loadingSchedule ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px' }}></i>
                </div>
              ) : schedule.length > 0 ? (
                /* VIEW EXISTING SCHEDULE */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0 }}>Current Installment Plan</h4>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {schedule.filter(i => i.status === 'PAID').length} / {schedule.length} Paid
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                          <th style={thStyle}>#</th>
                          <th style={thStyle}>Due Date</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((item, idx) => (
                          <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={tdStyle}>{item.installmentNumber}</td>
                            <td style={tdStyle}>{new Date(item.dueDate).toLocaleDateString()}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>
                              ${(item.amount || 0).toLocaleString()}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: item.status === 'PAID' ? 'var(--color-success)' : 'var(--color-warning)',
                                color: 'white'
                              }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              {item.status !== 'PAID' && (
                                <button
                                  className="btn btn-primary"
                                  style={{ fontSize: '12px', padding: '4px 12px' }}
                                  onClick={() => handlePayInstallment(item)}
                                  disabled={payingScheduleId === item.id}
                                >
                                  {payingScheduleId === item.id ? 'Processing...' : 'Mark as Paid'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* CREATE NEW PLAN */
                <div style={{ maxWidth: '600px' }}>
                  <div style={{
                    padding: '16px',
                    background: 'rgba(var(--primary-rgb), 0.05)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '24px',
                    border: '1px solid rgba(var(--primary-rgb), 0.2)'
                  }}>
                    <h4 style={{ marginTop: 0, color: 'var(--color-primary)' }}>No active installment plan</h4>
                    <p style={{ marginBottom: 0, fontSize: '14px' }}>
                      This order has a remaining balance of <b>${((selectedOrder.totalAmount || selectedOrder.amount || 0) - (selectedOrder.paidAmount || 0)).toLocaleString()}</b>.
                      You can create a new installment plan below.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <label style={labelStyle}>Months</label>
                      <input
                        type="number"
                        min="1"
                        max="36"
                        value={createForm.months}
                        onChange={e => setCreateForm({ ...createForm, months: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>First Due Date</label>
                      <input
                        type="date"
                        value={createForm.firstDueDate}
                        onChange={e => setCreateForm({ ...createForm, firstDueDate: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <button
                      className="btn btn-outline"
                      onClick={handlePreview}
                      disabled={loadingPreview}
                    >
                      {loadingPreview ? 'Calculating...' : 'Preview Plan'}
                    </button>
                  </div>

                  {previewResult && (
                    <div style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      padding: '16px',
                      background: 'var(--color-bg)'
                    }}>
                      <h4 style={{ marginTop: 0 }}>Preview</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Monthly Payment</div>
                          <div style={{ fontSize: '18px', fontWeight: '600' }}>${previewResult.monthlyPayment?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total Payable</div>
                          <div style={{ fontSize: '18px', fontWeight: '600' }}>${previewResult.totalPayable?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Interest</div>
                          <div style={{ fontSize: '18px', fontWeight: '600' }}>${previewResult.interestAmount?.toLocaleString()}</div>
                        </div>
                      </div>

                      <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={handleCreatePlan}
                        disabled={loadingCreate}
                      >
                        {loadingCreate ? 'Creating...' : 'Confirm & Create Plan'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '12px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--color-text-muted)',
  borderBottom: '2px solid var(--color-border)'
};

const tdStyle = {
  padding: '12px',
  fontSize: '14px',
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)'
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--color-text-muted)'
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)'
};

export default InstallmentManagement;

