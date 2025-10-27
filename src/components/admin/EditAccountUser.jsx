import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../utils/api/usersAPI';
import { dealersAPI } from '../../utils/api/dealersAPI';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const EditAccountUser = ({ user, onClose, onSuccess }) => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    role: 'DEALER_STAFF',
    status: 'ACTIVE',
    dealerId: ''
  });

  // Initialize form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.fullName || user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        role: user.role || 'DEALER_STAFF',
        status: user.status || 'ACTIVE',
        dealerId: user.dealerId?.toString() || '',
        password: ''
      });
    }
  }, [user]);

  // Fetch dealers on component mount
  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      const data = await dealersAPI.getAll();
      setDealers(data);
    } catch (error) {
      showErrorToast(handleAPIError(error));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.fullName || !formData.phoneNumber || !formData.role) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorToast('Please enter a valid email address');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      showErrorToast('Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      
      const userData = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        status: formData.status
      };

      // Only include password if it's being updated
      if (formData.password) {
        userData.password = formData.password;
      }

      // Only include dealerId if it's provided (not required for ADMIN and EVM_MANAGER)
      if (formData.dealerId) {
        userData.dealerId = parseInt(formData.dealerId);
      }

      const userId = user.id || user.userId;
      await usersAPI.update(userId, userData);
      showSuccessToast('User updated successfully');
      
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

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Clear dealerId when switching to Admin or EVM Manager roles
      if (field === 'role' && (value === 'ADMIN' || value === 'EVM_MANAGER')) {
        newData.dealerId = '';
      }
      
      return newData;
    });
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
          maxWidth: '1000px',
          maxHeight: '95vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '22px' }}>Edit User Account</h3>
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
            {/* Username Field */}
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
                <i className="bx bx-user" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Username <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
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
                placeholder="Enter username"
                required
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Password Field */}
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
                <i className="bx bx-lock" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Password <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>(Leave blank to keep current)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 16px',
                    border: '2px solid var(--color-border)',
                    borderRadius: '8px',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  placeholder="Enter new password"
                  onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--color-bg)';
                    e.target.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--color-text-muted)';
                  }}
                >
                  <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`}></i>
                </button>
              </div>
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

            {/* Phone Number Field */}
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
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
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

            {/* Role Field */}
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
                <i className="bx bx-shield" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Role <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
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
                required
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              >
                <option value="DEALER_STAFF">Dealer Staff</option>
                <option value="DEALER_MANAGER">Dealer Manager</option>
                <option value="EVM_MANAGER">EVM Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Status Field */}
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
                <i className="bx bx-check-circle" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                Status <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
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
                required
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {/* Dealer Selection Field - Only show for non-admin and non-evm roles */}
            {(formData.role !== 'ADMIN' && formData.role !== 'EVM_MANAGER') && (
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
                  <i className="bx bx-store" style={{ fontSize: '16px', color: '#ef4444' }}></i>
                  Dealer <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <select
                  value={formData.dealerId}
                  onChange={(e) => handleInputChange('dealerId', e.target.value)}
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
                  required
                  onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                >
                  <option value="">Select a dealer</option>
                  {dealers.map((dealer) => (
                    <option key={dealer.dealerId} value={dealer.dealerId}>
                      {dealer.name} - {dealer.region}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '24px', 
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-border)'
          }}>
            <button 
              type="button" 
              className="btn btn-outline" 
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
              className="btn btn-primary"
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
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }
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
                  Update User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountUser;
