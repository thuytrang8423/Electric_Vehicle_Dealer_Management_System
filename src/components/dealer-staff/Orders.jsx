import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const Orders = ({ user }) => {
  const [orders] = useState([
    { id: 'ORD-001', customer: 'John Smith', vehicle: 'Tesla Model 3', amount: 45000, status: 'processing', date: '2024-01-15' },
    { id: 'ORD-002', customer: 'Sarah Johnson', vehicle: 'BMW i3', amount: 42000, status: 'confirmed', date: '2024-01-14' },
    { id: 'ORD-003', customer: 'Mike Chen', vehicle: 'Nissan Leaf', amount: 32000, status: 'delivered', date: '2024-01-10' }
  ]);

  return (
    <div className="main">
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>Orders Management</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {orders.map(order => (
            <div key={order.id} style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{order.id}</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{order.customer} - {order.vehicle}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>${order.amount.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{order.status}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;

