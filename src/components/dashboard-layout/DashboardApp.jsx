import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import '../../styles/dashboard.css';

// Common components
import Profile from '../common/Profile';
import ActivityHistory from '../common/ActivityHistory';
import CustomerManagement from '../common/CustomerManagement';
import TestDriveManagement from '../common/TestDriveManagement';
import PaymentManagement from '../common/PaymentManagement';
import PromotionManagement from '../common/PromotionManagement';
import DealerManagement from '../common/DealerManagement';
import Reports from '../common/Reports';
import DeliveryTracking from '../common/DeliveryTracking';
import CustomerFeedback from '../common/CustomerFeedback';
import DebtManagement from '../common/DebtManagement';

// Dealer Staff components
import ProductCatalog from '../dealer-staff/ProductCatalog';
import Quotes from '../dealer-staff/Quotes';
import Orders from '../dealer-staff/Orders';
import SalesContracts from '../dealer-staff/SalesContracts';

// Admin components
import UserManagement from '../admin/UserManagement';
import AuditLogs from '../admin/AuditLogs';

// EVM Staff components
import VehicleManagement from '../evm-staff/VehicleManagement';
import VehicleTypeManagement from '../evm-staff/VehicleTypeManagement';
import VehicleOrders from '../evm-staff/VehicleOrders';
import VehicleDistribution from '../evm-staff/VehicleDistribution';

// Dealer Manager components
import ApprovalSystem from '../dealer-manager/ApprovalSystem';


const DashboardApp = ({ user: propUser, onLogout }) => {
  const navigate = useNavigate();
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
        console.error('Failed to parse user data:', e);
        return { name: 'Guest', role: 'dealer-staff' };
      }
    }
    return { name: 'Guest', role: 'dealer-staff' };
  });

  // Update user when propUser changes
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleProfileClick = () => {
    setActiveItem('settings');
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
        return <ProductCatalog user={user} />;
      case 'vehicle-management':
        if (user.role === 'EVM_MANAGER' || user.role === 'ADMIN') {
          return <VehicleManagement user={user} />;
        }
      case 'vehicle-types':
        if (user.role === 'EVM_MANAGER' || user.role === 'ADMIN' || user.role === 'evm-staff' || user.role === 'admin') {
          return <VehicleTypeManagement user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Vehicle Types</h2>
              <p>Access restricted to EVM staff.</p>
            </div>
          </div>
        );
      case 'orders':
        if (user.role === 'dealer-staff' || user.role === 'dealer-manager' || user.role === 'evm-staff' || user.role === 'admin') {
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
      case 'sales-contracts':
        if (user.role === 'dealer-staff' || user.role === 'dealer-manager' || user.role === 'admin') {
          return <SalesContracts user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Sales Contracts</h2>
              <p>Access restricted to dealer staff and managers.</p>
            </div>
          </div>
        );
      case 'vehicle-orders':
        if (user.role === 'evm-staff' || user.role === 'EVM_MANAGER' || user.role === 'ADMIN' || user.role === 'admin') {
          return <VehicleOrders user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Vehicle Orders</h2>
              <p>Access restricted to EVM staff.</p>
            </div>
          </div>
        );
      case 'delivery-tracking':
        if (user.role === 'evm-staff' || user.role === 'admin') {
          return <DeliveryTracking user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Delivery Tracking</h2>
              <p>Access restricted to EVM staff.</p>
            </div>
          </div>
        );
      case 'vehicle-distribution':
        if (user.role === 'evm-staff' || user.role === 'admin') {
          return <VehicleDistribution user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Vehicle Distribution</h2>
              <p>Access restricted to EVM staff.</p>
            </div>
          </div>
        );
      case 'quotes':
        if (user.role === 'dealer-staff' || user.role === 'admin') {
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
      case 'customer-feedback':
        return <CustomerFeedback user={user} />;
      case 'test-drives':
        return <TestDriveManagement user={user} />;
      case 'payments':
        return <PaymentManagement user={user} />;
      case 'debt-management':
        return <DebtManagement user={user} />;
      case 'promotions':
        return <PromotionManagement user={user} />;
      case 'dealers':
        return <DealerManagement user={user} />;
      case 'users':
        return <UserManagement user={user} />;
      case 'audit-logs':
        return <AuditLogs user={user} />;
      case 'reports':
        return <Reports user={user} />;
      case 'settings':
        return <Profile user={user} onUpdateProfile={handleProfileUpdate} />;
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
    </div>
  );
};


export default DashboardApp;
