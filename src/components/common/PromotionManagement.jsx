import React, { useState, useEffect } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { promotionsAPI, handleAPIError } from '../../utils/api';
import 'boxicons/css/boxicons.min.css';

const PromotionManagement = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    programName: '',
    description: '',
    startDate: '',
    endDate: '',
    conditions: '',
    discountValue: '',
    status: 'ACTIVE'
  });

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const userData = JSON.parse(userStr);
        return userData.id || userData.userId || userData['user Id'];
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return null;
  };

  // Load promotions from API
  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await promotionsAPI.getAll();
      if (Array.isArray(data)) {
        setPromotions(data);
      } else {
        console.warn('Expected array but got:', typeof data);
        setPromotions([]);
      }
    } catch (error) {
      console.error('Failed to load promotions:', error);
      const errorMessage = handleAPIError(error);
      showErrorToast(errorMessage);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'var(--color-success)';
      case 'EXPIRED': return 'var(--color-error)';
      case 'DRAFT': return 'var(--color-warning)';
      default: return 'var(--color-text-muted)';
    }
  };

  const filteredPromotions = promotions.filter(p => selectedStatus === 'all' || p.status === selectedStatus);

  const handleAddPromotion = () => {
    setEditingPromotion(null);
    setFormData({
      programName: '',
      description: '',
      startDate: '',
      endDate: '',
      conditions: '',
      discountValue: '',
      status: 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleEditPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      programName: promotion.programName,
      description: promotion.description,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      conditions: promotion.conditions,
      discountValue: promotion.discountValue,
      status: promotion.status
    });
    setShowModal(true);
  };

  const handleDeletePromotion = async (promotionId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) {
      return;
    }

    try {
      await promotionsAPI.delete(promotionId);
      setPromotions(prevPromotions => prevPromotions.filter(p => p.id !== promotionId));
      showSuccessToast('Promotion deleted successfully');
    } catch (error) {
      console.error('Failed to delete promotion:', error);
      const errorMessage = handleAPIError(error);
      showErrorToast(errorMessage);
    }
  };

  const handleCopyCode = (code) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        showSuccessToast('Promotion code copied to clipboard');
      }).catch(() => {
        showErrorToast('Failed to copy to clipboard');
      });
    } else {
      showErrorToast('Clipboard not supported');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPromotion(null);
    setFormData({
      programName: '',
      description: '',
      startDate: '',
      endDate: '',
      conditions: '',
      discountValue: '',
      status: 'ACTIVE'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.programName || !formData.discountValue || !formData.startDate || !formData.endDate) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    // Validate discount value
    const discountValue = parseFloat(formData.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      showErrorToast('Discount value must be a positive number');
      return;
    }

    // Validate date range
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (startDate >= endDate) {
      showErrorToast('End date must be after start date');
      return;
    }

    // Check if user is logged in
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      showErrorToast('User not logged in. Please login again.');
      return;
    }

    setSubmitting(true);

    const promotionData = {
      programName: formData.programName.trim(),
      description: formData.description.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      conditions: formData.conditions.trim(),
      discountValue: discountValue,
      status: formData.status,
      createdBy: currentUserId
    };

    try {
      if (editingPromotion) {
        // Update existing promotion
        const updatedPromotion = await promotionsAPI.update(editingPromotion.id, promotionData);
        setPromotions(prevPromotions => prevPromotions.map(p => 
          p.id === editingPromotion.id 
            ? { ...p, ...updatedPromotion }
            : p
        ));
        showSuccessToast('Promotion updated successfully');
      } else {
        // Add new promotion
        const newPromotion = await promotionsAPI.create(promotionData);
        setPromotions(prevPromotions => [...prevPromotions, newPromotion]);
        showSuccessToast('Promotion created successfully');
      }

      // Close modal and reset form
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save promotion:', error);
      const errorMessage = handleAPIError(error);
      showErrorToast(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPromotions = promotions.length;
  const activePromotions = promotions.filter(p => p.status === 'ACTIVE').length;
  const totalApplications = promotions.reduce((sum, p) => sum + (p.applications || 0), 0);

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
          {['all', 'ACTIVE', 'EXPIRED', 'DRAFT'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`btn ${selectedStatus === status ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Promotions Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
            <div>Loading promotions...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredPromotions.map((promo) => (
              <div key={promo.id} style={{
                padding: '20px',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius)',
                border: `2px solid ${promo.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-border)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
                      {promo.programName}
                    </h3>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      <i className="bx bx-user"></i> Created by: {promo.createdByName || 'Unknown'}
                      {promo.createdByEmail && (
                        <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                          ({promo.createdByEmail})
                        </span>
                      )}
                    </div>
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
                    {promo.status.toLowerCase()}
                  </span>
                </div>
                <div style={{ padding: '12px', background: 'var(--color-primary)', borderRadius: 'var(--radius)', color: 'white', fontWeight: '700', fontSize: '24px', marginBottom: '16px', textAlign: 'center' }}>
                  {promo.discountValue} {typeof promo.discountValue === 'number' && promo.discountValue < 100 ? '%' : 'VND'} OFF
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  <i className="bx bx-calendar"></i> {promo.startDate} to {promo.endDate}
                </div>
                {promo.conditions && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px', fontStyle: 'italic' }}>
                    <i className="bx bx-info-circle"></i> {promo.conditions}
                  </div>
                )}
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
        )}

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
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Program Name *
                  </label>
                  <input
                    type="text"
                    value={formData.programName}
                    onChange={(e) => setFormData({...formData, programName: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="Khuyến mãi Tết 2024"
                    required
                  />
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
                    placeholder="Chương trình khuyến mãi đặc biệt..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
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
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
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
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="5000000 (VND) or 15 (%)"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Conditions
                  </label>
                  <textarea
                    value={formData.conditions}
                    onChange={(e) => setFormData({...formData, conditions: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      minHeight: '60px',
                      resize: 'vertical'
                    }}
                    placeholder="Áp dụng cho tất cả các dòng xe, giảm giá trực tiếp"
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
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <i className="bx bx-loader-alt bx-spin"></i> {editingPromotion ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingPromotion ? 'Update Promotion' : 'Create Promotion'
                  )}
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