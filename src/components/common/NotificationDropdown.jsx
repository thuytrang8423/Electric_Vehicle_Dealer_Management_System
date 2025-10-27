import React, { useState, useRef, useEffect } from 'react';
import { showSuccessToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const NotificationDropdown = ({ notifications, onMarkAsRead, onMarkAllAsRead, onDeleteNotification }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    const icons = {
      order: 'bx-clipboard',
      payment: 'bx-credit-card',
      'test-drive': 'bx-car',
      quote: 'bx-file',
      promotion: 'bx-gift',
      inventory: 'bx-box'
    };
    return icons[type] || 'bx-bell';
  };

  const getNotificationColor = (type) => {
    const colors = {
      order: 'var(--color-info)',
      payment: 'var(--color-success)',
      'test-drive': 'var(--color-secondary)',
      quote: 'var(--color-accent)',
      promotion: 'var(--color-primary)',
      inventory: 'var(--color-warning)'
    };
    return colors[type] || 'var(--color-text-muted)';
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
      showSuccessToast('All notifications marked as read');
    }
  };

  const handleDeleteNotification = (e, id) => {
    e.stopPropagation();
    if (onDeleteNotification) {
      onDeleteNotification(id);
      showSuccessToast('Notification deleted');
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: 'var(--radius)',
          color: 'var(--color-text)',
          fontSize: '20px',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = 'var(--color-bg)'}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
      >
        <i className="bx bx-bell"></i>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'var(--color-error)',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '10px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '380px',
          maxHeight: '500px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-hover)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          zIndex: 1000,
          animation: 'slideDown 0.2s ease'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--color-text)'
            }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  background: 'var(--color-error)',
                  color: 'white',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {unreadCount} new
                </span>
              )}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--color-primary)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--color-primary)';
                }}
              >
                Mark All as Read
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: '18px',
                  padding: '4px'
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{
            maxHeight: '350px',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--color-primary) var(--color-bg)'
          }} className="notification-scroll">
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--color-text-muted)'
              }}>
                <i className="bx bx-bell" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                <div>No notifications</div>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    background: notification.read ? 'transparent' : 'var(--color-bg)',
                    transition: 'background 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--color-bg)'}
                  onMouseLeave={(e) => e.target.style.background = notification.read ? 'transparent' : 'var(--color-bg)'}
                >
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div style={{
                      position: 'absolute',
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '6px',
                      height: '6px',
                      background: 'var(--color-primary)',
                      borderRadius: '50%'
                    }}></div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: getNotificationColor(notification.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px',
                      flexShrink: 0
                    }}>
                      <i className={`bx ${getNotificationIcon(notification.type)}`}></i>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: notification.read ? '500' : '600',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                        marginBottom: '4px',
                        lineHeight: '1.4'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--color-text-muted)',
                        marginBottom: '6px',
                        lineHeight: '1.3'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{notification.timestamp}</span>
                        <span>•</span>
                        <span style={{
                          textTransform: 'capitalize',
                          color: getNotificationColor(notification.type)
                        }}>
                          {notification.type}
                        </span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)',
                        fontSize: '16px',
                        padding: '4px',
                        borderRadius: 'var(--radius)',
                        transition: 'all 0.2s ease',
                        opacity: 0.6
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = '1';
                        e.target.style.background = 'var(--color-error)';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = '0.6';
                        e.target.style.background = 'transparent';
                        e.target.style.color = 'var(--color-text-muted)';
                      }}
                    >
                      <i className="bx bx-x"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* CSS Animations and Scrollbar */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .notification-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .notification-scroll::-webkit-scrollbar-track {
          background: var(--color-bg);
          border-radius: 3px;
        }

        .notification-scroll::-webkit-scrollbar-thumb {
          background: var(--color-primary);
          border-radius: 3px;
          transition: background 0.2s ease;
        }

        .notification-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--color-primary-dark, #5a52d5);
        }

        .notification-scroll::-webkit-scrollbar-corner {
          background: var(--color-bg);
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
