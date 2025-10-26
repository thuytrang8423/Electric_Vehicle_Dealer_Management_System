import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const DealerManagement = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [dealers, setDealers] = useState([
    { id: 1, name: 'Metro Auto Group', location: 'New York', status: 'active', staff: 25, sales: 145, revenue: '$6.5M', phone: '+1 234 567 8900', email: 'contact@metroauto.com', address: '123 Broadway, New York, NY 10001' },
    { id: 2, name: 'City Motors', location: 'Los Angeles', status: 'active', staff: 18, sales: 132, revenue: '$5.9M', phone: '+1 234 567 8901', email: 'info@citymotors.com', address: '456 Sunset Blvd, Los Angeles, CA 90028' },
    { id: 3, name: 'Green Drive Dealers', location: 'Chicago', status: 'pending', staff: 12, sales: 108, revenue: '$4.8M', phone: '+1 234 567 8902', email: 'hello@greendrive.com', address: '789 Michigan Ave, Chicago, IL 60611' },
    { id: 4, name: 'Eco Auto Center', location: 'Miami', status: 'inactive', staff: 8, sales: 52, revenue: '$2.1M', phone: '+1 234 567 8903', email: 'support@ecoauto.com', address: '321 Ocean Dr, Miami, FL 33139' }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    address: '',
    status: 'pending'
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--color-success)';
      case 'pending': return 'var(--color-warning)';
      case 'inactive': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const handleAddDealer = () => {
    setEditingDealer(null);
    setFormData({
      name: '',
      location: '',
      phone: '',
      email: '',
      address: '',
      status: 'pending'
    });
    setShowModal(true);
  };

  const handleEditDealer = (dealer) => {
    setEditingDealer(dealer);
    setFormData({
      name: dealer.name,
      location: dealer.location,
      phone: dealer.phone,
      email: dealer.email,
      address: dealer.address,
      status: dealer.status
    });
    setShowModal(true);
  };

  const handleDeleteDealer = (dealerId) => {
    if (window.confirm('Are you sure you want to delete this dealer?')) {
      setDealers(dealers.filter(d => d.id !== dealerId));
      showSuccessToast('Dealer deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.phone || !formData.email) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorToast('Please enter a valid email address');
      return;
    }

    const dealerData = {
      name: formData.name,
      location: formData.location,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      status: formData.status
    };

    if (editingDealer) {
      // Update existing dealer
      setDealers(dealers.map(d => 
        d.id === editingDealer.id 
          ? { ...d, ...dealerData }
          : d
      ));
      showSuccessToast('Dealer updated successfully');
    } else {
      // Add new dealer
      const newDealer = {
        id: Math.max(...dealers.map(d => d.id)) + 1,
        ...dealerData,
        staff: 0,
        sales: 0,
        revenue: '$0'
      };
      setDealers([...dealers, newDealer]);
      showSuccessToast('Dealer added successfully');
    }

    setShowModal(false);
    setFormData({
      name: '',
      location: '',
      phone: '',
      email: '',
      address: '',
      status: 'pending'
    });
  };

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Dealer Management</h2>
          <button className="btn btn-primary" onClick={handleAddDealer}>
            <i className="bx bx-plus"></i>
            Add Dealer
          </button>
        </div>

        {/* Dealer Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Dealers', value: dealers.length, icon: 'bx-store', color: 'var(--color-primary)' },
            { label: 'Active', value: dealers.filter(d => d.status === 'active').length, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Total Staff', value: dealers.reduce((sum, d) => sum + d.staff, 0), icon: 'bx-group', color: 'var(--color-info)' },
            { label: 'Total Revenue', value: dealers.reduce((sum, d) => sum + parseFloat(d.revenue.replace('$', '').replace('M', '')), 0).toFixed(1) + 'M', icon: 'bx-dollar-circle', color: 'var(--color-warning)' }
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

        {/* Dealers Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Dealer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Location</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Staff</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Sales</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Revenue</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dealers.map((dealer) => (
                <tr key={dealer.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{dealer.name}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{dealer.location}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(dealer.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {dealer.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{dealer.staff}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>{dealer.sales}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>{dealer.revenue}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px' }}
                        onClick={() => handleEditDealer(dealer)}
                        title="Edit Dealer"
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px', color: 'var(--color-error)' }}
                        onClick={() => handleDeleteDealer(dealer.id)}
                        title="Delete Dealer"
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dealers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-store" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No dealers found</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAddDealer}>
              <i className="bx bx-plus"></i>
              Add First Dealer
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
              <h3>{editingDealer ? 'Edit Dealer' : 'Add New Dealer'}</h3>
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
                    Dealer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="Metro Auto Group"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="New York"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="contact@metroauto.com"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                    placeholder="123 Broadway, New York, NY 10001"
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
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                  {editingDealer ? 'Update Dealer' : 'Add Dealer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerManagement;