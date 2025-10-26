import React, { useState, useEffect } from 'react';
import 'boxicons/css/boxicons.min.css';

const Notifications = ({ user }) => {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New order received', message: 'Order ORD-001 from John Doe', timestamp: '2 minutes ago', read: false, type: 'order' },
    { id: 2, title: 'Payment completed', message: 'Payment for ORD-002 has been received', timestamp: '15 minutes ago', read: false, type: 'payment' },
    { id: 3, title: 'Test drive scheduled', message: 'Customer Mike Chen scheduled a test drive for tomorrow', timestamp: '1 hour ago', read: false, type: 'test-drive' },
    { id: 4, title: 'Quote approved', message: 'Quote #5678 has been approved by manager', timestamp: '2 hours ago', read: true, type: 'quote' },
    { id: 5, title: 'New promotion', message: 'Holiday special promotion is now active', timestamp: '3 hours ago', read: true, type: 'promotion' },
    { id: 6, title: 'Inventory alert', message: 'Low stock for Tesla Model 3 in your dealership', timestamp: '5 hours ago', read: true, type: 'inventory' }
  ]);
  const [showBadge, setShowBadge] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    setShowBadge(unreadCount > 0);
  }, [unreadCount]);

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

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteAll = () => {
    if (window.confirm('Delete all notifications?')) {
      setNotifications([]);
    }
  };

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: '12px',
                padding: '4px 10px',
                background: 'var(--color-error)',
                color: 'white',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {unreadCount} new
              </span>
            )}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {unreadCount > 0 && (
              <button className="btn btn-outline" onClick={markAllAsRead}>
                <i className="bx bx-check-double"></i>
                Mark all as read
              </button>
            )}
            <button className="btn btn-outline" onClick={deleteAll}>
              <i className="bx bx-trash"></i>
              Clear all
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                background: notification.read ? 'var(--color-surface)' : 'var(--color-bg)',
                border: `1px solid ${notification.read ? 'var(--color-border)' : 'var(--color-primary)'}`,
                borderRadius: 'var(--radius)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: getNotificationColor(notification.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                flexShrink: 0
              }}>
                <i className={`bx ${getNotificationIcon(notification.type)}`}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '15px' }}>
                      {notification.title}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      {notification.message}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {notification.timestamp}
                  </div>
                </div>
                {!notification.read && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <i className="bx bx-check"></i>
                      Mark read
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <i className="bx bx-x"></i>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-bell" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
            <div>No notifications</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

