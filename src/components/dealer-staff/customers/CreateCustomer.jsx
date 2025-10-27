import React, { useState } from 'react';
import { customersAPI } from '../../../utils/api/customersAPI';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const CreateCustomer = ({ onClose, onSuccess, userProfile, user }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    citizenId: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorToast('Please enter a valid email address');
      return;
    }

    const customerData = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      citizenId: formData.citizenId,
      dealerId: userProfile?.dealerId || user?.dealerId
    };

    try {
      setLoading(true);
      await customersAPI.create(customerData);
      showSuccessToast('Customer added successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating customer:', error);
      showErrorToast('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div 
      style={{
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
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius)',
          padding: '32px',
          width: '98%',
          maxWidth: '600px',
          maxHeight: '95vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '22px' }}>Add New Customer</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer', 
              color: 'var(--color-text-muted)',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--color-bg)';
              e.target.style.color = 'var(--color-text)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = 'var(--color-text-muted)';
            }}
          >
            <i className="bx bx-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '20px 24px',
            alignItems: 'start'
          }}>
            {/* Full Name Field */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600', 
                color: 'var(--color-text)'
              }}>
                <i className="bx bx-user-circle" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Full Name <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                placeholder="Enter full name"
                required
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Email Field */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600', 
                color: 'var(--color-text)'
              }}>
                <i className="bx bx-envelope" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Email Address <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                placeholder="Enter email address"
                required
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Phone Field */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600', 
                color: 'var(--color-text)'
              }}>
                <i className="bx bx-phone" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Phone Number <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                placeholder="Enter phone number"
                required
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Citizen ID Field */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600', 
                color: 'var(--color-text)'
              }}>
                <i className="bx bx-id-card" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Citizen ID
              </label>
              <input
                type="text"
                value={formData.citizenId}
                onChange={(e) => handleInputChange('citizenId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                placeholder="Enter citizen ID"
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginTop: '32px', 
            justifyContent: 'flex-end' 
          }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: '2px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text)',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--color-error)';
                e.target.style.color = 'var(--color-error)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.color = 'var(--color-text)';
              }}
            >
              <i className="bx bx-x"></i>
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: loading ? 'var(--color-text-muted)' : 'var(--color-error)',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = '#dc2626';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'var(--color-error)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {loading ? (
                <>
                  <i className="bx bx-loader-alt bx-spin"></i>
                  Adding...
                </>
              ) : (
                <>
                  <i className="bx bx-plus"></i>
                  Add Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCustomer;
