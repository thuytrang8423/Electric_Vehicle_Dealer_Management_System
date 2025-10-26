import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const PaymentManagement = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [payments, setPayments] = useState([
    { id: 1, orderId: 'ORD-001', customer: 'John Doe', amount: 45000, method: 'Bank Transfer', date: '2024-01-15', status: 'completed', receipt: true, transactionId: 'TXN-001' },
    { id: 2, orderId: 'ORD-002', customer: 'Jane Smith', amount: 42000, method: 'Cash', date: '2024-01-14', status: 'completed', receipt: true, transactionId: 'TXN-002' },
    { id: 3, orderId: 'ORD-003', customer: 'Mike Chen', amount: 32000, method: 'Credit Card', date: '2024-01-13', status: 'pending', receipt: false, transactionId: 'TXN-003' }
  ]);

  const [formData, setFormData] = useState({
    orderId: '',
    customer: '',
    amount: '',
    method: '',
    date: '',
    status: 'pending',
    transactionId: ''
  });

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

  const handleAddPayment = () => {
    setEditingPayment(null);
    setFormData({
      orderId: '',
      customer: '',
      amount: '',
      method: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      transactionId: ''
    });
    setShowModal(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setFormData({
      orderId: payment.orderId,
      customer: payment.customer,
      amount: payment.amount.toString(),
      method: payment.method,
      date: payment.date,
      status: payment.status,
      transactionId: payment.transactionId
    });
    setShowModal(true);
  };

  const handleDeletePayment = (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      setPayments(payments.filter(p => p.id !== paymentId));
      showSuccessToast('Payment deleted successfully');
    }
  };

  const handleStatusChange = (paymentId, newStatus) => {
    setPayments(payments.map(p => 
      p.id === paymentId ? { ...p, status: newStatus } : p
    ));
    showSuccessToast(`Payment status updated to ${newStatus}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.orderId || !formData.customer || !formData.amount) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    const paymentData = {
      orderId: formData.orderId,
      customer: formData.customer,
      amount: parseInt(formData.amount) || 0,
      method: formData.method,
      date: formData.date,
      status: formData.status,
      transactionId: formData.transactionId,
      receipt: formData.status === 'completed'
    };

    if (editingPayment) {
      // Update existing payment
      setPayments(payments.map(p => 
        p.id === editingPayment.id 
          ? { ...p, ...paymentData }
          : p
      ));
      showSuccessToast('Payment updated successfully');
    } else {
      // Add new payment
      const newPayment = {
        id: Math.max(...payments.map(p => p.id)) + 1,
        ...paymentData
      };
      setPayments([...payments, newPayment]);
      showSuccessToast('Payment recorded successfully');
    }

    setShowModal(false);
    setFormData({
      orderId: '',
      customer: '',
      amount: '',
      method: '',
      date: '',
      status: 'pending',
      transactionId: ''
    });
  };

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
          <button className="btn btn-primary" onClick={handleAddPayment}>
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
                      {payment.status === 'pending' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px', fontSize: '12px' }}
                          onClick={() => handleStatusChange(payment.id, 'completed')}
                        >
                          <i className="bx bx-check"></i>
                        </button>
                      )}
                      {payment.status === 'completed' && (
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '6px', fontSize: '12px', color: 'var(--color-error)' }}
                          onClick={() => handleStatusChange(payment.id, 'failed')}
                        >
                          <i className="bx bx-x"></i>
                        </button>
                      )}
                      {payment.receipt && (
                        <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }}>
                          <i className="bx bx-download"></i>
                        </button>
                      )}
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px' }}
                        onClick={() => handleEditPayment(payment)}
                        title="Edit Payment"
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px', color: 'var(--color-error)' }}
                        onClick={() => handleDeletePayment(payment.id)}
                        title="Delete Payment"
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-credit-card" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No payments found</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAddPayment}>
              <i className="bx bx-plus"></i>
              Record First Payment
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>{editingPayment ? 'Edit Payment' : 'Record New Payment'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Order ID *
                  </label>
                  <input
                    type="text"
                    value={formData.orderId}
                    onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="ORD-001"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Amount ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="45000"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Payment Method *
                    </label>
                    <select
                      value={formData.method}
                      onChange={(e) => setFormData({...formData, method: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      required
                    >
                      <option value="">Select Method</option>
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Financing">Financing</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="TXN-001"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPayment ? 'Update Payment' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;