import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const SystemLogs = ({ user }) => {
  const [logs] = useState([
    { id: 1, level: 'info', message: 'User login successful', user: 'john@dealer.com', timestamp: '2024-01-15 10:30:00', module: 'auth' },
    { id: 2, level: 'warning', message: 'Low inventory detected', user: 'system', timestamp: '2024-01-15 10:25:00', module: 'inventory' },
    { id: 3, level: 'error', message: 'Payment processing failed', user: 'system', timestamp: '2024-01-15 09:45:00', module: 'payment' },
    { id: 4, level: 'info', message: 'Order created', user: 'jane@dealer.com', timestamp: '2024-01-15 09:30:00', module: 'order' }
  ]);

  const getLogColor = (level) => {
    const colors = {
      info: 'var(--color-info)',
      warning: 'var(--color-warning)',
      error: 'var(--color-error)',
      success: 'var(--color-success)'
    };
    return colors[level] || 'var(--color-text-muted)';
  };

  return (
    <div className="main">
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>System Logs</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.map(log => (
            <div key={log.id} style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius)',
                    background: getLogColor(log.level),
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {log.level}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{log.module}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{log.timestamp}</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{log.message}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>User: {log.user}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;

