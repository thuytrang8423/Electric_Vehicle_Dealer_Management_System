import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'boxicons/css/boxicons.min.css';

const PaymentManagement = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [payments, setPayments] = useState([
    { id: 1, orderId: 'ORD-001', customer: 'John Doe', amount: 45000, method: 'Bank Transfer', date: '2024-01-15', status: 'completed', receipt: true },
    { id: 2, orderId: 'ORD-002', customer: 'Jane Smith', amount: 42000, method: 'Cash', date: '2024-01-14', status: 'completed', receipt: true },
    { id: 3, orderId: 'ORD-003', customer: 'Mike Chen', amount: 32000, method: 'Credit Card', date: '2024-01-13', status: 'pending', receipt: false }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--color-success)';
      case 'pending': return 'var(--color-warning)';
      case 'failed': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const filteredPayments = payments.filter(p => selectedType === 'all' || p.status === selectedType);
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="main">
      {/* Summary Cards */}
      <div className="cards-grid">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Total Revenue</h3>
            <div className="card__icon card__icon--primary">
              <i className="bx bx-dollar-circle"></i>
            </div>
          </div>
          <div className="card__value">${totalRevenue.toLocaleString()}</div>
          <div className="card__change card__change--positive">
            <i className="bx bx-trending-up"></i>
            +12.5%
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Pending Payments</h3>
            <div className="card__icon card__icon--warning">
              <i className="bx bx-time"></i>
            </div>
          </div>
          <div className="card__value">${pendingAmount.toLocaleString()}</div>
          <div className="card__change card__change--negative">
            <i className="bx bx-info-circle"></i>
            {payments.filter(p => p.status === 'pending').length} pending
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Completed</h3>
            <div className="card__icon card__icon--success">
              <i className="bx bx-check-circle"></i>
            </div>
          </div>
          <div className="card__value">{payments.filter(p => p.status === 'completed').length}</div>
          <div className="card__change card__change--positive">
            <i className="bx bx-trending-up"></i>
            Payments
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Payment History</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="bx bx-plus"></i>
            Record Payment
          </button>
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Revenue Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { month: 'Jan', revenue: 180, pending: 45 },
            { month: 'Feb', revenue: 220, pending: 38 },
            { month: 'Mar', revenue: 195, pending: 52 },
            { month: 'Apr', revenue: 250, pending: 48 },
            { month: 'May', revenue: 280, pending: 61 },
            { month: 'Jun', revenue: 320, pending: 58 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" stroke="var(--color-text-muted)" />
            <YAxis stroke="var(--color-text-muted)" />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--color-surface)', 
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)'
              }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#6C63FF" name="Completed (K)" />
            <Bar dataKey="pending" fill="#F59E0B" name="Pending (K)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['all', 'completed', 'pending', 'failed'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`btn ${selectedType === type ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Payments Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Order ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Method</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{payment.orderId}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{payment.customer}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>
                    ${payment.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{payment.method}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{payment.date}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(payment.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {payment.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {payment.receipt && (
                        <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }}>
                          <i className="bx bx-download"></i>
                        </button>
                      )}
                      <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }}>
                        <i className="bx bx-show"></i>
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

export default PaymentManagement;

