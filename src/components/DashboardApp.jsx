import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import '../styles/dashboard.css';

// Common components
import Profile from './common/Profile';
import ActivityHistory from './common/ActivityHistory';
import CustomerManagement from './common/CustomerManagement';
import TestDriveManagement from './common/TestDriveManagement';
import PaymentManagement from './common/PaymentManagement';
import PromotionManagement from './common/PromotionManagement';
import DealerManagement from './common/DealerManagement';
import Reports from './common/Reports';

// Dealer Staff components
import ProductCatalog from './dealer-staff/ProductCatalog';
import Quotes from './dealer-staff/Quotes';
import Orders from './dealer-staff/Orders';

// Admin components
import UserManagement from './admin/UserManagement';
import SystemLogs from './admin/SystemLogs';

// EVM Staff components
import VehicleManagement from './evm-staff/VehicleManagement';

// Dealer Manager components
import ApprovalSystem from './dealer-manager/ApprovalSystem';

const DashboardApp = ({ user: propUser, onLogout }) => {
  const { isDarkMode } = useTheme();
  const [activeItem, setActiveItem] = useState('overview');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Notification state management
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New order received', message: 'Order ORD-001 from John Doe', timestamp: '2 minutes ago', read: false, type: 'order' },
    { id: 2, title: 'Payment completed', message: 'Payment for ORD-002 has been received', timestamp: '15 minutes ago', read: false, type: 'payment' },
    { id: 3, title: 'Test drive scheduled', message: 'Customer Mike Chen scheduled a test drive for tomorrow', timestamp: '1 hour ago', read: false, type: 'test-drive' },
    { id: 4, title: 'Quote approved', message: 'Quote #5678 has been approved by manager', timestamp: '2 hours ago', read: true, type: 'quote' },
    { id: 5, title: 'New promotion', message: 'Holiday special promotion is now active', timestamp: '3 hours ago', read: true, type: 'promotion' },
    { id: 6, title: 'Inventory alert', message: 'Low stock for Tesla Model 3 in your dealership', timestamp: '5 hours ago', read: true, type: 'inventory' }
  ]);

  // Get user from props or localStorage
  const [user, setUser] = useState(() => {
    if (propUser) return propUser;
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        return { name: 'Guest', role: 'dealer-staff' };
      }
    }
    return { name: 'Guest', role: 'dealer-staff' };
  });

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleProfileUpdate = (data) => {
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  // Notification handlers
  const handleMarkAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'overview':
        return <Dashboard user={user} />;
      case 'profile':
        return <Profile user={user} onUpdateProfile={(data) => console.log('Profile updated:', data)} />;
      case 'activity':
        return <ActivityHistory user={user} />;
      case 'vehicles':
        if (user.role === 'evm-staff' || user.role === 'admin') {
          return <VehicleManagement user={user} />;
        }
        return <ProductCatalog user={user} />;
      case 'orders':
        if (user.role === 'dealer-staff') {
          return <Orders user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Orders Management</h2>
              <p>View and manage orders from dealers.</p>
            </div>
          </div>
        );
      case 'quotes':
        if (user.role === 'dealer-staff') {
          return <Quotes user={user} />;
        }
        if (user.role === 'dealer-manager') {
          return <ApprovalSystem user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Quotes Management</h2>
              <p>Approve and manage quotes from dealer staff.</p>
            </div>
          </div>
        );
      case 'customers':
        return <CustomerManagement user={user} />;
      case 'test-drives':
        return <TestDriveManagement user={user} />;
      case 'payments':
        return <PaymentManagement user={user} />;
      case 'promotions':
        return <PromotionManagement user={user} />;
      case 'dealers':
        return <DealerManagement user={user} />;
      case 'users':
        return <UserManagement user={user} />;
      case 'logs':
        return <SystemLogs user={user} />;
      case 'reports':
        return <Reports user={user} />;
      case 'settings':
        return (
          <div className="main">
            <div className="card">
              <h2>System Settings</h2>
              <p>Configure system preferences.</p>
            </div>
          </div>
        );
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Sidebar 
        user={user} 
        activeItem={activeItem} 
        onItemClick={handleItemClick} 
      />
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onProfileClick={handleProfileClick}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
      />
      {renderContent()}
      
      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

// Profile Modal Component
const ProfileModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (formData.password && formData.newPassword) {
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

    onUpdate({
      name: formData.name,
      email: formData.email
    });
    setEditing(false);
    onClose();
    alert('Profile updated successfully!');
  };

  return (
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
      zIndex: 2000
    }} onClick={onClose}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius)',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-hover)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>Profile</h2>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: 'var(--color-text-muted)'
          }}>
            <i className="bx bx-x"></i>
          </button>
        </div>

        {!editing ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '48px', color: 'white' }}>
                <i className="bx bx-user"></i>
              </div>
              <h3 style={{ margin: '0 0 8px 0' }}>{user.name}</h3>
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{user.role}</p>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Name</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-text)' }}>{user.name}</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Email</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-text)' }}>{user.email || 'No email'}</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Role</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-text)' }}>{user.role}</div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => setEditing(true)} style={{ width: '100%', marginTop: '24px' }}>
              <i className="bx bx-edit"></i>
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Name</label>
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email</label>
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

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DashboardApp;
