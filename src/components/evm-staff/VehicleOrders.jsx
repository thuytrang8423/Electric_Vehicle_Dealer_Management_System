import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const VehicleOrders = ({ user }) => {
  const [orders, setOrders] = useState([
    {
      id: 'VO-001',
      dealer: 'Metro Auto Group',
      vehicle: 'Tesla Model 3',
      quantity: 5,
      requestedDate: '2024-01-15',
      expectedDelivery: '2024-02-15',
      status: 'approved',
      priority: 'normal',
      notes: 'Customer demand high for this model',
      totalValue: 225000
    },
    {
      id: 'VO-002',
      dealer: 'City Motors',
      vehicle: 'BMW i3',
      quantity: 3,
      requestedDate: '2024-01-14',
      expectedDelivery: '2024-02-10',
      status: 'pending',
      priority: 'high',
      notes: 'Urgent order for upcoming promotion',
      totalValue: 126000
    },
    {
      id: 'VO-003',
      dealer: 'Green Drive Dealers',
      vehicle: 'Nissan Leaf',
      quantity: 8,
      requestedDate: '2024-01-10',
      expectedDelivery: '2024-02-05',
      status: 'delivered',
      priority: 'normal',
      notes: 'Regular monthly order',
      totalValue: 256000
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    dealer: '',
    vehicle: '',
    quantity: '',
    priority: 'normal',
    expectedDelivery: '',
    notes: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--color-warning)';
      case 'approved': return 'var(--color-info)';
      case 'in_production': return 'var(--color-primary)';
      case 'shipped': return 'var(--color-secondary)';
      case 'delivered': return 'var(--color-success)';
      case 'cancelled': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'var(--color-success)';
      case 'normal': return 'var(--color-info)';
      case 'high': return 'var(--color-warning)';
      case 'urgent': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.dealer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddOrder = () => {
    setEditingOrder(null);
    setFormData({
      dealer: '',
      vehicle: '',
      quantity: '',
      priority: 'normal',
      expectedDelivery: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setFormData({
      dealer: order.dealer,
      vehicle: order.vehicle,
      quantity: order.quantity.toString(),
      priority: order.priority,
      expectedDelivery: order.expectedDelivery,
      notes: order.notes
    });
    setShowModal(true);
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
    showSuccessToast(`Order status updated to ${newStatus}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.dealer || !formData.vehicle || !formData.quantity) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    const orderData = {
      dealer: formData.dealer,
      vehicle: formData.vehicle,
      quantity: parseInt(formData.quantity) || 0,
      priority: formData.priority,
      expectedDelivery: formData.expectedDelivery,
      notes: formData.notes,
      requestedDate: new Date().toISOString().split('T')[0],
      totalValue: parseInt(formData.quantity) * 45000 // Mock calculation
    };

    if (editingOrder) {
      setOrders(orders.map(o => 
        o.id === editingOrder.id 
          ? { ...o, ...orderData }
          : o
      ));
      showSuccessToast('Order updated successfully');
    } else {
      const newOrder = {
        id: `VO-${String(Math.max(...orders.map(o => parseInt(o.id.split('-')[1]))) + 1).padStart(3, '0')}`,
        ...orderData,
        status: 'pending'
      };
      setOrders([...orders, newOrder]);
      showSuccessToast('Order created successfully');
    }

    setShowModal(false);
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalValue = orders.reduce((sum, o) => sum + o.totalValue, 0);
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Vehicle Orders from Dealers</h2>
          <button className="btn btn-primary" onClick={handleAddOrder}>
            <i className="bx bx-plus"></i>
            Create Order
          </button>
        </div>

        {/* Order Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Orders', value: totalOrders, icon: 'bx-clipboard', color: 'var(--color-primary)' },
            { label: 'Pending', value: pendingOrders, icon: 'bx-time', color: 'var(--color-warning)' },
            { label: 'Delivered', value: deliveredOrders, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Total Value', value: `$${totalValue.toLocaleString()}`, icon: 'bx-dollar-circle', color: 'var(--color-info)' }
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

        {/* Filters */}
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
            {['all', 'pending', 'approved', 'in_production', 'shipped', 'delivered', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Order ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Dealer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Vehicle</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Quantity</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Priority</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Expected Delivery</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Total Value</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', fontWeight: '600' }}>{order.id}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{order.dealer}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{order.vehicle}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'center' }}>{order.quantity}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getPriorityColor(order.priority),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {order.priority}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(order.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {order.status.replace('_', ' ')}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{order.expectedDelivery}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-primary)', fontWeight: '600', textAlign: 'right' }}>
                    ${order.totalValue.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px' }}
                        onClick={() => handleEditOrder(order)}
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                      {order.status === 'pending' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(order.id, 'approved')}
                        >
                          <i className="bx bx-check"></i>
                        </button>
                      )}
                      {order.status === 'approved' && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(order.id, 'in_production')}
                        >
                          <i className="bx bx-cog"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-clipboard" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No orders found</div>
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>{editingOrder ? 'Edit Order' : 'Create New Order'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Dealer *
                    </label>
                    <select
                      value={formData.dealer}
                      onChange={(e) => setFormData({...formData, dealer: e.target.value})}
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
                      <option value="">Select Dealer</option>
                      <option value="Metro Auto Group">Metro Auto Group</option>
                      <option value="City Motors">City Motors</option>
                      <option value="Green Drive Dealers">Green Drive Dealers</option>
                      <option value="Eco Auto Center">Eco Auto Center</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Vehicle *
                    </label>
                    <select
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
                      required
                    >
                      <option value="">Select Vehicle</option>
                      <option value="Tesla Model 3">Tesla Model 3</option>
                      <option value="Tesla Model Y">Tesla Model Y</option>
                      <option value="BMW i3">BMW i3</option>
                      <option value="Nissan Leaf">Nissan Leaf</option>
                      <option value="Chevrolet Bolt">Chevrolet Bolt</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
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
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData({...formData, expectedDelivery: e.target.value})}
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
                    placeholder="Additional notes or special requirements..."
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
                  {editingOrder ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleOrders;

