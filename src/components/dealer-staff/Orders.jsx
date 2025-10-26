import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const Orders = ({ user }) => {
  const [orders, setOrders] = useState([
    { 
      id: 'ORD-001', 
      customer: 'John Smith', 
      vehicle: 'Tesla Model 3', 
      amount: 45000, 
      status: 'processing', 
      date: '2024-01-15',
      paymentMethod: 'Bank Transfer',
      deliveryDate: '2024-02-15',
      notes: 'Customer prefers white color'
    },
    { 
      id: 'ORD-002', 
      customer: 'Sarah Johnson', 
      vehicle: 'BMW i3', 
      amount: 42000, 
      status: 'confirmed', 
      date: '2024-01-14',
      paymentMethod: 'Cash',
      deliveryDate: '2024-02-10',
      notes: 'Trade-in vehicle included'
    },
    { 
      id: 'ORD-003', 
      customer: 'Mike Chen', 
      vehicle: 'Nissan Leaf', 
      amount: 32000, 
      status: 'delivered', 
      date: '2024-01-10',
      paymentMethod: 'Credit Card',
      deliveryDate: '2024-01-25',
      notes: 'Delivered successfully'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customer: '',
    vehicle: '',
    amount: '',
    status: 'processing',
    paymentMethod: '',
    deliveryDate: '',
    notes: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'var(--color-warning)';
      case 'confirmed': return 'var(--color-info)';
      case 'delivered': return 'var(--color-success)';
      case 'cancelled': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddOrder = () => {
    setEditingOrder(null);
    setFormData({
      customer: '',
      vehicle: '',
      amount: '',
      status: 'processing',
      paymentMethod: '',
      deliveryDate: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setFormData({
      customer: order.customer,
      vehicle: order.vehicle,
      amount: order.amount.toString(),
      status: order.status,
      paymentMethod: order.paymentMethod,
      deliveryDate: order.deliveryDate,
      notes: order.notes
    });
    setShowModal(true);
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      setOrders(orders.filter(o => o.id !== orderId));
      showSuccessToast('Order deleted successfully');
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
    showSuccessToast(`Order status updated to ${newStatus}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.customer || !formData.vehicle || !formData.amount) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    const orderData = {
      customer: formData.customer,
      vehicle: formData.vehicle,
      amount: parseInt(formData.amount) || 0,
      status: formData.status,
      paymentMethod: formData.paymentMethod,
      deliveryDate: formData.deliveryDate,
      notes: formData.notes
    };

    if (editingOrder) {
      // Update existing order
      setOrders(orders.map(o => 
        o.id === editingOrder.id 
          ? { ...o, ...orderData }
          : o
      ));
      showSuccessToast('Order updated successfully');
    } else {
      // Add new order
      const newOrder = {
        id: `ORD-${String(Math.max(...orders.map(o => parseInt(o.id.split('-')[1]))) + 1).padStart(3, '0')}`,
        ...orderData,
        date: new Date().toISOString().split('T')[0]
      };
      setOrders([...orders, newOrder]);
      showSuccessToast('Order added successfully');
    }

    setShowModal(false);
    setFormData({
      customer: '',
      vehicle: '',
      amount: '',
      status: 'processing',
      paymentMethod: '',
      deliveryDate: '',
      notes: ''
    });
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const pendingOrders = orders.filter(o => o.status === 'processing').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="main">
      {/* Order Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Orders', value: orders.length, icon: 'bx-shopping-bag', color: 'var(--color-primary)' },
          { label: 'Processing', value: pendingOrders, icon: 'bx-time', color: 'var(--color-warning)' },
          { label: 'Delivered', value: deliveredOrders, icon: 'bx-check-circle', color: 'var(--color-success)' },
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
          <button className="btn btn-primary" onClick={handleAddOrder}>
            <i className="bx bx-plus"></i>
            Add Order
          </button>
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
            {['all', 'processing', 'confirmed', 'delivered', 'cancelled'].map(status => (
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
          {filteredOrders.map(order => (
            <div key={order.id} style={{ 
              padding: '20px', 
              background: 'var(--color-bg)', 
              borderRadius: 'var(--radius)',
              border: `1px solid var(--color-border)`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>{order.id}</h3>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: getStatusColor(order.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
                    {order.customer} - {order.vehicle}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    Order Date: {order.date} | Delivery: {order.deliveryDate}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '4px' }}>
                    ${order.amount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {order.paymentMethod}
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
                  {order.status === 'processing' && (
                    <button 
                      className="btn btn-primary" 
                      style={{ fontSize: '12px' }}
                      onClick={() => handleStatusChange(order.id, 'confirmed')}
                    >
                      <i className="bx bx-check"></i>
                      Confirm
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button 
                      className="btn btn-primary" 
                      style={{ fontSize: '12px' }}
                      onClick={() => handleStatusChange(order.id, 'delivered')}
                    >
                      <i className="bx bx-truck"></i>
                      Mark Delivered
                    </button>
                  )}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button 
                      className="btn btn-outline" 
                      style={{ fontSize: '12px', color: 'var(--color-error)' }}
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                    >
                      <i className="bx bx-x"></i>
                      Cancel
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '6px', fontSize: '14px' }}
                    onClick={() => handleEditOrder(order)}
                    title="Edit Order"
                  >
                    <i className="bx bx-edit"></i>
                  </button>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '6px', fontSize: '14px', color: 'var(--color-error)' }}
                    onClick={() => handleDeleteOrder(order.id)}
                    title="Delete Order"
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-shopping-bag" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No orders found</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAddOrder}>
              <i className="bx bx-plus"></i>
              Add First Order
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
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
              <h3>{editingOrder ? 'Edit Order' : 'Add New Order'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Vehicle *
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="Tesla Model 3"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Amount ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="45000"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
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
                      <option value="processing">Processing</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
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
                    <option value="">Select Payment Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Financing">Financing</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
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
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingOrder ? 'Update Order' : 'Add Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;