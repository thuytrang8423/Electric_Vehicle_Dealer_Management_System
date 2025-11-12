import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import '../../styles/dashboard.css';

// Common components
import Profile from '../common/Profile';
import ActivityHistory from '../common/ActivityHistory';
import CustomerManagement from '../dealer-staff/customers/CustomerManagement';
import TestDriveManagement from '../common/TestDriveManagement';
import PaymentManagement from '../common/PaymentManagement';
import PromotionManagement from '../common/PromotionManagement';
import InstallmentManagement from '../common/InstallmentManagement';
import DealerManagement from '../admin/dealers/DealerManagement';
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
import UserManagement from '../admin/users/UserManagement';
import AuditLogs from '../admin/AuditLogs';

// EVM Staff components
import VehicleManagement from '../evm-staff/VehicleManagement';
import VehicleTypeManagement from '../evm-staff/VehicleTypeManagement';
import VehicleOrders from '../evm-staff/VehicleOrders';
import VehicleDistribution from '../evm-staff/VehicleDistribution';

// Dealer Manager components
import ApprovalSystem from '../dealer-manager/ApprovalSystem';
import InventoryManagement from '../common/InventoryManagement';
import { usersAPI } from '../../utils/api/usersAPI';


const DashboardApp = ({ user: propUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [activeItem, setActiveItem] = useState('overview');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Handle navigation state (e.g., from PaymentResult)
  useEffect(() => {
    if (location.state?.activeItem) {
      setActiveItem(location.state.activeItem);
    }
    // Note: We don't clear location.state here anymore
    // PaymentManagement will handle clearing it after reading fromPaymentResult
  }, [location.state]);

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

  useEffect(() => {
    const syncUserProfile = async () => {
      try {
        if (!user?.id) return;
        const hasDealerInfo = user?.dealerId !== undefined && user?.dealerId !== null;
        const hasFullName = !!user?.name || !!user?.fullName;
        if (hasDealerInfo && hasFullName) return;

        const profile = await usersAPI.getById(user.id);
        if (!profile) return;

        const updatedUser = {
          ...user,
          dealerId: profile.dealerId ?? user?.dealerId ?? null,
          role: profile.role || user?.role,
          name: profile.fullName || user?.name,
          fullName: profile.fullName || user?.fullName,
          email: profile.email || user?.email,
          phoneNumber: profile.phoneNumber ?? user?.phoneNumber,
          status: profile.status ?? user?.status,
        };

        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } catch (error) {
        console.warn('Unable to synchronize user profile:', error);
      }
    };

    syncUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

  // Helper function to check role access
  const hasRoleAccess = (allowedRoles) => {
    const userRole = user?.role?.toUpperCase();
    return allowedRoles.some(role => 
      userRole === role.toUpperCase() || 
      userRole === role.replace('-', '_').toUpperCase()
    );
  };

  const renderContent = () => {
    // Normalize user role for comparison
    const userRole = user?.role?.toUpperCase();

    switch (activeItem) {
      case 'overview':
        return <Dashboard user={user} />;
      
      case 'activity':
        return <ActivityHistory user={user} />;
      
      case 'vehicles':
        // All roles can view vehicles (Product Catalog)
        return <ProductCatalog user={user} />;
      
      case 'vehicle-management':
        // Only EVM_MANAGER and ADMIN can manage vehicles
        if (hasRoleAccess(['EVM_MANAGER', 'ADMIN', 'evm-manager', 'admin'])) {
          return <VehicleManagement user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Vehicle Management</h2>
              <p>Access restricted to EVM Manager and Admin.</p>
            </div>
          </div>
        );
      
      case 'vehicle-types':
        // Only EVM_MANAGER and ADMIN can manage vehicle types
        if (hasRoleAccess(['EVM_MANAGER', 'ADMIN', 'evm-manager', 'admin'])) {
          return <VehicleTypeManagement user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Vehicle Types</h2>
              <p>Access restricted to EVM Manager and Admin.</p>
            </div>
          </div>
        );
      
      case 'quotes':
        // DEALER_STAFF: Create and manage quotes
        // DEALER_MANAGER: Approve quotes from staff
        // EVM_MANAGER/ADMIN: View and approve quotes from dealer managers
        if (hasRoleAccess(['DEALER_STAFF', 'dealer-staff'])) {
          return <Quotes user={user} />;
        }
        if (hasRoleAccess(['DEALER_MANAGER', 'dealer-manager'])) {
          return <ApprovalSystem user={user} />;
        }
        if (hasRoleAccess(['EVM_MANAGER', 'ADMIN', 'evm-manager', 'admin'])) {
          // EVM/Admin can view quotes but may need different component
          return <Quotes user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Quotes Management</h2>
              <p>Access restricted.</p>
            </div>
          </div>
        );
      
      case 'orders':
        // DEALER_STAFF: Create orders from approved quotes
        // DEALER_MANAGER: View and approve orders
        // EVM_MANAGER/ADMIN: View and approve orders
        if (hasRoleAccess(['DEALER_STAFF', 'DEALER_MANAGER', 'EVM_MANAGER', 'ADMIN', 
                          'dealer-staff', 'dealer-manager', 'evm-manager', 'admin'])) {
          return <Orders user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Orders Management</h2>
              <p>Access restricted.</p>
            </div>
          </div>
        );
      
      case 'sales-contracts':
        // DEALER_STAFF, DEALER_MANAGER can access
        // EVM_MANAGER, ADMIN can view
        if (hasRoleAccess(['DEALER_STAFF', 'DEALER_MANAGER', 'EVM_MANAGER', 'ADMIN',
                          'dealer-staff', 'dealer-manager', 'evm-manager', 'admin'])) {
          return <SalesContracts user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Sales Contracts</h2>
              <p>Access restricted.</p>
            </div>
          </div>
        );
      
      case 'vehicle-orders':
        // Only EVM_MANAGER and ADMIN
        if (hasRoleAccess(['EVM_MANAGER', 'ADMIN', 'evm-manager', 'admin'])) {
          return <VehicleOrders user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Vehicle Orders</h2>
              <p>Access restricted to EVM Manager and Admin.</p>
            </div>
          </div>
        );
      
      case 'delivery-tracking':
        // Only EVM_MANAGER and ADMIN
        if (hasRoleAccess(['EVM_MANAGER', 'ADMIN', 'evm-manager', 'admin'])) {
          return <DeliveryTracking user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Delivery Tracking</h2>
              <p>Access restricted to EVM Manager and Admin.</p>
            </div>
          </div>
        );
      
      case 'vehicle-distribution':
        // Only EVM_MANAGER and ADMIN
        if (hasRoleAccess(['EVM_MANAGER', 'ADMIN', 'evm-manager', 'admin'])) {
          return <VehicleDistribution user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Vehicle Distribution</h2>
              <p>Access restricted to EVM Manager and Admin.</p>
            </div>
          </div>
        );
      
      case 'inventory':
        if (hasRoleAccess([
          'DEALER_MANAGER',
          'EVM_MANAGER',
          'ADMIN',
          'dealer-manager',
          'evm-manager',
          'admin'
        ])) {
          return <InventoryManagement user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Inventory</h2>
              <p>Access restricted to Dealer Manager, EVM Manager, or Admin.</p>
            </div>
          </div>
        );
      
      case 'customers':
        // DEALER_STAFF, DEALER_MANAGER can access
        // EVM_MANAGER, ADMIN cannot access (as per ROLE_FEATURES.md)
        if (hasRoleAccess(['DEALER_STAFF', 'DEALER_MANAGER', 'dealer-staff', 'dealer-manager'])) {
          return <CustomerManagement user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Customers</h2>
              <p>Access restricted to Dealer Staff and Dealer Manager.</p>
            </div>
          </div>
        );
      
      case 'customer-feedback':
        // DEALER_STAFF, DEALER_MANAGER can access
        // EVM_MANAGER, ADMIN cannot access
        if (hasRoleAccess(['DEALER_STAFF', 'DEALER_MANAGER', 'dealer-staff', 'dealer-manager'])) {
          return <CustomerFeedback user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Customer Feedback</h2>
              <p>Access restricted to Dealer Staff and Dealer Manager.</p>
            </div>
          </div>
        );
      
      case 'test-drives':
        // DEALER_STAFF, DEALER_MANAGER can access
        // EVM_MANAGER, ADMIN cannot access
        if (hasRoleAccess(['DEALER_STAFF', 'DEALER_MANAGER', 'dealer-staff', 'dealer-manager'])) {
          return <TestDriveManagement user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Test Drives</h2>
              <p>Access restricted to Dealer Staff and Dealer Manager.</p>
            </div>
          </div>
        );
      
      case 'payments':
        // All roles can view payments (but with different permissions)
        return <PaymentManagement user={user} />;
      
      case 'installments':
        if (hasRoleAccess([
          'DEALER_STAFF',
          'DEALER_MANAGER',
          'EVM_MANAGER',
          'ADMIN',
          'dealer-staff',
          'dealer-manager',
          'evm-manager',
          'admin'
        ])) {
          return <InstallmentManagement user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Installments</h2>
              <p>Access restricted.</p>
            </div>
          </div>
        );
      
      case 'debt-management':
        // DEALER_MANAGER, EVM_MANAGER, ADMIN can access
        if (hasRoleAccess(['DEALER_MANAGER', 'EVM_MANAGER', 'ADMIN', 
                         'dealer-manager', 'evm-manager', 'admin'])) {
          return <DebtManagement user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Debt Management</h2>
              <p>Access restricted to Dealer Manager, EVM Manager, and Admin.</p>
            </div>
          </div>
        );
      
      case 'promotions':
        // All roles can view promotions
        // EVM_MANAGER, ADMIN can manage promotions
        return <PromotionManagement user={user} />;
      
      case 'dealers':
        // Only EVM_MANAGER and ADMIN
        if (hasRoleAccess(['EVM_MANAGER', 'ADMIN', 'evm-manager', 'admin'])) {
          return <DealerManagement user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Dealers</h2>
              <p>Access restricted to EVM Manager and Admin.</p>
            </div>
          </div>
        );
      
      case 'users':
        // Only EVM_MANAGER and ADMIN
        if (hasRoleAccess(['EVM_MANAGER', 'ADMIN', 'evm-manager', 'admin'])) {
          return <UserManagement user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Users</h2>
              <p>Access restricted to EVM Manager and Admin.</p>
            </div>
          </div>
        );
      
      case 'reports':
        // DEALER_MANAGER, EVM_MANAGER, ADMIN can access
        if (hasRoleAccess(['DEALER_MANAGER', 'EVM_MANAGER', 'ADMIN', 
                         'dealer-manager', 'evm-manager', 'admin'])) {
          return <Reports user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Reports</h2>
              <p>Access restricted to Dealer Manager, EVM Manager, and Admin.</p>
            </div>
          </div>
        );
      
      case 'audit-logs':
        // Only ADMIN
        if (hasRoleAccess(['ADMIN', 'admin'])) {
          return <AuditLogs user={user} />;
        }
        return (
          <div className="main">
            <div className="card">
              <h2>Audit Logs</h2>
              <p>Access restricted to Admin only.</p>
            </div>
          </div>
        );
      
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
