import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AuthPage.css';

// Mock users database
const mockUsers = [
  {
    email: 'dealer@staff.com',
    password: 'staff123',
    name: 'John Smith',
    role: 'dealer-staff',
    avatar: null
  },
  {
    email: 'manager@dealer.com',
    password: 'manager123',
    name: 'Jane Doe',
    role: 'dealer-manager',
    avatar: null
  },
  {
    email: 'staff@evm.com',
    password: 'evm123',
    name: 'Mike Johnson',
    role: 'evm-staff',
    avatar: null
  },
  {
    email: 'admin@evms.com',
    password: 'admin123',
    name: 'Sarah Chen',
    role: 'admin',
    avatar: null
  }
];

const AuthPage = ({ onNavigateHome, onLoginSuccess }) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
    confirmPassword: '',
    role: 'dealer',
    dealerCode: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isSignIn) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrors(errors);
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (isSignIn) {
        // Find user in mock database
        const user = mockUsers.find(
          u => u.email === formData.email && u.password === formData.password
        );

        if (user) {
          // Store user in localStorage
          localStorage.setItem('currentUser', JSON.stringify({
            name: user.name,
            email: user.email,
            role: user.role
          }));
          setLoading(false);
          // Call onLoginSuccess callback with user data
          if (onLoginSuccess) {
            onLoginSuccess(user);
          }
          return;
        } else {
          setLoading(false);
          setErrors({ email: 'Invalid credentials' });
          return;
        }
      } else {
        setLoading(false);
        alert('Sign Up successful!');
        // Could optionally sign them in here
      }
    }, 1500);
  };

  // Quick login function
  const quickLogin = (user) => {
    localStorage.setItem('currentUser', JSON.stringify({
      name: user.name,
      email: user.email,
      role: user.role
    }));
    if (onLoginSuccess) {
      onLoginSuccess(user);
    }
  };

  return (
    <div className="auth-page">
      {/* Background with overlay */}
      <div className="auth-background">
        <div className="auth-overlay"></div>
        <div className="energy-particles"></div>
      </div>

      {/* Back to Home Button */}
      {onNavigateHome && (
        <motion.button
          className="back-to-home"
          onClick={onNavigateHome}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Back to Home"
        >
          ← Back
        </motion.button>
      )}

      <div className="auth-container">
        {/* Left side - Brand Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="auth-brand"
        >
          <div className="brand-content">
            <div className="brand-logo">
              <span className="logo-icon-large">⚡</span>
              <h1 className="brand-title">EVM</h1>
            </div>
            <p className="brand-subtitle">Management System</p>
            {isSignIn && (
              <div className="brand-features">
                <div className="feature-item">
                  <span className="feature-icon">🔐</span>
                  <span>Secure Authentication</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span>Fast Access</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🛡️</span>
                  <span>Enterprise Security</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right side - Form Section */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="auth-form-container"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignIn ? 'signin' : 'signup'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="auth-form-box"
            >
              {/* Header */}
              <div className="form-header">
                <h2 className="form-title">
                  {isSignIn ? 'Welcome Back' : 'Join the Future'}
                </h2>
                <p className="form-subtitle">
                  {isSignIn 
                    ? 'Sign in to your EVM account' 
                    : 'Create your EVM account and start managing'}
                </p>
              </div>

              {/* Quick Login Section */}
              {isSignIn && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px', textAlign: 'center' }}>
                    Quick Login (Demo)
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {mockUsers.map(user => (
                      <motion.button
                        key={user.email}
                        type="button"
                        onClick={() => quickLogin(user)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: '12px',
                          border: 'none',
                          borderRadius: 'var(--radius)',
                          background: user.role === 'dealer-staff' ? 'rgba(59, 130, 246, 0.1)' :
                                      user.role === 'dealer-manager' ? 'rgba(108, 99, 255, 0.1)' :
                                      user.role === 'evm-staff' ? 'rgba(0, 191, 166, 0.1)' :
                                      'rgba(255, 193, 7, 0.1)',
                          color: user.role === 'dealer-staff' ? 'var(--color-info)' :
                                  user.role === 'dealer-manager' ? 'var(--color-primary)' :
                                  user.role === 'evm-staff' ? 'var(--color-secondary)' :
                                  'var(--color-accent)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textAlign: 'left',
                          fontSize: '12px'
                        }}
                      >
                        <i className={`bx ${
                          user.role === 'dealer-staff' ? 'bx-user' :
                          user.role === 'dealer-manager' ? 'bx-user-check' :
                          user.role === 'evm-staff' ? 'bx-cog' :
                          'bx-shield'
                        }`} style={{ fontSize: '20px' }}></i>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{user.name}</div>
                          <div style={{ fontSize: '11px', opacity: '0.8' }}>{user.email}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  <div style={{ margin: '16px 0', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    OR
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="auth-form">
                {/* Sign In Form */}
                {isSignIn ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <div className="input-wrapper">
                        <span className="input-icon">📧</span>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`form-input ${errors.email ? 'error' : ''}`}
                          placeholder="you@example.com"
                        />
                      </div>
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <div className="input-wrapper">
                        <span className="input-icon">🔒</span>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`form-input ${errors.password ? 'error' : ''}`}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <div className="form-options">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleInputChange}
                          className="checkbox-input"
                        />
                        <span>Remember me</span>
                      </label>
                      <a href="#" className="forgot-password">Forgot password?</a>
                    </div>

                    <motion.button
                      type="submit"
                      className="btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="btn-loading">
                          <span className="loading-spinner"></span>
                          Signing in...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </motion.button>

                    <div className="form-separator">
                      <span>or continue with</span>
                    </div>

                    <div className="social-buttons">
                      <button type="button" className="social-btn">
                        <span>G</span>
                      </button>
                      <button type="button" className="social-btn">
                        <span>M</span>
                      </button>
                      <button type="button" className="social-btn">
                        <span>A</span>
                      </button>
                    </div>

                    <div className="form-footer">
                      <span>Don't have an account? </span>
                      <button 
                        type="button"
                        className="link-button"
                        onClick={() => setIsSignIn(false)}
                      >
                        Sign Up
                      </button>
                    </div>
                  </>
                ) : (
                  /* Sign Up Form */
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <div className="input-wrapper">
                        <span className="input-icon"></span>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className={`form-input ${errors.fullName ? 'error' : ''}`}
                          placeholder="John Doe"
                        />
                      </div>
                      {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <div className="input-wrapper">
                        <span className="input-icon">📧</span>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`form-input ${errors.email ? 'error' : ''}`}
                          placeholder="you@example.com"
                        />
                      </div>
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <div className="input-wrapper">
                        <span className="input-icon">🗣️</span>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`form-input ${errors.username ? 'error' : ''}`}
                          placeholder="johndoe"
                        />
                      </div>
                      {errors.username && <span className="error-message">{errors.username}</span>}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-wrapper">
                          <span className="input-icon">🔒</span>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            placeholder="••••••••"
                          />
                        </div>
                        {errors.password && <span className="error-message">{errors.password}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Confirm</label>
                        <div className="input-wrapper">
                          <span className="input-icon">✓</span>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                            placeholder="••••••••"
                          />
                        </div>
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <div className="input-wrapper">
                        <span className="input-icon">🎭</span>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className="form-input"
                        >
                          <option value="dealer">Dealer Staff</option>
                          <option value="manager">Manager</option>
                          <option value="evm">EVM Staff</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Dealer Code (optional)</label>
                      <div className="input-wrapper">
                        <span className="input-icon">🏢</span>
                        <input
                          type="text"
                          name="dealerCode"
                          value={formData.dealerCode}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Enter dealer code"
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      className="btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="btn-loading">
                          <span className="loading-spinner"></span>
                          Creating account...
                        </span>
                      ) : (
                        'Create Account'
                      )}
                    </motion.button>

                    <div className="form-footer">
                      <span>Already have an account? </span>
                      <button 
                        type="button"
                        className="link-button"
                        onClick={() => setIsSignIn(true)}
                      >
                        Sign In
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
