import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const DeliveryTracking = ({ user }) => {
  const [deliveries, setDeliveries] = useState([
    {
      id: 'DEL-001',
      orderId: 'ORD-001',
      customer: 'John Smith',
      vehicle: 'Tesla Model 3',
      dealer: 'Metro Auto Group',
      status: 'in_transit',
      pickupDate: '2024-01-20',
      expectedDelivery: '2024-01-25',
      actualDelivery: null,
      driver: 'Mike Johnson',
      trackingNumber: 'TRK-001',
      currentLocation: 'Highway 101, CA',
      notes: 'Customer prefers morning delivery'
    },
    {
      id: 'DEL-002',
      orderId: 'ORD-002',
      customer: 'Jane Doe',
      vehicle: 'BMW i3',
      dealer: 'City Motors',
      status: 'delivered',
      pickupDate: '2024-01-18',
      expectedDelivery: '2024-01-22',
      actualDelivery: '2024-01-22',
      driver: 'Sarah Wilson',
      trackingNumber: 'TRK-002',
      currentLocation: 'Delivered',
      notes: 'Delivered successfully'
    },
    {
      id: 'DEL-003',
      orderId: 'ORD-003',
      customer: 'Mike Chen',
      vehicle: 'Nissan Leaf',
      dealer: 'Green Drive Dealers',
      status: 'ready_for_pickup',
      pickupDate: null,
      expectedDelivery: '2024-01-28',
      actualDelivery: null,
      driver: null,
      trackingNumber: 'TRK-003',
      currentLocation: 'Dealer Warehouse',
      notes: 'Vehicle prepared and ready'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    orderId: '',
    customer: '',
    vehicle: '',
    dealer: '',
    driver: '',
    expectedDelivery: '',
    notes: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready_for_pickup': return 'var(--color-info)';
      case 'picked_up': return 'var(--color-primary)';
      case 'in_transit': return 'var(--color-warning)';
      case 'out_for_delivery': return 'var(--color-secondary)';
      case 'delivered': return 'var(--color-success)';
      case 'delayed': return 'var(--color-error)';
      case 'cancelled': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready_for_pickup': return 'bx-package';
      case 'picked_up': return 'bx-truck';
      case 'in_transit': return 'bx-car';
      case 'out_for_delivery': return 'bx-map';
      case 'delivered': return 'bx-check-circle';
      case 'delayed': return 'bx-time-five';
      case 'cancelled': return 'bx-x-circle';
      default: return 'bx-package';
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || delivery.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddDelivery = () => {
    setEditingDelivery(null);
    setFormData({
      orderId: '',
      customer: '',
      vehicle: '',
      dealer: '',
      driver: '',
      expectedDelivery: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEditDelivery = (delivery) => {
    setEditingDelivery(delivery);
    setFormData({
      orderId: delivery.orderId,
      customer: delivery.customer,
      vehicle: delivery.vehicle,
      dealer: delivery.dealer,
      driver: delivery.driver || '',
      expectedDelivery: delivery.expectedDelivery,
      notes: delivery.notes
    });
    setShowModal(true);
  };

  const handleStatusChange = (deliveryId, newStatus) => {
    const updatedDeliveries = deliveries.map(d => {
      if (d.id === deliveryId) {
        const updatedDelivery = { ...d, status: newStatus };
        
        // Update dates based on status
        if (newStatus === 'picked_up' && !d.pickupDate) {
          updatedDelivery.pickupDate = new Date().toISOString().split('T')[0];
        }
        if (newStatus === 'delivered' && !d.actualDelivery) {
          updatedDelivery.actualDelivery = new Date().toISOString().split('T')[0];
        }
        
        return updatedDelivery;
      }
      return d;
    });
    
    setDeliveries(updatedDeliveries);
    showSuccessToast(`Delivery status updated to ${newStatus.replace('_', ' ')}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.orderId || !formData.customer || !formData.vehicle) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    const deliveryData = {
      orderId: formData.orderId,
      customer: formData.customer,
      vehicle: formData.vehicle,
      dealer: formData.dealer,
      driver: formData.driver,
      expectedDelivery: formData.expectedDelivery,
      notes: formData.notes,
      trackingNumber: `TRK-${String(Math.max(...deliveries.map(d => parseInt(d.trackingNumber.split('-')[1]))) + 1).padStart(3, '0')}`
    };

    if (editingDelivery) {
      setDeliveries(deliveries.map(d => 
        d.id === editingDelivery.id 
          ? { ...d, ...deliveryData }
          : d
      ));
      showSuccessToast('Delivery updated successfully');
    } else {
      const newDelivery = {
        id: `DEL-${String(Math.max(...deliveries.map(d => parseInt(d.id.split('-')[1]))) + 1).padStart(3, '0')}`,
        ...deliveryData,
        status: 'ready_for_pickup',
        pickupDate: null,
        actualDelivery: null,
        currentLocation: 'Dealer Warehouse'
      };
      setDeliveries([...deliveries, newDelivery]);
      showSuccessToast('Delivery created successfully');
    }

    setShowModal(false);
  };

  const totalDeliveries = deliveries.length;
  const inTransitDeliveries = deliveries.filter(d => d.status === 'in_transit').length;
  const deliveredToday = deliveries.filter(d => d.actualDelivery === new Date().toISOString().split('T')[0]).length;
  const delayedDeliveries = deliveries.filter(d => d.status === 'delayed').length;

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Delivery Tracking</h2>
          <button className="btn btn-primary" onClick={handleAddDelivery}>
            <i className="bx bx-plus"></i>
            Create Delivery
          </button>
        </div>

        {/* Delivery Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Deliveries', value: totalDeliveries, icon: 'bx-truck', color: 'var(--color-primary)' },
            { label: 'In Transit', value: inTransitDeliveries, icon: 'bx-car', color: 'var(--color-warning)' },
            { label: 'Delivered Today', value: deliveredToday, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Delayed', value: delayedDeliveries, icon: 'bx-time-five', color: 'var(--color-error)' }
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
                placeholder="Search deliveries..."
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
            {['all', 'ready_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'delayed', 'cancelled'].map(status => (
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

        {/* Deliveries Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Tracking #</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Vehicle</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Driver</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Current Location</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Expected Delivery</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', fontWeight: '600' }}>{delivery.trackingNumber}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{delivery.customer}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{delivery.vehicle}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{delivery.driver || 'Not assigned'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(delivery.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className={`bx ${getStatusIcon(delivery.status)}`}></i>
                      {delivery.status.replace('_', ' ')}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{delivery.currentLocation}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{delivery.expectedDelivery}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px' }}
                        onClick={() => handleEditDelivery(delivery)}
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                      {delivery.status === 'ready_for_pickup' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(delivery.id, 'picked_up')}
                        >
                          <i className="bx bx-truck"></i>
                        </button>
                      )}
                      {delivery.status === 'picked_up' && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(delivery.id, 'in_transit')}
                        >
                          <i className="bx bx-car"></i>
                        </button>
                      )}
                      {delivery.status === 'in_transit' && (
                        <button 
                          className="btn btn-warning" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(delivery.id, 'out_for_delivery')}
                        >
                          <i className="bx bx-map"></i>
                        </button>
                      )}
                      {delivery.status === 'out_for_delivery' && (
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(delivery.id, 'delivered')}
                        >
                          <i className="bx bx-check"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDeliveries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-truck" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No deliveries found</div>
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
              <h3>{editingDelivery ? 'Edit Delivery' : 'Create New Delivery'}</h3>
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
                      Order ID *
                    </label>
                    <input
                      type="text"
                      value={formData.orderId}
                      onChange={(e) => setFormData({...formData, orderId: e.target.value})}
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
                      Customer *
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
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Dealer
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
                    >
                      <option value="">Select Dealer</option>
                      <option value="Metro Auto Group">Metro Auto Group</option>
                      <option value="City Motors">City Motors</option>
                      <option value="Green Drive Dealers">Green Drive Dealers</option>
                      <option value="Eco Auto Center">Eco Auto Center</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Driver
                    </label>
                    <select
                      value={formData.driver}
                      onChange={(e) => setFormData({...formData, driver: e.target.value})}
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
                      <option value="">Select Driver</option>
                      <option value="Mike Johnson">Mike Johnson</option>
                      <option value="Sarah Wilson">Sarah Wilson</option>
                      <option value="David Brown">David Brown</option>
                      <option value="Lisa Garcia">Lisa Garcia</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Expected Delivery
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
                    placeholder="Special delivery instructions or notes..."
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
                  {editingDelivery ? 'Update Delivery' : 'Create Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracking;

