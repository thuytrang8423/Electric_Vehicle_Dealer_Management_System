import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const Profile = ({ user, onUpdateProfile }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 234 567 8900',
    password: '',
    newPassword: '',
    confirmPassword: '',
    avatar: null
  });
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    if (formData.password) {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Here you would call API to update profile
    if (onUpdateProfile) {
      onUpdateProfile(formData);
    }
    setEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
  };

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Personal Profile</h2>
          {!editing && (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              <i className="bx bx-edit"></i>
              Edit Profile
            </button>
          )}
        </div>

        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="header__user-avatar" style={{ width: '120px', height: '120px', fontSize: '48px', margin: '0 auto 16px' }}>
                <i className="bx bx-user"></i>
              </div>
              <button className="btn btn-outline" style={{ width: '100%' }}>
                <i className="bx bx-upload"></i>
                Change Avatar
              </button>
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontWeight: '600', fontSize: '18px', color: 'var(--color-text)', marginBottom: '4px' }}>
                  {formData.name}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{user?.role}</div>
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Email</div>
                <div style={{ fontSize: '16px', color: 'var(--color-text)', fontWeight: '500' }}>{formData.email}</div>
              </div>
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Phone</div>
                <div style={{ fontSize: '16px', color: 'var(--color-text)', fontWeight: '500' }}>{formData.phone}</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Role</div>
                <div style={{ fontSize: '16px', color: 'var(--color-text)', fontWeight: '500' }}>{user?.role}</div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${errors.name ? 'var(--color-error)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px'
                }}
              />
              {errors.name && <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${errors.email ? 'var(--color-error)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px'
                }}
              />
              {errors.email && <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${errors.phone ? 'var(--color-error)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px'
                }}
              />
              {errors.phone && <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</div>}
            </div>

            <div style={{ marginTop: '24px', padding: '20px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '16px' }}>
                Change Password
              </h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${errors.newPassword ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                  {errors.newPassword && <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.newPassword}</div>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${errors.confirmPassword ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                  {errors.confirmPassword && <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.confirmPassword}</div>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-outline" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="bx bx-save"></i>
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;

