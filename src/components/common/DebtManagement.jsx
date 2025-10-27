import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const DebtManagement = ({ user }) => {
  const [debts, setDebts] = useState([
    {
      id: 'DEBT-001',
      debtor: 'Metro Auto Group',
      debtorType: 'dealer',
      amount: 125000,
      outstandingAmount: 125000,
      dueDate: '2024-02-15',
      status: 'overdue',
      priority: 'high',
      createdDate: '2024-01-15',
      lastPaymentDate: null,
      lastPaymentAmount: 0,
      totalPaid: 0,
      interestRate: 5.5,
      notes: 'Monthly vehicle allocation payment overdue'
    },
    {
      id: 'DEBT-002',
      debtor: 'John Smith',
      debtorType: 'customer',
      amount: 45000,
      outstandingAmount: 15000,
      dueDate: '2024-03-01',
      status: 'current',
      priority: 'normal',
      createdDate: '2024-01-20',
      lastPaymentDate: '2024-01-25',
      lastPaymentAmount: 10000,
      totalPaid: 30000,
      interestRate: 3.5,
      notes: 'Installment payment for Tesla Model 3'
    },
    {
      id: 'DEBT-003',
      debtor: 'City Motors',
      debtorType: 'dealer',
      amount: 85000,
      outstandingAmount: 0,
      dueDate: '2024-01-30',
      status: 'paid',
      priority: 'normal',
      createdDate: '2024-01-10',
      lastPaymentDate: '2024-01-30',
      lastPaymentAmount: 85000,
      totalPaid: 85000,
      interestRate: 4.0,
      notes: 'Monthly vehicle allocation payment - paid on time'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    debtor: '',
    debtorType: 'customer',
    amount: '',
    dueDate: '',
    interestRate: '',
    notes: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return 'var(--color-success)';
      case 'overdue': return 'var(--color-error)';
      case 'paid': return 'var(--color-info)';
      case 'cancelled': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'var(--color-success)';
      case 'normal': return 'var(--color-info)';
      case 'high': return 'var(--color-warning)';
      case 'urgent': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getDebtorTypeColor = (type) => {
    switch (type) {
      case 'customer': return 'var(--color-primary)';
      case 'dealer': return 'var(--color-secondary)';
      case 'supplier': return 'var(--color-accent)';
      default: return 'var(--color-text-muted)';
    }
  };

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.debtor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || debt.status === filterStatus;
    const matchesType = filterType === 'all' || debt.debtorType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddDebt = () => {
    setEditingDebt(null);
    setFormData({
      debtor: '',
      debtorType: 'customer',
      amount: '',
      dueDate: '',
      interestRate: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEditDebt = (debt) => {
    setEditingDebt(debt);
    setFormData({
      debtor: debt.debtor,
      debtorType: debt.debtorType,
      amount: debt.amount.toString(),
      dueDate: debt.dueDate,
      interestRate: debt.interestRate.toString(),
      notes: debt.notes
    });
    setShowModal(true);
  };

  const handlePayment = (debtId, paymentAmount) => {
    const updatedDebts = debts.map(d => {
      if (d.id === debtId) {
        const newOutstanding = Math.max(0, d.outstandingAmount - paymentAmount);
        const newTotalPaid = d.totalPaid + paymentAmount;
        const newStatus = newOutstanding === 0 ? 'paid' : 'current';
        
        return {
          ...d,
          outstandingAmount: newOutstanding,
          totalPaid: newTotalPaid,
          status: newStatus,
          lastPaymentDate: new Date().toISOString().split('T')[0],
          lastPaymentAmount: paymentAmount
        };
      }
      return d;
    });
    
    setDebts(updatedDebts);
    showSuccessToast(`Payment of $${paymentAmount.toLocaleString()} recorded successfully`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.debtor || !formData.amount || !formData.dueDate) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    const debtData = {
      debtor: formData.debtor,
      debtorType: formData.debtorType,
      amount: parseInt(formData.amount) || 0,
      dueDate: formData.dueDate,
      interestRate: parseFloat(formData.interestRate) || 0,
      notes: formData.notes,
      createdDate: new Date().toISOString().split('T')[0]
    };

    if (editingDebt) {
      setDebts(debts.map(d => 
        d.id === editingDebt.id 
          ? { ...d, ...debtData }
          : d
      ));
      showSuccessToast('Debt updated successfully');
    } else {
      const newDebt = {
        id: `DEBT-${String(Math.max(...debts.map(d => parseInt(d.id.split('-')[1]))) + 1).padStart(3, '0')}`,
        ...debtData,
        outstandingAmount: debtData.amount,
        status: 'current',
        priority: 'normal',
        lastPaymentDate: null,
        lastPaymentAmount: 0,
        totalPaid: 0
      };
      setDebts([...debts, newDebt]);
      showSuccessToast('Debt created successfully');
    }

    setShowModal(false);
  };

  const totalDebts = debts.length;
  const totalOutstanding = debts.reduce((sum, d) => sum + d.outstandingAmount, 0);
  const overdueDebts = debts.filter(d => d.status === 'overdue').length;
  const totalPaid = debts.reduce((sum, d) => sum + d.totalPaid, 0);

  // Chart data
  const debtByTypeData = [
    { name: 'Customers', value: debts.filter(d => d.debtorType === 'customer').reduce((sum, d) => sum + d.outstandingAmount, 0), color: '#8884d8' },
    { name: 'Dealers', value: debts.filter(d => d.debtorType === 'dealer').reduce((sum, d) => sum + d.outstandingAmount, 0), color: '#82ca9d' },
    { name: 'Suppliers', value: debts.filter(d => d.debtorType === 'supplier').reduce((sum, d) => sum + d.outstandingAmount, 0), color: '#ffc658' }
  ];

  const debtStatusData = [
    { name: 'Current', value: debts.filter(d => d.status === 'current').length, color: '#82ca9d' },
    { name: 'Overdue', value: debts.filter(d => d.status === 'overdue').length, color: '#ff7c7c' },
    { name: 'Paid', value: debts.filter(d => d.status === 'paid').length, color: '#8884d8' }
  ];

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Debt Management</h2>
          <button className="btn btn-primary" onClick={handleAddDebt}>
            <i className="bx bx-plus"></i>
            Add Debt
          </button>
        </div>

        {/* Debt Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Debts', value: totalDebts, icon: 'bx-file', color: 'var(--color-primary)' },
            { label: 'Outstanding', value: `$${totalOutstanding.toLocaleString()}`, icon: 'bx-dollar-circle', color: 'var(--color-warning)' },
            { label: 'Overdue', value: overdueDebts, icon: 'bx-time-five', color: 'var(--color-error)' },
            { label: 'Total Paid', value: `$${totalPaid.toLocaleString()}`, icon: 'bx-check-circle', color: 'var(--color-success)' }
          ].map((stat, index) => (
            <div key={index} style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px'
                }}>
                  <i className={`bx ${stat.icon}`}></i>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{stat.label}</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={{ padding: '20px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
              Outstanding Debt by Type
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={debtByTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {debtByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ padding: '20px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
              Debt Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={debtStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search debts..."
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
            {['all', 'current', 'overdue', 'paid', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {status}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'customer', 'dealer', 'supplier'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`btn ${filterType === type ? 'btn-secondary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Debts Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Debt ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Debtor</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Outstanding</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Due Date</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.map((debt) => (
                <tr key={debt.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', fontWeight: '600' }}>{debt.id}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{debt.debtor}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getDebtorTypeColor(debt.debtorType),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {debt.debtorType}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>${debt.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-primary)', fontWeight: '600', textAlign: 'right' }}>
                    ${debt.outstandingAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(debt.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {debt.status}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{debt.dueDate}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px' }}
                        onClick={() => handleEditDebt(debt)}
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                      {debt.outstandingAmount > 0 && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => {
                            const amount = prompt('Enter payment amount:', debt.outstandingAmount.toString());
                            if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                              handlePayment(debt.id, parseFloat(amount));
                            }
                          }}
                        >
                          <i className="bx bx-dollar"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDebts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-file" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No debts found</div>
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>{editingDebt ? 'Edit Debt' : 'Add New Debt'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Debtor Name *
                    </label>
                    <input
                      type="text"
                      value={formData.debtor}
                      onChange={(e) => setFormData({...formData, debtor: e.target.value})}
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
                      Debtor Type
                    </label>
                    <select
                      value={formData.debtorType}
                      onChange={(e) => setFormData({...formData, debtorType: e.target.value})}
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
                      <option value="customer">Customer</option>
                      <option value="dealer">Dealer</option>
                      <option value="supplier">Supplier</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Amount *
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
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
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
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
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
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Additional notes about this debt..."
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
                  {editingDebt ? 'Update Debt' : 'Add Debt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManagement;

