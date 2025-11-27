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

  const getMenuItems = (role) => {
    const allItems = [
      { id: 'overview', label: 'Overview', icon: 'bx-home-alt-2', group: 'overview' },
      { id: 'vehicles', label: 'Vehicles', icon: 'bx-car', group: 'vehicleManagement' },
      { id: 'vehicle-management', label: 'Vehicle Management', icon: 'bx-wrench', group: 'vehicleManagement' },
      { id: 'vehicle-types', label: 'Vehicle Types', icon: 'bx-category', group: 'vehicleManagement' },
      { id: 'quotes', label: 'Quotes', icon: 'bx-file', group: 'sales' },
      { id: 'orders', label: 'Orders', icon: 'bx-clipboard', group: 'sales' },
      { id: 'sales-contracts', label: 'Sales Contracts', icon: 'bx-file-blank', group: 'sales' },
      { id: 'inventory', label: 'Inventory', icon: 'bx-box', group: 'logistics' },
      { id: 'customers', label: 'Customers', icon: 'bx-group', group: 'customers' },
      { id: 'test-drives', label: 'Test Drives', icon: 'bx-car', group: 'customers' },
      { id: 'payments', label: 'Payments', icon: 'bx-credit-card', group: 'finance' },
      { id: 'installments', label: 'Installments', icon: 'bx-calendar-check', group: 'finance' },
      { id: 'debt-management', label: 'Debt Management', icon: 'bx-dollar-circle', group: 'finance' },
      { id: 'dealers', label: 'Dealers', icon: 'bx-store', group: 'organization' },
      { id: 'users', label: 'Users', icon: 'bx-user', group: 'organization' },
      { id: 'audit-logs', label: 'Audit Logs', icon: 'bx-history', group: 'reports' },
      { id: 'settings', label: 'Settings', icon: 'bx-cog', group: 'settings' }
    ];

    const normalizedRole = String(role || '').toUpperCase().replace(/[-_]/g, '_');
    
    const rolePermissions = {
      DEALER_STAFF: ['overview', 'activity', 'vehicles', 'quotes', 'orders', 'sales-contracts', 
                     'customers', 'customer-feedback', 'test-drives', 'payments', 'promotions', 'settings'],
      DEALER_MANAGER: ['overview', 'activity', 'vehicles', 'quotes', 'orders', 'sales-contracts', 
                       'customers', 'test-drives', 'payments', 'installments', 'debt-management', 
                       'inventory', 'promotions', 'reports', 'settings'],
      EVM_MANAGER: ['overview', 'activity', 'vehicles', 'vehicle-management', 'vehicle-types', 
                    'vehicle-orders', 'vehicle-distribution', 'quotes', 'orders', 'sales-contracts', 
                    'inventory', 'payments', 'debt-management', 'promotions', 'dealers', 'users', 
                    'reports', 'delivery-tracking', 'settings'],
      ADMIN: ['overview', 'activity', 'vehicles', 'vehicle-management', 'vehicle-types', 
              'vehicle-orders', 'vehicle-distribution', 'sales-contracts', 'inventory', 
              'payments', 'installments', 'debt-management', 'promotions', 'dealers', 'users', 
              'reports', 'delivery-tracking', 'audit-logs', 'settings']
    };

    const allowedIds = rolePermissions[normalizedRole] || allItems.map(item => item.id);
    return allItems.filter(item => allowedIds.includes(item.id));
  };

  const menuItems = getMenuItems(user.role);

  const groupLabels = {
    overview: 'OVERVIEW & ACTIVITY',
    vehicleManagement: 'VEHICLE MANAGEMENT',
    sales: 'SALES & CONTRACTS',
    logistics: 'LOGISTICS & DISTRIBUTION',
    customers: 'CUSTOMERS & SERVICES',
    finance: 'FINANCE',
    organization: 'ORGANIZATION',
    reports: 'REPORTS & AUDIT',
    settings: 'SETTINGS'
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {});

  const renderGroup = (groupName, items) => {
    if (items.length === 0) return null;
    
    const isExpanded = expandedGroups[groupName];

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
        {Object.keys(groupedItems)
          .filter(groupName => groupedItems[groupName] && groupedItems[groupName].length > 0)
          .map(groupName => 
            renderGroup(groupName, groupedItems[groupName] || [])
          )}
      </nav>
    </div>
  );
};

export default Sidebar;
