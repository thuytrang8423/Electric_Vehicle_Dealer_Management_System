import React, { useState, useEffect } from 'react';
import { dealersAPI } from '../../../utils/api/dealersAPI';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
import { handleAPIError } from '../../../utils/apiConfig';
import CreateDealer from './CreateDealer';
import EditDealer from './EditDealer';
import DeleteDealerModal from './DeleteDealerModal';
import Pagination from '../../common/Pagination';
import 'boxicons/css/boxicons.min.css';

const DealerManagement = ({ user }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [deletingDealer, setDeletingDealer] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Fetch dealers on component mount
  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const data = await dealersAPI.getAll();
      setDealers(data);
    } catch (error) {
      showErrorToast(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to normalize status strings
  const normalizeStatus = (status) => {
    if (!status) return '';
    
    // Handle backend enum values (uppercase)
    if (status === 'ACTIVE') return 'active';
    if (status === 'INACTIVE') return 'inactive';
    if (status === 'PENDING') return 'pending';
    if (status === 'SUSPENDED') return 'suspended';
    
    // Convert to lowercase for frontend display
    return status.toLowerCase();
  };

  const getStatusColor = (status) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'active': return 'var(--color-success)';
      case 'pending': return 'var(--color-warning)';
      case 'inactive': return 'var(--color-error)';
      case 'suspended': return 'var(--color-warning)';
      default: return 'var(--color-text-muted)';
    }
  };

  const handleAddDealer = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    fetchDealers(); // Refresh the list
  };

  const handleEditDealer = (dealer) => {
    setEditingDealer(dealer);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchDealers(); // Refresh the list
  };

  const handleDeleteDealer = (dealerToDelete) => {
    setDeletingDealer(dealerToDelete);
    setShowDeleteModal(true);
  };

  const confirmDeleteDealer = async () => {
    if (!deletingDealer) return;

    try {
      const dealerId = deletingDealer.dealerId || deletingDealer.id;
      await dealersAPI.delete(dealerId);
      setDealers(dealers.filter(d => (d.dealerId !== dealerId && d.id !== dealerId)));
      showSuccessToast('Dealer deleted successfully');
      setShowDeleteModal(false);
      setDeletingDealer(null);
    } catch (error) {
      showErrorToast(handleAPIError(error));
    }
  };

  const cancelDeleteDealer = () => {
    setShowDeleteModal(false);
    setDeletingDealer(null);
  };

  // Pagination logic
  const totalPages = Math.ceil(dealers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDealers = dealers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Dealer Management</h2>
          <button className="btn btn-primary" onClick={handleAddDealer}>
            <i className="bx bx-plus"></i>
            Add Dealer
          </button>
        </div>

        {/* Dealer Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Dealers', value: dealers.length, icon: 'bx-store', color: 'var(--color-primary)' },
            { label: 'Active', value: dealers.filter(d => normalizeStatus(d.status) === 'active').length, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Suspended', value: dealers.filter(d => normalizeStatus(d.status) === 'suspended').length, icon: 'bx-time', color: 'var(--color-warning)' },
            { label: 'Inactive', value: dealers.filter(d => normalizeStatus(d.status) === 'inactive').length, icon: 'bx-x-circle', color: 'var(--color-error)' }
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

        {/* Dealers Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Dealer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Region</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Representative</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDealers.map((dealer) => (
                <tr key={dealer.dealerId || dealer.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{dealer.name}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{dealer.region}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{dealer.representativeName || '-'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{dealer.phone}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(dealer.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {normalizeStatus(dealer.status)}
                    </span>
                  </td>
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
                        onClick={() => handleEditDealer(dealer)}
                        title="Edit Dealer"
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
                        onClick={() => handleDeleteDealer(dealer)}
                        title="Delete Dealer"
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
            <div>Loading dealers...</div>
          </div>
        ) : (
          <>
            {dealers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-store" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <div>No dealers found</div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAddDealer}>
                  <i className="bx bx-plus"></i>
                  Add First Dealer
                </button>
              </div>
            ) : (
              <>
                {/* Pagination - Always show info even if only one page */}
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
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, dealers.length)} to {Math.min(currentPage * itemsPerPage, dealers.length)} of {dealers.length} entries
                  </div>
                  
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      itemsPerPage={itemsPerPage}
                      totalItems={dealers.length}
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Create Dealer Modal */}
      {showCreateModal && (
        <CreateDealer 
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit Dealer Modal */}
      {showEditModal && editingDealer && (
        <EditDealer 
          dealer={editingDealer}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Dealer Modal */}
      {showDeleteModal && deletingDealer && (
        <DeleteDealerModal 
          dealer={deletingDealer}
          onConfirm={confirmDeleteDealer}
          onCancel={cancelDeleteDealer}
        />
      )}
    </div>
  );
};

export default DealerManagement;