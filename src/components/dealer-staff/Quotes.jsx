import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const Quotes = ({ user }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quotes, setQuotes] = useState([
    { id: 1, customer: 'John Doe', vehicle: 'Tesla Model 3', basePrice: 45000, discount: 2250, total: 42750, status: 'pending', created: '2024-01-15' },
    { id: 2, customer: 'Jane Smith', vehicle: 'BMW i3', basePrice: 42000, discount: 4200, total: 37800, status: 'approved', created: '2024-01-14' },
    { id: 3, customer: 'Mike Chen', vehicle: 'Nissan Leaf', basePrice: 32000, discount: 0, total: 32000, status: 'expired', created: '2024-01-10' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--color-warning)';
      case 'approved': return 'var(--color-success)';
      case 'expired': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesStatus = selectedStatus === 'all' || quote.status === selectedStatus;
    const matchesSearch = quote.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quote.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Quotes Management</h2>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <i className="bx bx-plus"></i>
            Create New Quote
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search quotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'approved', 'expired'].map(status => (
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
        </div>

        {/* Quotes Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Vehicle</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Base Price</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Discount</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => (
                <tr key={quote.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', fontWeight: '600' }}>#{quote.id}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{quote.customer}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{quote.vehicle}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>${quote.basePrice.toLocaleString()}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                    ${quote.discount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-primary)', fontWeight: '600', textAlign: 'right' }}>
                    ${quote.total.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(quote.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {quote.status}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{quote.created}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }}>
                        <i className="bx bx-edit"></i>
                      </button>
                      <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }}>
                        <i className="bx bx-download"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredQuotes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-file" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No quotes found</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quotes;

