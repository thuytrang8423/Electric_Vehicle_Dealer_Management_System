import React from 'react';
import 'boxicons/css/boxicons.min.css';

const Sidebar = ({ user, activeItem, onItemClick }) => {
  // Define menu items based on role
  const getMenuItems = (role) => {
    const allItems = [
      { id: 'overview', label: 'Overview', icon: 'bx-home-alt-2' },
      { id: 'activity', label: 'Activity History', icon: 'bx-history' },
      { id: 'vehicles', label: 'Vehicles', icon: 'bx-car' },
      { id: 'quotes', label: 'Quotes', icon: 'bx-file' },
      { id: 'orders', label: 'Orders', icon: 'bx-clipboard' },
      { id: 'customers', label: 'Customers', icon: 'bx-group' },
      { id: 'test-drives', label: 'Test Drives', icon: 'bx-car' },
      { id: 'payments', label: 'Payments', icon: 'bx-credit-card' },
      { id: 'promotions', label: 'Promotions', icon: 'bx-gift' },
      { id: 'dealers', label: 'Dealers', icon: 'bx-store' },
      { id: 'users', label: 'Users', icon: 'bx-user' },
      { id: 'logs', label: 'System Logs', icon: 'bx-terminal' },
      { id: 'reports', label: 'Reports', icon: 'bx-bar-chart-alt-2' },
      { id: 'settings', label: 'Settings', icon: 'bx-cog' }
    ];

    // Role-based filtering based on requirements
    switch (role) {
      case 'dealer-staff':
        // Dealer Staff: Common features + vehicles (catalog), quotes, orders, customers, test-drives, view payments/promotions
        return allItems.filter(item => 
          ['overview', 'activity', 'vehicles', 'quotes', 'orders', 'customers', 'test-drives', 'payments', 'promotions', 'settings'].includes(item.id)
        );
      case 'dealer-manager':
        // Dealer Manager: All dealer staff permissions + dealers, users (staff management), reports
        return allItems.filter(item => 
          ['overview', 'activity', 'vehicles', 'quotes', 'orders', 'customers', 'test-drives', 'payments', 'promotions', 'dealers', 'users', 'reports', 'settings'].includes(item.id)
        );
      case 'evm-staff':
        // EVM Staff: Common features + vehicles (CRUD), orders, customers, payments, promotions, dealers, users, reports
        return allItems.filter(item => 
          ['overview', 'activity', 'vehicles', 'orders', 'customers', 'payments', 'promotions', 'dealers', 'users', 'reports', 'settings'].includes(item.id)
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
        <div className="sidebar__logo-icon">
          <i className="bx bx-bolt-circle"></i>
        </div>
        EV-DMS
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
