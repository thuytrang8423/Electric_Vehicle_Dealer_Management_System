import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const RoleSelector = ({ onRoleChange }) => {
  const [selectedRole, setSelectedRole] = useState('admin');

  const roles = [
    { 
      value: 'dealer-staff', 
      label: 'Dealer Staff', 
      description: 'View vehicles, create/view orders, manage customers, test drives, view payments/promotions', 
      icon: 'bx bx-user' 
    },
    { 
      value: 'dealer-manager', 
      label: 'Dealer Manager', 
      description: 'Approve orders, manage payments, apply promotions, partial dealer management, staff management', 
      icon: 'bx bx-user-check' 
    },
    { 
      value: 'evm-staff', 
      label: 'EVM Staff', 
      description: 'CRUD vehicles, view orders/customers, track payments, create promotions, full dealer management', 
      icon: 'bx bx-cog' 
    },
    { 
      value: 'admin', 
      label: 'Administrator', 
      description: 'Full system access, user management, global reports, approve promotions', 
      icon: 'bx bx-shield' 
    }
  ];

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    onRoleChange(role);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '80px', 
      right: '20px', 
      background: 'var(--color-surface)', 
      padding: '16px', 
      borderRadius: 'var(--radius)', 
      boxShadow: 'var(--shadow)',
      border: '1px solid var(--color-border)',
      zIndex: 1000,
      minWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="bx bx-user-circle"></i>
        Switch User Role
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => handleRoleChange(role.value)}
            style={{
              padding: '12px',
              border: selectedRole === role.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              background: selectedRole === role.value ? 'var(--color-bg)' : 'var(--color-surface)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className={role.icon}></i>
              {role.label}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {role.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
