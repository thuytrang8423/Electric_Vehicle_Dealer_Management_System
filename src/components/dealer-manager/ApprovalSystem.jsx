import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const ApprovalSystem = ({ user }) => {
  const [pendingItems] = useState([
    { id: 1, type: 'quote', reference: 'Quote #5678', amount: 42750, customer: 'John Doe', requestedBy: 'Staff Member A', date: '2024-01-15' },
    { id: 2, type: 'order', reference: 'Order ORD-003', amount: 52000, customer: 'Jane Smith', requestedBy: 'Staff Member B', date: '2024-01-14' }
  ]);

  const handleApprove = (id) => {
    alert(`Approved item ${id}`);
  };

  const handleReject = (id) => {
    alert(`Rejected item ${id}`);
  };

  return (
    <div className="main">
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>Pending Approvals</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          {pendingItems.map(item => (
            <div key={item.id} style={{ padding: '20px', background: 'var(--color-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
                    {item.type.toUpperCase()} - {item.reference}
                  </h3>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    Customer: {item.customer} | Requested by: {item.requestedBy}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Date: {item.date}</div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>
                  ${item.amount.toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => handleReject(item.id)}>
                  <i className="bx bx-x"></i>
                  Reject
                </button>
                <button className="btn btn-primary" onClick={() => handleApprove(item.id)}>
                  <i className="bx bx-check"></i>
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApprovalSystem;

