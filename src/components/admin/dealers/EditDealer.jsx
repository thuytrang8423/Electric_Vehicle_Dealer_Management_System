import React, { useState, useEffect } from 'react';
import { dealersAPI } from '../../../utils/api/dealersAPI';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
import { handleAPIError } from '../../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const EditDealer = ({ dealer, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    phone: '',
    address: '',
    representativeName: '',
    status: 'ACTIVE'
  });

  // Initialize form data when dealer prop changes
  useEffect(() => {
    if (dealer) {
      setFormData({
        name: dealer.name || '',
        region: dealer.region || '',
        phone: dealer.phone || '',
        address: dealer.address || '',
        representativeName: dealer.representativeName || '',
        status: dealer.status || 'ACTIVE'
      });
    }
  }, [dealer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.region || !formData.phone || !formData.address) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const dealerData = {
        name: formData.name,
        region: formData.region,
        phone: formData.phone,
        address: formData.address,
        representativeName: formData.representativeName,
        status: formData.status
      };

      const dealerId = dealer.dealerId || dealer.id;
      await dealersAPI.update(dealerId, dealerData);
      showSuccessToast('Dealer updated successfully');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      showErrorToast(handleAPIError(error));
    } finally {
      setLoading(false);
    }
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
            width: '95%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '22px' }}>Edit Dealer</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer', 
              color: 'var(--color-text-muted)',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.1)';
              e.target.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
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
            {/* Dealer Name */}
            <div>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600', 
                color: 'var(--color-text)'
              }}>
                <i className="bx bx-store" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Dealer Name <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                placeholder="Metro Auto Group"
                required
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Region */}
            <div>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600', 
                color: 'var(--color-text)'
              }}>
                <i className="bx bx-map" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Region <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
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
                placeholder="New York"
                required
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Phone */}
            <div>
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
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                placeholder="+1 234 567 8900"
                required
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Representative Name */}
            <div>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600', 
                color: 'var(--color-text)'
              }}>
                <i className="bx bx-user" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Representative Name
              </label>
              <input
                type="text"
                value={formData.representativeName}
                onChange={(e) => setFormData({...formData, representativeName: e.target.value})}
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
                placeholder="John Doe"
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Address */}
            <div>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600', 
                color: 'var(--color-text)'
              }}>
                <i className="bx bx-map-pin" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Address <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
                placeholder="123 Broadway, New York, NY 10001"
                required
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Status */}
            <div>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600', 
                color: 'var(--color-text)'
              }}>
                <i className="bx bx-check-circle" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '32px', 
            justifyContent: 'flex-end',
            paddingTop: '20px',
            borderTop: '1px solid var(--color-border)'
          }}>
            <button 
              type="button" 
              onClick={onClose}
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
                background: loading ? 'var(--color-text-muted)' : '#ef4444',
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
            >
              {loading ? (
                <>
                  <i className="bx bx-loader-alt bx-spin"></i>
                  Updating...
                </>
              ) : (
                <>
                  <i className="bx bx-check"></i>
                  Update Dealer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDealer;

