import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { customersAPI } from '../../utils/api/customersAPI';
import { dealersAPI } from '../../utils/api/dealersAPI';
import { debtsAPI } from '../../utils/api/debtsAPI';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const DebtManagement = ({ user }) => {
  const [customerDebts, setCustomerDebts] = useState([]);
  const [dealerDebts, setDealerDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all'); // all, customer, dealer
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');

  const userRole = user?.role?.toUpperCase().replace(/-/g, '_');

  // Load debts from customers and dealers
  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);

      const [customers, dealers] = await Promise.all([
        customersAPI.getAll(),
        dealersAPI.getAll()
      ]);

      // Filter customers with debt > 0
      const customersWithDebt = Array.isArray(customers)
        ? customers
            .filter(c => c.totalDebt && c.totalDebt > 0)
            .map(c => ({
              id: c.id,
              name: c.fullName || 'N/A',
              type: 'customer',
              totalDebt: c.totalDebt || 0,
              phone: c.phone,
              email: c.email,
              dealerName: c.dealerName,
              isVip: c.isVip
            }))
        : [];

      // Filter dealers with debt > 0
      const dealersWithDebt = Array.isArray(dealers)
        ? dealers
            .filter(d => d.outstandingDebt && d.outstandingDebt > 0)
            .map(d => ({
              id: d.dealerId,
              name: d.name || 'N/A',
              type: 'dealer',
              totalDebt: d.outstandingDebt || 0,
              phone: d.phone,
              address: d.address,
              region: d.region,
              status: d.status
            }))
        : [];

      setCustomerDebts(customersWithDebt);
      setDealerDebts(dealersWithDebt);
    } catch (error) {
      console.error('Error loading debts:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePayDebt = (debt) => {
    setSelectedDebt(debt);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const handleAddDebt = (debt) => {
    setSelectedDebt(debt);
    setAdjustAmount('');
    setShowAdjustModal(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedDebt || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      showErrorToast('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);

    if (amount > selectedDebt.totalDebt) {
      showErrorToast('Payment amount cannot exceed outstanding debt');
      return;
    }

    try {
      if (selectedDebt.type === 'customer') {
        await debtsAPI.payCustomerDebt(selectedDebt.id, amount);
        showSuccessToast(`Customer ${selectedDebt.name} paid $${amount.toLocaleString()}`);
      } else {
        await debtsAPI.payDealerDebt(selectedDebt.id, amount);
        showSuccessToast(`Dealer ${selectedDebt.name} paid $${amount.toLocaleString()}`);
      }

      // Reload debts
      await loadDebts();

      // Close modal
      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentAmount('');
    } catch (error) {
      console.error('Error processing payment:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const handleSubmitAdjust = async () => {
    if (!selectedDebt || !adjustAmount || parseFloat(adjustAmount) <= 0) {
      showErrorToast('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(adjustAmount);

    try {
      if (selectedDebt.type === 'customer') {
        await debtsAPI.addCustomerDebt(selectedDebt.id, amount);
        showSuccessToast(`Added $${amount.toLocaleString()} debt to ${selectedDebt.name}`);
      } else {
        await debtsAPI.addDealerDebt(selectedDebt.id, amount);
        showSuccessToast(`Added $${amount.toLocaleString()} debt to ${selectedDebt.name}`);
      }

      await loadDebts();
      setShowAdjustModal(false);
      setSelectedDebt(null);
      setAdjustAmount('');
    } catch (error) {
      console.error('Error adding debt:', error);
      showErrorToast(handleAPIError(error));
    }
  };

  // Combine and filter debts
  const allDebts = [...customerDebts, ...dealerDebts];
  const filteredDebts = allDebts.filter(debt => {
    if (selectedType === 'all') return true;
    return debt.type === selectedType;
  });

  // Calculate totals
  const totalCustomerDebt = customerDebts.reduce((sum, d) => sum + d.totalDebt, 0);
  const totalDealerDebt = dealerDebts.reduce((sum, d) => sum + d.totalDebt, 0);
  const totalDebt = totalCustomerDebt + totalDealerDebt;

  // Pie chart data
  const pieData = [
    { name: 'Customer Debts', value: totalCustomerDebt, color: '#FF6B6B' },
    { name: 'Dealer Debts', value: totalDealerDebt, color: '#4ECDC4' }
  ];

  if (loading) {
    return (
      <div className="main">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}></i>
          <div style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>Loading debts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      {/* Summary Cards */}
      <div className="cards-grid">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Total Outstanding Debt</h3>
            <div className="card__icon card__icon--error">
              <i className="bx bx-error-circle"></i>
            </div>
          </div>
          <div className="card__value">${totalDebt.toLocaleString()}</div>
          <div className="card__change card__change--negative">
            <i className="bx bx-trending-down"></i>
            {filteredDebts.length} accounts
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Customer Debts</h3>
            <div className="card__icon card__icon--warning">
              <i className="bx bx-user"></i>
            </div>
          </div>
          <div className="card__value">${totalCustomerDebt.toLocaleString()}</div>
          <div className="card__change card__change--negative">
            <i className="bx bx-group"></i>
            {customerDebts.length} customers
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Dealer Debts</h3>
            <div className="card__icon card__icon--primary">
              <i className="bx bx-store"></i>
            </div>
          </div>
          <div className="card__value">${totalDealerDebt.toLocaleString()}</div>
          <div className="card__change card__change--negative">
            <i className="bx bx-building"></i>
            {dealerDebts.length} dealers
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        {/* Pie Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Debt Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Top Debtors</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredDebts.slice(0, 5).map(d => ({ name: d.name, debt: d.totalDebt }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="debt" fill="#FF6B6B" name="Outstanding Debt" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Debt List */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Outstanding Debts</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'customer', 'dealer'].map(type => (
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
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Contact</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Outstanding Debt</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.map((debt) => (
                <tr key={`${debt.type}-${debt.id}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: debt.type === 'customer' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(78, 205, 196, 0.1)',
                      color: debt.type === 'customer' ? '#FF6B6B' : '#4ECDC4',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {debt.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    {debt.name}
                    {debt.isVip && (
                      <span style={{ marginLeft: '8px', padding: '2px 8px', background: 'var(--color-warning)', color: 'white', fontSize: '10px', borderRadius: '4px' }}>
                        VIP
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    {debt.phone || 'N/A'}
                    {debt.email && <div style={{ fontSize: '12px' }}>{debt.email}</div>}
                    {debt.address && <div style={{ fontSize: '12px' }}>{debt.address}</div>}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', fontWeight: '700', color: 'var(--color-error)' }}>
                    ${debt.totalDebt.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '12px' }}
                        onClick={() => handlePayDebt(debt)}
                      >
                        <i className="bx bx-dollar-circle"></i>
                        Pay Debt
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '12px' }}
                        onClick={() => handleAddDebt(debt)}
                      >
                        <i className="bx bx-plus"></i>
                        Add Debt
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDebts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-check-circle" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5', color: 'var(--color-success)' }}></i>
            <div>No outstanding debts found</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>All accounts are paid in full!</div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
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
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Record Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedDebt(null);
                  setPaymentAmount('');
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                {selectedDebt.type === 'customer' ? 'Customer' : 'Dealer'}
              </div>
              <div style={{ fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>
                {selectedDebt.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Outstanding Debt: <span style={{ color: 'var(--color-error)', fontWeight: '600' }}>
                  ${selectedDebt.totalDebt.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                Payment Amount ($) *
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px'
                }}
                min="0"
                max={selectedDebt.totalDebt}
                step="0.01"
                required
              />
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Maximum: ${selectedDebt.totalDebt.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedDebt(null);
                  setPaymentAmount('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                <i className="bx bx-check"></i>
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {showAdjustModal && selectedDebt && (
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
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Add Debt</h3>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedDebt(null);
                  setAdjustAmount('');
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                {selectedDebt.type === 'customer' ? 'Customer' : 'Dealer'}
              </div>
              <div style={{ fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>
                {selectedDebt.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Current Debt: <span style={{ color: 'var(--color-error)', fontWeight: '600' }}>
                  ${selectedDebt.totalDebt.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                Amount to Add ($) *
              </label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Enter additional debt amount"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '14px'
                }}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedDebt(null);
                  setAdjustAmount('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitAdjust}
                disabled={!adjustAmount || parseFloat(adjustAmount) <= 0}
              >
                <i className="bx bx-plus"></i>
                Add Debt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManagement;
