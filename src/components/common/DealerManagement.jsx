import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const DealerManagement = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [dealers] = useState([
    { id: 1, name: 'Metro Auto Group', location: 'New York', status: 'active', staff: 25, sales: 145, revenue: '$6.5M', phone: '+1 234 567 8900' },
    { id: 2, name: 'City Motors', location: 'Los Angeles', status: 'active', staff: 18, sales: 132, revenue: '$5.9M', phone: '+1 234 567 8901' },
    { id: 3, name: 'Green Drive Dealers', location: 'Chicago', status: 'pending', staff: 12, sales: 108, revenue: '$4.8M', phone: '+1 234 567 8902' },
    { id: 4, name: 'Eco Auto Center', location: 'Miami', status: 'inactive', staff: 8, sales: 52, revenue: '$2.1M', phone: '+1 234 567 8903' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--color-success)';
      case 'pending': return 'var(--color-warning)';
      case 'inactive': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Dealer Management</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="bx bx-plus"></i>
            Add Dealer
          </button>
        </div>

        {/* Dealer Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Dealers', value: dealers.length },
            { label: 'Active', value: dealers.filter(d => d.status === 'active').length },
            { label: 'Total Staff', value: dealers.reduce((sum, d) => sum + d.staff, 0) },
            { label: 'Total Revenue', value: dealers.reduce((sum, d) => sum + parseFloat(d.revenue.replace('$', '').replace('M', '')), 0) + 'M' }
          ].map((stat, index) => (
            <div key={index} style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Dealers Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Dealer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Location</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Staff</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Sales</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Revenue</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dealers.map((dealer) => (
                <tr key={dealer.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{dealer.name}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{dealer.location}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(dealer.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {dealer.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{dealer.staff}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>{dealer.sales}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>{dealer.revenue}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }}>
                        <i className="bx bx-show"></i>
                      </button>
                      <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }}>
                        <i className="bx bx-edit"></i>
                      </button>
                      <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }}>
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DealerManagement;

