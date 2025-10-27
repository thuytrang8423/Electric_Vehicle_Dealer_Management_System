import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import NotificationDropdown from '../common/NotificationDropdown';
import 'boxicons/css/boxicons.min.css';

const Header = ({ user, onLogout, onProfileClick, notifications, onMarkAsRead, onMarkAllAsRead, onDeleteNotification }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'dealer-staff': 'Dealer Staff',
      'dealer-manager': 'Dealer Manager',
      'evm-staff': 'EVM Staff',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const handleLogout = () => {
    setShowDropdown(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="header">
      <div className="header__left">
        <div className="header__search">
          <i className="bx bx-search header__search-icon"></i>
          <input
            type="text"
            className="header__search-input"
            placeholder="Search vehicles, orders, customers..."
          />
        </div>
      </div>

      <div className="header__right">
        <NotificationDropdown 
          notifications={notifications || []}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onDeleteNotification={onDeleteNotification}
        />

        <button 
          className="btn btn-outline"
          onClick={toggleDarkMode}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <i className={`bx ${isDarkMode ? 'bx-sun' : 'bx-moon'}`}></i>
          {isDarkMode ? 'Light' : 'Dark'}
        </button>

        <div 
          className="header__user" 
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
          <div className="header__user-avatar">
            <i className="bx bx-user"></i>
          </div>
          <div className="header__user-info">
            <div className="header__user-name">{user.name}</div>
            <div className="header__user-role">{getRoleDisplayName(user.role)}</div>
          </div>
          
          <i className="bx bx-chevron-down" style={{ 
            fontSize: '20px', 
            color: 'var(--color-text-muted)',
            transition: 'transform 0.2s ease'
          }}></i>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div 
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-hover)',
                border: '1px solid var(--color-border)',
                minWidth: '200px',
                overflow: 'hidden',
                zIndex: 1000,
                animation: 'slideDown 0.2s ease'
              }}
            >
              <div style={{
                padding: '8px',
                borderBottom: '1px solid var(--color-border)'
              }}>
                <div style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                  {user.name}
                </div>
                <div style={{ padding: '0 12px 12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {user.email || user.role}
                </div>
              </div>
              
              <div style={{ padding: '4px' }}>
                <button
                  onClick={handleProfileClick}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--color-bg)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <i className="bx bx-user"></i>
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <i className="bx bx-log-out"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
