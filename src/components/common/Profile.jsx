import React, { useEffect, useMemo, useState } from 'react';
import 'boxicons/css/boxicons.min.css';

/**
 * Profile form that aligns with the account payload:
 * {
 *   "username": "string",
 *   "password": "string",
 *   "email": "string",
 *   "fullName": "string",
 *   "phoneNumber": "string",
 *   "role": "ADMIN",
 *   "status": "ACTIVE",
 *   "dealerId": 1073741824
 * }
 *
 * Editable fields: fullName, phoneNumber, email, password (optional)
 * Read-only fields: username, role, status, dealerId
 */
const Profile = ({ user = {}, onUpdateProfile }) => {
  const readonlyFields = useMemo(
    () => [
      { key: 'username', label: 'Username', icon: 'bx-user', value: user.username || '—' },
      { key: 'role', label: 'Role', icon: 'bx-shield-quarter', value: user.role || '—' },
      { key: 'status', label: 'Status', icon: 'bx-pulse', value: user.status || '—' },
      {
        key: 'dealerId',
        label: 'Dealer ID',
        icon: 'bx-id-card',
        value: user.dealerId !== undefined && user.dealerId !== null ? user.dealerId : '—'
      }
    ],
    [user.username, user.role, user.status, user.dealerId]
  );

  const buildEditable = (source = {}) => ({
    fullName: source.fullName || '',
    phoneNumber: source.phoneNumber || '',
    email: source.email || '',
    password: ''
  });

  const [formData, setFormData] = useState(buildEditable(user));
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    setFormData(buildEditable(user));
    setErrors({});
    setStatusMessage(null);
  }, [user]);

  const validators = {
    fullName: (value) => value.trim().length > 0 || 'Full name is required',
    phoneNumber: (value) => value.trim().length > 0 || 'Phone number is required',
    email: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) return 'Email is required';
      return emailRegex.test(value.trim()) || 'Invalid email format';
    }
  };

  const validateForm = (data) => {
    const newErrors = {};
    Object.entries(validators).forEach(([key, validate]) => {
      const result = validate(data[key] || '');
      if (result !== true) {
        newErrors[key] = result;
      }
    });
    return newErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (statusMessage) {
      setStatusMessage(null);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatusMessage(null);
      return;
    }

    const payload = {
      username: user.username || '',
      email: formData.email.trim(),
      fullName: formData.fullName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      role: user.role || '',
      status: user.status || '',
      dealerId: user.dealerId ?? null
    };

    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    if (onUpdateProfile) {
      onUpdateProfile(payload);
    }

    setStatusMessage({
      type: 'success',
      message: 'Account information has been updated.'
    });
    setFormData((prev) => ({ ...prev, password: '' }));
  };

  return (
    <div className="main">
      <div
        style={{
          display: 'grid',
          gap: '24px',
          maxWidth: '1100px',
          width: '100%',
          margin: '0 auto',
          padding: '0 24px'
        }}
      >
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '112px',
                  height: '112px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 600,
                  flexShrink: 0
                }}
                title={formData.fullName || user.username || 'Account'}
              >
                {(formData.fullName || user.fullName || user.username || '?')
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <h2 style={{ margin: '0 0 4px', color: 'var(--color-text)' }}>
                  {formData.fullName || user.username || 'User'}
                </h2>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  {user.role || '—'}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  Status: {user.status || '—'}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px'
                }}
              >
                {readonlyFields.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`readonly-${field.key}`}
                      style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}
                    >
                      {field.label}
                    </label>
                    <input
                      id={`readonly-${field.key}`}
                      value={String(field.value)}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '6px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text-muted)'
                      }}
                    />
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px'
                }}
              >
                <div>
                  <label htmlFor="fullName" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                    Full name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '6px',
                      border: `1px solid ${errors.fullName ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && (
                    <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.fullName}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="email" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '6px',
                      border: `1px solid ${errors.email ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="admin@evmmotors.com"
                  />
                  {errors.email && (
                    <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="phoneNumber" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                    Phone number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '6px',
                      border: `1px solid ${errors.phoneNumber ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="+84 901 234 567"
                  />
                  {errors.phoneNumber && (
                    <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.phoneNumber}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                    New password (optional)
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '6px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="Leave blank to keep current password"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setFormData(buildEditable(user));
                    setErrors({});
                    setStatusMessage(null);
                  }}
                >
                  Reset
                </button>
                <button type="submit" className="btn btn-primary">
                  Update profile
                </button>
              </div>

              {statusMessage && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius)',
                    border:
                      statusMessage.type === 'success'
                        ? '1px solid rgba(34,197,94,0.4)'
                        : '1px solid rgba(248,113,113,0.4)',
                    background:
                      statusMessage.type === 'success'
                        ? 'rgba(34,197,94,0.08)'
                        : 'rgba(248,113,113,0.08)',
                    color: statusMessage.type === 'success' ? '#16a34a' : '#f97316',
                    fontSize: '14px'
                  }}
                >
                  {statusMessage.message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

