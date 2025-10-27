import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const Sidebar = ({ user, activeItem, onItemClick }) => {
  const [expandedGroups, setExpandedGroups] = useState({
    overview: true,
    vehicleManagement: true,
    sales: true,
    logistics: true,
    customers: true,
    finance: true,
    organization: true,
    reports: true
  });

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Define menu items based on role
  const getMenuItems = (role) => {
    const allItems = [
      // Overview & Activity
      { id: 'overview', label: 'Overview', icon: 'bx-home-alt-2', group: 'overview' },
      { id: 'activity', label: 'Activity History', icon: 'bx-history', group: 'overview' },
      
      // Vehicle Management
      { id: 'vehicles', label: 'Vehicles', icon: 'bx-car', group: 'vehicleManagement' },
      { id: 'vehicle-management', label: 'Vehicle Management', icon: 'bx-wrench', group: 'vehicleManagement' },
      { id: 'vehicle-types', label: 'Vehicle Types', icon: 'bx-category', group: 'vehicleManagement' },
      
      // Sales & Contracts
      { id: 'quotes', label: 'Quotes', icon: 'bx-file', group: 'sales' },
      { id: 'orders', label: 'Orders', icon: 'bx-clipboard', group: 'sales' },
      { id: 'sales-contracts', label: 'Sales Contracts', icon: 'bx-file-blank', group: 'sales' },
      
      // Logistics
      { id: 'vehicle-orders', label: 'Vehicle Orders', icon: 'bx-package', group: 'logistics' },
      { id: 'delivery-tracking', label: 'Delivery Tracking', icon: 'bx-location-plus', group: 'logistics' },
      { id: 'vehicle-distribution', label: 'Vehicle Distribution', icon: 'bx-package', group: 'logistics' },
      
      // Customers & Services
      { id: 'customers', label: 'Customers', icon: 'bx-group', group: 'customers' },
      { id: 'customer-feedback', label: 'Customer Feedback', icon: 'bx-message', group: 'customers' },
      { id: 'test-drives', label: 'Test Drives', icon: 'bx-car', group: 'customers' },
      
      // Finance & Promotions
      { id: 'payments', label: 'Payments', icon: 'bx-credit-card', group: 'finance' },
      { id: 'debt-management', label: 'Debt Management', icon: 'bx-dollar-circle', group: 'finance' },
      { id: 'promotions', label: 'Promotions', icon: 'bx-gift', group: 'finance' },
      
      // Organization
      { id: 'dealers', label: 'Dealers', icon: 'bx-store', group: 'organization' },
      { id: 'users', label: 'Users', icon: 'bx-user', group: 'organization' },
      
      // Reports & Audit
      { id: 'reports', label: 'Reports', icon: 'bx-bar-chart-alt-2', group: 'reports' },
      { id: 'audit-logs', label: 'Audit Logs', icon: 'bx-history', group: 'reports' },
      
      // Settings
      { id: 'settings', label: 'Settings', icon: 'bx-cog', group: 'settings' }
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
        // Full access including vehicle-types and audit-logs, but no customers group
        return allItems.filter(item => 
          ['overview', 'activity', 'vehicles', 'vehicle-management', 'vehicle-types', 'vehicle-orders', 'vehicle-distribution', 'quotes', 'orders', 'sales-contracts', 'payments', 'debt-management', 'promotions', 'dealers', 'users', 'audit-logs', 'reports', 'delivery-tracking', 'settings'].includes(item.id)
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
      case 'evm-manager':
        // EVM Manager: Same as EVM Staff but with additional management permissions
        return allItems.filter(item => 
          ['overview', 'activity', 'vehicles', 'vehicle-management', 'vehicle-types', 'vehicle-orders', 'vehicle-distribution', 'orders', 'customers', 'payments', 'promotions', 'dealers', 'users', 'reports', 'delivery-tracking', 'settings'].includes(item.id)
        );
      case 'admin':
        // Admin: Full system access including logs, but no customers group
        return allItems.filter(item => !['customers', 'customer-feedback', 'test-drives'].includes(item.id));
      default:
        return allItems;
    }
  };

  const menuItems = getMenuItems(user.role);

  // Define groups with labels
  const groupLabels = {
    overview: 'OVERVIEW & ACTIVITY',
    vehicleManagement: 'VEHICLE MANAGEMENT',
    sales: 'SALES & CONTRACTS',
    logistics: 'LOGISTICS & DISTRIBUTION',
    customers: 'CUSTOMERS & SERVICES',
    finance: 'FINANCE & PROMOTIONS',
    organization: 'ORGANIZATION',
    reports: 'REPORTS & AUDIT',
    settings: 'Setting'
  };

  // Group menu items by their group
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {});

  const renderGroup = (groupName, items) => {
    const isExpanded = expandedGroups[groupName];
    
    // Don't render group if no items in it
    if (items.length === 0) return null;

    return (
      <div key={groupName} className="sidebar__group">
        <div 
          className="sidebar__group-header"
          onClick={() => toggleGroup(groupName)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          <span>{groupLabels[groupName]}</span>
          <i 
            className={`bx ${isExpanded ? 'bx-chevron-down' : 'bx-chevron-right'}`}
            style={{
              fontSize: '16px',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
        
        {isExpanded && items.map((item) => (
          <a
            key={item.id}
            href="#"
            className={`sidebar__item ${activeItem === item.id ? 'sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onItemClick(item.id);
            }}
            style={{ paddingLeft: '40px' }}
          >
            <i className={`bx ${item.icon} sidebar__item-icon`}></i>
            {item.label}
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-text">EVM</span>
      </div>
      
      <nav className="sidebar__menu">
        {Object.keys(groupLabels).map(groupName => 
          renderGroup(groupName, groupedItems[groupName] || [])
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
