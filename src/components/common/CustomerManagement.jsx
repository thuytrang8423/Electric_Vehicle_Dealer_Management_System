import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const CustomerManagement = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customers, setCustomers] = useState([
    { id: 1, name: 'John Doe', email: 'john@email.com', phone: '+1 234 567 8900', status: 'active', orders: 3, totalSpent: '$135,000', lastContact: '2024-01-15', address: '123 Main St, New York, NY' },
    { id: 2, name: 'Jane Smith', email: 'jane@email.com', phone: '+1 234 567 8901', status: 'active', orders: 2, totalSpent: '$74,000', lastContact: '2024-01-14', address: '456 Oak Ave, Los Angeles, CA' },
    { id: 3, name: 'Mike Chen', email: 'mike@email.com', phone: '+1 234 567 8902', status: 'potential', orders: 0, totalSpent: '$0', lastContact: '2024-01-10', address: '789 Pine St, Chicago, IL' }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'potential'
  });

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--color-success)';
      case 'potential': return 'var(--color-warning)';
      case 'inactive': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      status: 'potential'
    });
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      status: customer.status
    });
    setShowModal(true);
  };

  const handleDeleteCustomer = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== customerId));
      showSuccessToast('Customer deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorToast('Please enter a valid email address');
      return;
    }

    const customerData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      status: formData.status
    };

    if (editingCustomer) {
      // Update existing customer
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, ...customerData }
          : c
      ));
      showSuccessToast('Customer updated successfully');
    } else {
      // Add new customer
      const newCustomer = {
        id: Math.max(...customers.map(c => c.id)) + 1,
        ...customerData,
        orders: 0,
        totalSpent: '$0',
        lastContact: new Date().toISOString().split('T')[0]
      };
      setCustomers([...customers, newCustomer]);
      showSuccessToast('Customer added successfully');
    }

    setShowModal(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      status: 'potential'
    });
  };

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Customer Management</h2>
          <button className="btn btn-primary" onClick={handleAddCustomer}>
            <i className="bx bx-plus"></i>
            Add Customer
          </button>
        </div>

        {/* Customer Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Customers', value: customers.length, icon: 'bx-user', color: 'var(--color-primary)' },
            { label: 'Active', value: customers.filter(c => c.status === 'active').length, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Potential', value: customers.filter(c => c.status === 'potential').length, icon: 'bx-user-plus', color: 'var(--color-warning)' },
            { label: 'Total Orders', value: customers.reduce((sum, c) => sum + c.orders, 0), icon: 'bx-shopping-bag', color: 'var(--color-info)' }
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

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search customers..."
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
            {['all', 'active', 'potential', 'inactive'].map(status => (
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

        {/* Customers Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Orders</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Total Spent</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{customer.name}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{customer.email}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{customer.phone}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(customer.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {customer.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{customer.orders}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>{customer.totalSpent}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px' }}
                        onClick={() => handleEditCustomer(customer)}
                        title="Edit Customer"
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px', color: 'var(--color-error)' }}
                        onClick={() => handleDeleteCustomer(customer.id)}
                        title="Delete Customer"
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

        {filteredCustomers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-user" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No customers found</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAddCustomer}>
              <i className="bx bx-plus"></i>
              Add First Customer
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
              <h3>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
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
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="john@email.com"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                    placeholder="123 Main St, City, State"
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
                    <option value="potential">Potential</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;