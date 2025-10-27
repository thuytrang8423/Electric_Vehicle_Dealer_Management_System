import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const SalesContracts = ({ user }) => {
  const [contracts, setContracts] = useState([
    {
      id: 'CON-001',
      customer: 'John Smith',
      vehicle: 'Tesla Model 3',
      amount: 45000,
      downPayment: 9000,
      installmentPlan: '36 months',
      monthlyPayment: 1000,
      status: 'active',
      signedDate: '2024-01-15',
      expiryDate: '2027-01-15',
      contractType: 'installment'
    },
    {
      id: 'CON-002',
      customer: 'Jane Doe',
      vehicle: 'BMW i3',
      amount: 42000,
      downPayment: 42000,
      installmentPlan: 'N/A',
      monthlyPayment: 0,
      status: 'completed',
      signedDate: '2024-01-10',
      expiryDate: '2024-01-10',
      contractType: 'cash'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customer: '',
    vehicle: '',
    amount: '',
    downPayment: '',
    installmentPlan: '',
    contractType: 'cash',
    signedDate: '',
    expiryDate: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--color-success)';
      case 'completed': return 'var(--color-info)';
      case 'expired': return 'var(--color-error)';
      case 'cancelled': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || contract.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddContract = () => {
    setEditingContract(null);
    setFormData({
      customer: '',
      vehicle: '',
      amount: '',
      downPayment: '',
      installmentPlan: '',
      contractType: 'cash',
      signedDate: new Date().toISOString().split('T')[0],
      expiryDate: ''
    });
    setShowModal(true);
  };

  const handleEditContract = (contract) => {
    setEditingContract(contract);
    setFormData({
      customer: contract.customer,
      vehicle: contract.vehicle,
      amount: contract.amount.toString(),
      downPayment: contract.downPayment.toString(),
      installmentPlan: contract.installmentPlan,
      contractType: contract.contractType,
      signedDate: contract.signedDate,
      expiryDate: contract.expiryDate
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.customer || !formData.vehicle || !formData.amount) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    const contractData = {
      customer: formData.customer,
      vehicle: formData.vehicle,
      amount: parseInt(formData.amount) || 0,
      downPayment: parseInt(formData.downPayment) || 0,
      installmentPlan: formData.installmentPlan,
      contractType: formData.contractType,
      signedDate: formData.signedDate,
      expiryDate: formData.expiryDate,
      monthlyPayment: formData.contractType === 'installment' ? 
        Math.round((parseInt(formData.amount) - parseInt(formData.downPayment)) / parseInt(formData.installmentPlan)) : 0
    };

    if (editingContract) {
      setContracts(contracts.map(c => 
        c.id === editingContract.id 
          ? { ...c, ...contractData, status: 'active' }
          : c
      ));
      showSuccessToast('Contract updated successfully');
    } else {
      const newContract = {
        id: `CON-${String(Math.max(...contracts.map(c => parseInt(c.id.split('-')[1]))) + 1).padStart(3, '0')}`,
        ...contractData,
        status: 'active'
      };
      setContracts([...contracts, newContract]);
      showSuccessToast('Contract created successfully');
    }

    setShowModal(false);
  };

  const totalActiveContracts = contracts.filter(c => c.status === 'active').length;
  const totalContractValue = contracts.reduce((sum, c) => sum + c.amount, 0);
  const totalOutstanding = contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.amount - c.downPayment), 0);

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Sales Contracts</h2>
          <button className="btn btn-primary" onClick={handleAddContract}>
            <i className="bx bx-plus"></i>
            Create Contract
          </button>
        </div>

        {/* Contract Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Contracts', value: contracts.length, icon: 'bx-file', color: 'var(--color-primary)' },
            { label: 'Active Contracts', value: totalActiveContracts, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Total Value', value: `$${totalContractValue.toLocaleString()}`, icon: 'bx-dollar-circle', color: 'var(--color-info)' },
            { label: 'Outstanding', value: `$${totalOutstanding.toLocaleString()}`, icon: 'bx-credit-card', color: 'var(--color-warning)' }
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

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search contracts..."
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
            {['all', 'active', 'completed', 'expired', 'cancelled'].map(status => (
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
        </div>

        {/* Contracts Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Contract ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Vehicle</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Signed Date</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => (
                <tr key={contract.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', fontWeight: '600' }}>{contract.id}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{contract.customer}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{contract.vehicle}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>${contract.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'center', textTransform: 'capitalize' }}>
                    {contract.contractType}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(contract.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {contract.status}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{contract.signedDate}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px' }}
                        onClick={() => handleEditContract(contract)}
                      >
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

        {filteredContracts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-file" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No contracts found</div>
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
              <h3>{editingContract ? 'Edit Contract' : 'Create New Contract'}</h3>
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
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Vehicle *
                    </label>
                    <input
                      type="text"
                      value={formData.vehicle}
                      onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Total Amount *
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
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Down Payment
                    </label>
                    <input
                      type="number"
                      value={formData.downPayment}
                      onChange={(e) => setFormData({...formData, downPayment: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Contract Type
                    </label>
                    <select
                      value={formData.contractType}
                      onChange={(e) => setFormData({...formData, contractType: e.target.value})}
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
                      <option value="cash">Cash</option>
                      <option value="installment">Installment</option>
                    </select>
                  </div>
                  {formData.contractType === 'installment' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                        Installment Plan (months)
                      </label>
                      <input
                        type="number"
                        value={formData.installmentPlan}
                        onChange={(e) => setFormData({...formData, installmentPlan: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          background: 'var(--color-bg)',
                          color: 'var(--color-text)',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Signed Date
                    </label>
                    <input
                      type="date"
                      value={formData.signedDate}
                      onChange={(e) => setFormData({...formData, signedDate: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                    />
                  </div>
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
                  {editingContract ? 'Update Contract' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesContracts;

