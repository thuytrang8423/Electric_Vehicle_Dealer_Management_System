import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { debtsAPI } from '../../utils/api/debtsAPI';
import { showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const DebtManagement = ({ user }) => {
  const [customerDebts, setCustomerDebts] = useState([]);
  const [dealerDebts, setDealerDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all'); // all, customer, dealer

  // Determine user role
  const userRole = user?.role?.toUpperCase().replace(/-/g, '_');
  const isAdminOrEVM = userRole === 'ADMIN' || userRole === 'EVM_MANAGER';
  const isDealerManager = userRole === 'DEALER_MANAGER';

  // Load debts from customers and dealers
  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);

      if (isAdminOrEVM) {
        // For ADMIN and EVM_MANAGER: only load dealer debts (not customer debts)
        const dealerDebtsData = await debtsAPI.getDealerDebts();

        // Normalize dealer debts data according to API format: { dealerId, name, phone, region, outstandingDebt, status }
        const dealersWithDebt = Array.isArray(dealerDebtsData)
          ? dealerDebtsData
              .filter(d => d.outstandingDebt && d.outstandingDebt > 0)
              .map(d => ({
                id: d.dealerId,
                dealerId: d.dealerId,
                name: d.name || 'N/A',
                type: 'dealer',
                totalDebt: d.outstandingDebt || 0,
                phone: d.phone || 'N/A',
                region: d.region || 'N/A',
                status: d.status || 'N/A'
              }))
          : [];

        setCustomerDebts([]); // ADMIN and EVM_MANAGER don't see customer debts
        setDealerDebts(dealersWithDebt);
      } else if (isDealerManager) {
        // For DEALER_MANAGER: only load customer debts
        const customerDebtsData = await debtsAPI.getCustomerDebts();
        
        const customersWithDebt = Array.isArray(customerDebtsData)
          ? customerDebtsData
              .filter(c => c.totalDebt && c.totalDebt > 0)
              .map(c => ({
                id: c.customerId || c.id,
                name: c.customerName || c.fullName || c.name || 'N/A',
                type: 'customer',
                totalDebt: c.totalDebt || c.outstandingDebt || 0,
                phone: c.phone || c.phoneNumber,
                email: c.email,
                dealerName: c.dealerName,
                isVip: c.isVip
              }))
          : [];

        setCustomerDebts(customersWithDebt);
        setDealerDebts([]);
      } else {
        // For other roles: use existing logic
        const [customerDebtsData, dealerDebtsData] = await Promise.all([
          debtsAPI.getCustomerDebts(),
          debtsAPI.getDealerDebts()
        ]);

        // Normalize customer debts data
        const customersWithDebt = Array.isArray(customerDebtsData)
          ? customerDebtsData
              .filter(c => c.totalDebt && c.totalDebt > 0)
              .map(c => ({
                id: c.customerId || c.id,
                name: c.customerName || c.fullName || c.name || 'N/A',
                type: 'customer',
                totalDebt: c.totalDebt || c.outstandingDebt || 0,
                phone: c.phone || c.phoneNumber,
                email: c.email,
                dealerName: c.dealerName,
                isVip: c.isVip
              }))
          : [];

        // Normalize dealer debts data
        const dealersWithDebt = Array.isArray(dealerDebtsData)
          ? dealerDebtsData
              .filter(d => (d.totalDebt && d.totalDebt > 0) || (d.outstandingDebt && d.outstandingDebt > 0))
              .map(d => ({
                id: d.dealerId || d.id,
                name: d.dealerName || d.name || 'N/A',
                type: 'dealer',
                totalDebt: d.totalDebt || d.outstandingDebt || 0,
                phone: d.phone || d.phoneNumber,
                address: d.address,
                region: d.region,
                status: d.status
              }))
          : [];

        setCustomerDebts(customersWithDebt);
        setDealerDebts(dealersWithDebt);
      }
    } catch (error) {
      console.error('Error loading debts:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  // Combine and filter debts
  // For ADMIN/EVM_MANAGER: only show dealer debts
  // For DEALER_MANAGER: only show customer debts
  const allDebts = isAdminOrEVM 
    ? dealerDebts 
    : isDealerManager 
      ? customerDebts 
      : [...customerDebts, ...dealerDebts];
  const filteredDebts = allDebts.filter(debt => {
    if (isAdminOrEVM || isDealerManager) return true; // Show all for these roles (already filtered)
    if (selectedType === 'all') return true;
    return debt.type === selectedType;
  });

  // Calculate totals
  const totalCustomerDebt = customerDebts.reduce((sum, d) => sum + d.totalDebt, 0);
  const totalDealerDebt = dealerDebts.reduce((sum, d) => sum + d.totalDebt, 0);
  // For ADMIN/EVM_MANAGER: only count dealer debts
  // For DEALER_MANAGER: only count customer debts
  // For others: count both
  const totalDebt = isAdminOrEVM 
    ? totalDealerDebt 
    : isDealerManager 
      ? totalCustomerDebt 
      : totalCustomerDebt + totalDealerDebt;

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

        {!isAdminOrEVM && (
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
        )}

        {!isDealerManager && (
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
        )}
      </div>

      {/* Charts */}
      <div style={{ marginTop: '24px' }}>
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
            {isAdminOrEVM ? (
              <button
                className="btn btn-primary"
                style={{ textTransform: 'capitalize' }}
                disabled
              >
                Dealer
              </button>
            ) : isDealerManager ? (
              <button
                className="btn btn-primary"
                style={{ textTransform: 'capitalize' }}
                disabled
              >
                Customer
              </button>
            ) : (
              ['all', 'customer', 'dealer'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`btn ${selectedType === type ? 'btn-primary' : 'btn-outline'}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {type}
                </button>
              ))
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Contact</th>
                {isAdminOrEVM && (
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Region</th>
                )}
                {isAdminOrEVM && (
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                )}
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Outstanding Debt</th>
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
                  {isAdminOrEVM && (
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {debt.type === 'dealer' ? (debt.region || 'N/A') : '-'}
                    </td>
                  )}
                  {isAdminOrEVM && (
                    <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {debt.type === 'dealer' ? (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius)',
                          background: debt.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: debt.status === 'ACTIVE' ? '#22c55e' : '#ef4444',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {debt.status || 'N/A'}
                        </span>
                      ) : '-'}
                    </td>
                  )}
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', fontWeight: '700', color: 'var(--color-error)' }}>
                    ${debt.totalDebt.toLocaleString()}
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
    </div>
  );
};

export default DebtManagement;
