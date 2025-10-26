import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const PromotionManagement = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [promotions, setPromotions] = useState([
    { id: 1, name: 'Holiday Special', discount: '10%', code: 'HOLIDAY2024', validFrom: '2024-01-01', validTo: '2024-02-01', status: 'active', applications: 156 },
    { id: 2, name: 'New Year Sale', discount: '15%', code: 'NEWYEAR2024', validFrom: '2024-01-15', validTo: '2024-01-31', status: 'active', applications: 89 },
    { id: 3, name: 'End of Year', discount: '20%', code: 'EOY2023', validFrom: '2023-12-01', validTo: '2023-12-31', status: 'expired', applications: 234 }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--color-success)';
      case 'expired': return 'var(--color-error)';
      case 'pending': return 'var(--color-warning)';
      default: return 'var(--color-text-muted)';
    }
  };

  const filteredPromotions = promotions.filter(p => selectedStatus === 'all' || p.status === selectedStatus);

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Promotion Management</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="bx bx-plus"></i>
            Create Promotion
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['all', 'active', 'expired', 'pending'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`btn ${selectedStatus === status ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Promotions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredPromotions.map((promo) => (
            <div key={promo.id} style={{
              padding: '20px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius)',
              border: `2px solid ${promo.status === 'active' ? 'var(--color-success)' : 'var(--color-border)'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
                    {promo.name}
                  </h3>
                  <div style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Code: <strong>{promo.code}</strong></div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-surface)',
                  color: getStatusColor(promo.status),
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {promo.status}
                </span>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-primary)', borderRadius: 'var(--radius)', color: 'white', fontWeight: '700', fontSize: '24px', marginBottom: '16px', textAlign: 'center' }}>
                {promo.discount} OFF
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                <i className="bx bx-calendar"></i> {promo.validFrom} to {promo.validTo}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                <i className="bx bx-user"></i> {promo.applications} applications
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }}>
                  <i className="bx bx-edit"></i>
                  Edit
                </button>
                <button className="btn btn-outline">
                  <i className="bx bx-copy"></i>
                </button>
                <button className="btn btn-outline">
                  <i className="bx bx-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPromotions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-gift" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No promotions found</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionManagement;

