import React, { useState, useEffect } from 'react';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
import { customersAPI } from '../../../utils/api/customersAPI';
import { usersAPI } from '../../../utils/api/usersAPI';
import { dealersAPI } from '../../../utils/api/dealersAPI';
import CreateCustomer from './CreateCustomer';
import EditCustomer from './EditCustomer';
import DeleteCustomerModal from './DeleteCustomerModal';
import Pagination from '../../common/Pagination';
import 'boxicons/css/boxicons.min.css';

const CustomerManagement = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [dealerInfo, setDealerInfo] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Shared loader to refresh customers list
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Use dealerId from userProfile if available, otherwise fallback to user.dealerId
      const dealerId = userProfile?.dealerId || user?.dealerId;
      
      if (dealerId) {
        console.log('Fetching customers for dealerId:', dealerId);
        const data = await customersAPI.getByDealer(dealerId);
        console.log('Fetched customers data:', data);
        setCustomers(Array.isArray(data) ? data : []);
      } else {
        console.warn('No dealerId found in user profile or user object');
        console.log('User profile:', userProfile);
        console.log('User object:', user);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      showErrorToast('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile to get dealerId
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (user?.id) {
          const profile = await usersAPI.getById(user.id);
          console.log('User profile:', profile);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Fetch dealer info based on dealerId
  useEffect(() => {
    const fetchDealerInfo = async () => {
      try {
        const dealerId = userProfile?.dealerId || user?.dealerId;
        if (dealerId) {
          console.log('Fetching dealer info for dealerId:', dealerId);
          const dealer = await dealersAPI.getById(dealerId);
          console.log('Dealer info:', dealer);
          setDealerInfo(dealer);
        }
      } catch (error) {
        console.error('Error fetching dealer info:', error);
      }
    };

    if (userProfile || user?.dealerId) {
      fetchDealerInfo();
    }
  }, [userProfile, user?.dealerId]);

  // Fetch customers based on dealer ID
  useEffect(() => {
    if (userProfile || user?.dealerId) {
      fetchCustomers();
    }
  }, [userProfile, user?.dealerId]);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.phone?.includes(searchTerm) ||
                         c.citizenId?.includes(searchTerm);
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAddCustomer = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    fetchCustomers(); // Refresh the list
    setShowCreateModal(false);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchCustomers(); // Refresh the list
    setShowEditModal(false);
  };

  const handleDeleteCustomer = (customerToDelete) => {
    setDeletingCustomer(customerToDelete);
    setShowDeleteModal(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!deletingCustomer) return;

    try {
      await customersAPI.delete(deletingCustomer.id);
      setCustomers(customers.filter(c => c.id !== deletingCustomer.id));
      showSuccessToast('Customer deleted successfully');
      setShowDeleteModal(false);
      setDeletingCustomer(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      showErrorToast('Failed to delete customer');
    }
  };

  const cancelDeleteCustomer = () => {
    setShowDeleteModal(false);
    setDeletingCustomer(null);
  };


  if (loading) {
    return (
      <div className="main">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}></i>
            <div style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>Loading customers...</div>
          </div>
        </div>
      </div>
    );
  }

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Customers', value: customers.length, icon: 'bx-user', color: 'var(--color-primary)' },
            { label: 'Dealer Name', value: dealerInfo?.name || 'N/A', icon: 'bx-store', color: 'var(--color-info)' }
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

        {/* Search */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
            <input
              type="text"
              placeholder="Search by name, email, phone, or ID..."
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

        {/* Customers Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>No</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Full Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Citizen ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Dealer Name</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer, index) => (
                <tr key={customer.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{startIndex + index + 1}</td>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{customer.fullName || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{customer.email || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{customer.phone || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{customer.citizenId || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{dealerInfo?.name || 'N/A'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ 
                          padding: '6px', 
                          fontSize: '14px', 
                          color: 'yellow', 
                          borderColor: 'yellow',
                          background: 'transparent',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.querySelector('i').style.transform = 'scale(1.2)';
                          e.target.querySelector('i').style.transition = 'transform 0.2s ease';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.querySelector('i').style.transform = 'scale(1)';
                        }}
                        onClick={() => handleEditCustomer(customer)}
                        title="Edit Customer"
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ 
                          padding: '6px', 
                          fontSize: '14px', 
                          color: 'var(--color-error)', 
                          background: 'transparent',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.querySelector('i').style.transform = 'scale(1.2)';
                          e.target.querySelector('i').style.transition = 'transform 0.2s ease';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.querySelector('i').style.transform = 'scale(1)';
                        }}
                        onClick={() => handleDeleteCustomer(customer)}
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

            {filteredCustomers.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-user" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <div>No customers found</div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAddCustomer}>
                  <i className="bx bx-plus"></i>
                  Add First Customer
                </button>
              </div>
            )}

            {/* Pagination Info - Always show info even if only one page */}
            {filteredCustomers.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                padding: '16px 0',
                borderTop: '1px solid var(--color-border)'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--color-text-muted)'
                }}>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCustomers.length)} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} entries
                </div>
                
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredCustomers.length}
                  />
                )}
              </div>
            )}
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <CreateCustomer 
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          userProfile={userProfile}
          user={user}
        />
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <EditCustomer 
          customer={editingCustomer}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          userProfile={userProfile}
          user={user}
        />
      )}

      {/* Delete Customer Modal */}
      {showDeleteModal && deletingCustomer && (
        <DeleteCustomerModal 
          customer={deletingCustomer}
          onConfirm={confirmDeleteCustomer}
          onCancel={cancelDeleteCustomer}
        />
      )}
    </div>
  );
};

export default CustomerManagement;