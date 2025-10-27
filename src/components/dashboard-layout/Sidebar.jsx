import React from 'react';
import 'boxicons/css/boxicons.min.css';

const Sidebar = ({ user, activeItem, onItemClick }) => {
  // Define menu items based on role
  const getMenuItems = (role) => {
    const allItems = [
      { id: 'overview', label: 'Overview', icon: 'bx-home-alt-2' },
      { id: 'activity', label: 'Activity History', icon: 'bx-history' },
      { id: 'vehicles', label: 'Vehicles', icon: 'bx-car' },
      { id: 'vehicle-management', label: 'Vehicle Management', icon: 'bx-wrench' },
      { id: 'vehicle-types', label: 'Vehicle Types', icon: 'bx-category' },
      { id: 'quotes', label: 'Quotes', icon: 'bx-file' },
      { id: 'orders', label: 'Orders', icon: 'bx-clipboard' },
      { id: 'sales-contracts', label: 'Sales Contracts', icon: 'bx-file-blank' },
      { id: 'vehicle-orders', label: 'Vehicle Orders', icon: 'bx-package' },
      { id: 'delivery-tracking', label: 'Delivery Tracking', icon: 'bx-truck' },
      { id: 'customers', label: 'Customers', icon: 'bx-group' },
      { id: 'customer-feedback', label: 'Customer Feedback', icon: 'bx-message' },
      { id: 'test-drives', label: 'Test Drives', icon: 'bx-car' },
      { id: 'payments', label: 'Payments', icon: 'bx-credit-card' },
      { id: 'debt-management', label: 'Debt Management', icon: 'bx-dollar-circle' },
      { id: 'promotions', label: 'Promotions', icon: 'bx-gift' },
      { id: 'dealers', label: 'Dealers', icon: 'bx-store' },
      { id: 'vehicle-distribution', label: 'Vehicle Distribution', icon: 'bx-package' },
      { id: 'users', label: 'Users', icon: 'bx-user' },
      { id: 'audit-logs', label: 'Audit Logs', icon: 'bx-history' },
      { id: 'reports', label: 'Reports', icon: 'bx-bar-chart-alt-2' },
      { id: 'settings', label: 'Settings', icon: 'bx-cog' }
    ];

    // Role-based filtering based on requirements
    switch (role) {
      case 'dealer-staff':
        // Dealer Staff: Common features + vehicles (catalog), quotes, orders, sales-contracts, customers, test-drives, view payments/promotions, customer-feedback
        return allItems.filter(item => 
          ['overview', 'activity', 'vehicles', 'quotes', 'orders', 'sales-contracts', 'customers', 'customer-feedback', 'test-drives', 'payments', 'promotions', 'settings'].includes(item.id)
        );
      case 'ADMIN':
      case 'EVM_MANAGER':
        // Full access including vehicle-types and audit-logs
        return allItems.filter(item => 
          ['overview', 'activity', 'vehicles', 'vehicle-management', 'vehicle-types', 'vehicle-orders', 'vehicle-distribution', 'quotes', 'orders', 'sales-contracts', 'customers', 'customer-feedback', 'test-drives', 'payments', 'debt-management', 'promotions', 'dealers', 'users', 'audit-logs', 'reports', 'delivery-tracking', 'settings'].includes(item.id)
        );
      case 'dealer-manager':
        // Dealer Manager: All dealer staff permissions + dealers, users (staff management), reports, debt-management
        return allItems.filter(item => 
          ['overview', 'activity', 'vehicles', 'quotes', 'orders', 'sales-contracts', 'customers', 'customer-feedback', 'test-drives', 'payments', 'debt-management', 'promotions', 'dealers', 'users', 'reports', 'settings'].includes(item.id)
        );
      case 'evm-staff':
        // EVM Staff: Common features + vehicles (CRUD), vehicle-management (CRUD), vehicle-types (CRUD), vehicle-orders, vehicle-distribution, orders, customers, payments, promotions, dealers, users, reports, delivery-tracking
        return allItems.filter(item => 
          ['overview', 'activity', 'vehicles', 'vehicle-management', 'vehicle-types', 'vehicle-orders', 'vehicle-distribution', 'orders', 'customers', 'payments', 'promotions', 'dealers', 'users', 'reports', 'delivery-tracking', 'settings'].includes(item.id)
        );
      case 'admin':
        // Admin: Full system access including logs
        return allItems;
      default:
        return allItems;
    }
  };

  const menuItems = getMenuItems(user.role);

  return (
    <div className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-text">EVM</span>
      </div>
      
      <nav className="sidebar__menu">
        {menuItems.map((item) => (
          <a
            key={item.id}
            href="#"
            className={`sidebar__item ${activeItem === item.id ? 'sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onItemClick(item.id);
            }}
          >
            <i className={`bx ${item.icon} sidebar__item-icon`}></i>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
