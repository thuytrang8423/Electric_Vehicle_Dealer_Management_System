import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const PromotionManagement = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [promotions, setPromotions] = useState([
    { id: 1, name: 'Holiday Special', discount: '10%', code: 'HOLIDAY2024', validFrom: '2024-01-01', validTo: '2024-02-01', status: 'active', applications: 156, description: 'Special holiday discount for all vehicles' },
    { id: 2, name: 'New Year Sale', discount: '15%', code: 'NEWYEAR2024', validFrom: '2024-01-15', validTo: '2024-01-31', status: 'active', applications: 89, description: 'New Year promotion for electric vehicles' },
    { id: 3, name: 'End of Year', discount: '20%', code: 'EOY2023', validFrom: '2023-12-01', validTo: '2023-12-31', status: 'expired', applications: 234, description: 'End of year clearance sale' }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    discount: '',
    code: '',
    validFrom: '',
    validTo: '',
    status: 'active',
    description: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--color-success)';
      case 'expired': return 'var(--color-error)';
      case 'pending': return 'var(--color-warning)';
      default: return 'var(--color-text-muted)';
    }
  };

  const filteredPromotions = promotions.filter(p => selectedStatus === 'all' || p.status === selectedStatus);

  const handleAddPromotion = () => {
    setEditingPromotion(null);
    setFormData({
      name: '',
      discount: '',
      code: '',
      validFrom: '',
      validTo: '',
      status: 'active',
      description: ''
    });
    setShowModal(true);
  };

  const handleEditPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      discount: promotion.discount,
      code: promotion.code,
      validFrom: promotion.validFrom,
      validTo: promotion.validTo,
      status: promotion.status,
      description: promotion.description
    });
    setShowModal(true);
  };

  const handleDeletePromotion = (promotionId) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      setPromotions(promotions.filter(p => p.id !== promotionId));
      showSuccessToast('Promotion deleted successfully');
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    showSuccessToast('Promotion code copied to clipboard');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.discount || !formData.code || !formData.validFrom || !formData.validTo) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    // Validate date range
    if (new Date(formData.validFrom) >= new Date(formData.validTo)) {
      showErrorToast('End date must be after start date');
      return;
    }

    const promotionData = {
      name: formData.name,
      discount: formData.discount,
      code: formData.code.toUpperCase(),
      validFrom: formData.validFrom,
      validTo: formData.validTo,
      status: formData.status,
      description: formData.description
    };

    if (editingPromotion) {
      // Update existing promotion
      setPromotions(promotions.map(p => 
        p.id === editingPromotion.id 
          ? { ...p, ...promotionData }
          : p
      ));
      showSuccessToast('Promotion updated successfully');
    } else {
      // Add new promotion
      const newPromotion = {
        id: Math.max(...promotions.map(p => p.id)) + 1,
        ...promotionData,
        applications: 0
      };
      setPromotions([...promotions, newPromotion]);
      showSuccessToast('Promotion created successfully');
    }

    setShowModal(false);
    setFormData({
      name: '',
      discount: '',
      code: '',
      validFrom: '',
      validTo: '',
      status: 'active',
      description: ''
    });
  };

  const totalPromotions = promotions.length;
  const activePromotions = promotions.filter(p => p.status === 'active').length;
  const totalApplications = promotions.reduce((sum, p) => sum + p.applications, 0);

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Promotion Management</h2>
          <button className="btn btn-primary" onClick={handleAddPromotion}>
            <i className="bx bx-plus"></i>
            Create Promotion
          </button>
        </div>

        {/* Promotion Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Promotions', value: totalPromotions, icon: 'bx-gift', color: 'var(--color-primary)' },
            { label: 'Active', value: activePromotions, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Total Applications', value: totalApplications, icon: 'bx-user', color: 'var(--color-info)' }
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
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['all', 'active', 'expired', 'pending'].map(status => (
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

        {/* Promotions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredPromotions.map((promo) => (
            <div key={promo.id} style={{
              padding: '20px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius)',
              border: `2px solid ${promo.status === 'active' ? 'var(--color-success)' : 'var(--color-border)'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
                    {promo.name}
                  </h3>
                  <div style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Code: <strong>{promo.code}</strong></div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-surface)',
                  color: getStatusColor(promo.status),
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {promo.status}
                </span>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-primary)', borderRadius: 'var(--radius)', color: 'white', fontWeight: '700', fontSize: '24px', marginBottom: '16px', textAlign: 'center' }}>
                {promo.discount} OFF
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                <i className="bx bx-calendar"></i> {promo.validFrom} to {promo.validTo}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                <i className="bx bx-user"></i> {promo.applications} applications
              </div>
              {promo.description && (
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px', fontStyle: 'italic' }}>
                  {promo.description}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => handleEditPromotion(promo)}
                >
                  <i className="bx bx-edit"></i>
                  Edit
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => handleCopyCode(promo.code)}
                  title="Copy Code"
                >
                  <i className="bx bx-copy"></i>
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => handleDeletePromotion(promo.id)}
                  style={{ color: 'var(--color-error)' }}
                  title="Delete Promotion"
                >
                  <i className="bx bx-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPromotions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-gift" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No promotions found</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAddPromotion}>
              <i className="bx bx-plus"></i>
              Create First Promotion
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
              <h3>{editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}</h3>
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
                    Promotion Name *
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
                    placeholder="Holiday Special"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Discount *
                    </label>
                    <input
                      type="text"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="10%"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="HOLIDAY2024"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Valid From *
                    </label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
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
                      Valid To *
                    </label>
                    <input
                      type="date"
                      value={formData.validTo}
                      onChange={(e) => setFormData({...formData, validTo: e.target.value})}
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
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                    placeholder="Description of the promotion..."
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
                  {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionManagement;