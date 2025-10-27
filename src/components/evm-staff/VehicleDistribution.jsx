import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const VehicleDistribution = ({ user }) => {
  const [distributions, setDistributions] = useState([
    {
      id: 'DIST-001',
      dealer: 'Metro Auto Group',
      vehicle: 'Tesla Model 3',
      quantity: 5,
      requestedDate: '2024-01-15',
      allocatedDate: '2024-01-16',
      shippedDate: '2024-01-18',
      deliveredDate: '2024-01-20',
      status: 'delivered',
      priority: 'high',
      warehouse: 'Central Warehouse',
      shippingMethod: 'Truck',
      trackingNumber: 'SHIP-001',
      notes: 'Urgent delivery for customer orders'
    },
    {
      id: 'DIST-002',
      dealer: 'City Motors',
      vehicle: 'BMW i3',
      quantity: 3,
      requestedDate: '2024-01-14',
      allocatedDate: '2024-01-15',
      shippedDate: null,
      deliveredDate: null,
      status: 'allocated',
      priority: 'normal',
      warehouse: 'Central Warehouse',
      shippingMethod: 'Truck',
      trackingNumber: null,
      notes: 'Regular monthly allocation'
    },
    {
      id: 'DIST-003',
      dealer: 'Green Drive Dealers',
      vehicle: 'Nissan Leaf',
      quantity: 8,
      requestedDate: '2024-01-10',
      allocatedDate: '2024-01-12',
      shippedDate: '2024-01-15',
      deliveredDate: null,
      status: 'in_transit',
      priority: 'normal',
      warehouse: 'Central Warehouse',
      shippingMethod: 'Truck',
      trackingNumber: 'SHIP-002',
      notes: 'Standard delivery'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingDistribution, setEditingDistribution] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    dealer: '',
    vehicle: '',
    quantity: '',
    priority: 'normal',
    warehouse: 'Central Warehouse',
    shippingMethod: 'Truck',
    notes: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'var(--color-info)';
      case 'allocated': return 'var(--color-primary)';
      case 'shipped': return 'var(--color-warning)';
      case 'in_transit': return 'var(--color-secondary)';
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

  const filteredDistributions = distributions.filter(distribution => {
    const matchesSearch = distribution.dealer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distribution.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distribution.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || distribution.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddDistribution = () => {
    setEditingDistribution(null);
    setFormData({
      dealer: '',
      vehicle: '',
      quantity: '',
      priority: 'normal',
      warehouse: 'Central Warehouse',
      shippingMethod: 'Truck',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEditDistribution = (distribution) => {
    setEditingDistribution(distribution);
    setFormData({
      dealer: distribution.dealer,
      vehicle: distribution.vehicle,
      quantity: distribution.quantity.toString(),
      priority: distribution.priority,
      warehouse: distribution.warehouse,
      shippingMethod: distribution.shippingMethod,
      notes: distribution.notes
    });
    setShowModal(true);
  };

  const handleStatusChange = (distributionId, newStatus) => {
    const updatedDistributions = distributions.map(d => {
      if (d.id === distributionId) {
        const updatedDistribution = { ...d, status: newStatus };
        
        // Update dates based on status
        if (newStatus === 'allocated' && !d.allocatedDate) {
          updatedDistribution.allocatedDate = new Date().toISOString().split('T')[0];
        }
        if (newStatus === 'shipped' && !d.shippedDate) {
          updatedDistribution.shippedDate = new Date().toISOString().split('T')[0];
          updatedDistribution.trackingNumber = `SHIP-${String(Math.max(...distributions.map(d => parseInt(d.trackingNumber?.split('-')[1] || '0'))) + 1).padStart(3, '0')}`;
        }
        if (newStatus === 'delivered' && !d.deliveredDate) {
          updatedDistribution.deliveredDate = new Date().toISOString().split('T')[0];
        }
        
        return updatedDistribution;
      }
      return d;
    });
    
    setDistributions(updatedDistributions);
    showSuccessToast(`Distribution status updated to ${newStatus.replace('_', ' ')}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.dealer || !formData.vehicle || !formData.quantity) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    const distributionData = {
      dealer: formData.dealer,
      vehicle: formData.vehicle,
      quantity: parseInt(formData.quantity) || 0,
      priority: formData.priority,
      warehouse: formData.warehouse,
      shippingMethod: formData.shippingMethod,
      notes: formData.notes,
      requestedDate: new Date().toISOString().split('T')[0]
    };

    if (editingDistribution) {
      setDistributions(distributions.map(d => 
        d.id === editingDistribution.id 
          ? { ...d, ...distributionData }
          : d
      ));
      showSuccessToast('Distribution updated successfully');
    } else {
      const newDistribution = {
        id: `DIST-${String(Math.max(...distributions.map(d => parseInt(d.id.split('-')[1]))) + 1).padStart(3, '0')}`,
        ...distributionData,
        status: 'requested',
        allocatedDate: null,
        shippedDate: null,
        deliveredDate: null,
        trackingNumber: null
      };
      setDistributions([...distributions, newDistribution]);
      showSuccessToast('Distribution created successfully');
    }

    setShowModal(false);
  };

  const totalDistributions = distributions.length;
  const pendingDistributions = distributions.filter(d => d.status === 'requested').length;
  const inTransitDistributions = distributions.filter(d => d.status === 'in_transit').length;
  const deliveredDistributions = distributions.filter(d => d.status === 'delivered').length;

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Vehicle Distribution Management</h2>
          <button className="btn btn-primary" onClick={handleAddDistribution}>
            <i className="bx bx-plus"></i>
            Create Distribution
          </button>
        </div>

        {/* Distribution Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Distributions', value: totalDistributions, icon: 'bx-package', color: 'var(--color-primary)' },
            { label: 'Pending', value: pendingDistributions, icon: 'bx-time', color: 'var(--color-warning)' },
            { label: 'In Transit', value: inTransitDistributions, icon: 'bx-truck', color: 'var(--color-info)' },
            { label: 'Delivered', value: deliveredDistributions, icon: 'bx-check-circle', color: 'var(--color-success)' }
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
                placeholder="Search distributions..."
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
            {['all', 'requested', 'allocated', 'shipped', 'in_transit', 'delivered', 'cancelled'].map(status => (
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

        {/* Distributions Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Distribution ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Dealer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Vehicle</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Quantity</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Priority</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Warehouse</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Tracking</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistributions.map((distribution) => (
                <tr key={distribution.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', fontWeight: '600' }}>{distribution.id}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{distribution.dealer}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{distribution.vehicle}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'center' }}>{distribution.quantity}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getPriorityColor(distribution.priority),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {distribution.priority}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(distribution.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {distribution.status.replace('_', ' ')}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{distribution.warehouse}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    {distribution.trackingNumber || 'N/A'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px' }}
                        onClick={() => handleEditDistribution(distribution)}
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                      {distribution.status === 'requested' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(distribution.id, 'allocated')}
                        >
                          <i className="bx bx-check"></i>
                        </button>
                      )}
                      {distribution.status === 'allocated' && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(distribution.id, 'shipped')}
                        >
                          <i className="bx bx-truck"></i>
                        </button>
                      )}
                      {distribution.status === 'shipped' && (
                        <button 
                          className="btn btn-warning" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(distribution.id, 'in_transit')}
                        >
                          <i className="bx bx-car"></i>
                        </button>
                      )}
                      {distribution.status === 'in_transit' && (
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(distribution.id, 'delivered')}
                        >
                          <i className="bx bx-check-circle"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDistributions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-package" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No distributions found</div>
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
              <h3>{editingDistribution ? 'Edit Distribution' : 'Create New Distribution'}</h3>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Warehouse
                    </label>
                    <select
                      value={formData.warehouse}
                      onChange={(e) => setFormData({...formData, warehouse: e.target.value})}
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
                      <option value="Central Warehouse">Central Warehouse</option>
                      <option value="North Warehouse">North Warehouse</option>
                      <option value="South Warehouse">South Warehouse</option>
                      <option value="East Warehouse">East Warehouse</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Shipping Method
                    </label>
                    <select
                      value={formData.shippingMethod}
                      onChange={(e) => setFormData({...formData, shippingMethod: e.target.value})}
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
                      <option value="Truck">Truck</option>
                      <option value="Rail">Rail</option>
                      <option value="Air">Air</option>
                      <option value="Sea">Sea</option>
                    </select>
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
                    placeholder="Special instructions or notes for this distribution..."
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
                  {editingDistribution ? 'Update Distribution' : 'Create Distribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDistribution;

