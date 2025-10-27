import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const Profile = ({ user, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    name: user?.name || 'Nguyễn Văn Admin',
    email: user?.email || 'admin@evmmotors.com',
    phone: user?.phone || '+84 901 234 567',
    description: user?.description || 'Quản trị viên hệ thống EVM Motors với 5 năm kinh nghiệm trong lĩnh vực công nghệ xe điện và quản lý dữ liệu.',
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

  const handleSave = () => {
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
    if (activeTab === 'password' && formData.password) {
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

    if (onUpdateProfile) {
      onUpdateProfile(formData);
    }
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setErrors({});
    // Reset form data
    setFormData({
      name: user?.name || 'Nguyễn Văn Admin',
      email: user?.email || 'admin@evmmotors.com',
      phone: user?.phone || '+84 901 234 567',
      description: user?.description || 'Quản trị viên hệ thống EVM Motors với 5 năm kinh nghiệm trong lĩnh vực công nghệ xe điện và quản lý dữ liệu.',
      password: '',
      newPassword: '',
      confirmPassword: '',
      avatar: null
    });
  };

  return (
    <div className="main">
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Personal Information Section */}
        <div className="card">
          <h3 style={{ marginBottom: '24px', color: 'var(--color-text)' }}>Thông tin cá nhân</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
            {/* Left Section - Avatar */}
            <div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div 
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      border: '2px solid var(--color-primary)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <i className="bx bx-user" style={{ fontSize: '48px', color: 'white' }}></i>
                  </div>
                  <button 
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}
                  >
                    <i className="bx bx-camera"></i>
                  </button>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
                    Admin User
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    System Administrator
                  </div>
                </div>
                <button 
                  style={{ 
                    padding: '8px 12px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: '1px solid var(--color-primary)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    width: 'fit-content',
                    margin: '0 auto'
                  }}
                >
                  <i className="bx bx-upload" style={{ fontSize: '14px' }}></i>
                  Thay đổi ảnh
                </button>
              </div>
            </div>

            {/* Right Section - Personal Information */}
            <div>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                    Họ và tên
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
                      background: 'var(--color-surface)',
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
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                  {errors.email && <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                    Số điện thoại
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
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                  {errors.phone && <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</div>}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                    Mô tả bản thân
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button className="btn btn-primary" onClick={handleSave}>
                  Cập nhật thông tin
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="card">
          <h3 style={{ marginBottom: '24px', color: 'var(--color-text)' }}>Đổi mật khẩu</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Left Section - Password Fields */}
            <div>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                    Mật khẩu hiện tại
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="bx bx-show"></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                    Mật khẩu mới
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        border: `1px solid ${errors.newPassword ? 'var(--color-error)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="bx bx-show"></i>
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      background: 'var(--color-bg)', 
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: '30%', 
                        height: '100%', 
                        background: 'var(--color-error)',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }}>Yếu</div>
                  </div>
                  {errors.newPassword && <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.newPassword}</div>}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                    Xác nhận mật khẩu mới
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        border: `1px solid ${errors.confirmPassword ? 'var(--color-error)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="bx bx-show"></i>
                    </button>
                  </div>
                  {errors.confirmPassword && <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.confirmPassword}</div>}
                </div>
              </div>
            </div>

            {/* Right Section - Password Requirements */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '16px' }}>
                Yêu cầu mật khẩu
              </h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  'Tối thiểu 8 ký tự',
                  'Có chữ hoa',
                  'Có chữ thường', 
                  'Có số',
                  'Có ký tự đặc biệt'
                ].map((requirement, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="bx bx-x" style={{ color: 'var(--color-error)', fontSize: '16px' }}></i>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{requirement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button 
              className="btn" 
              onClick={handleSave}
              style={{ 
                background: 'linear-gradient(135deg, #FFA500, #FF8C00)',
                color: 'white',
                border: 'none'
              }}
            >
              Đổi mật khẩu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

