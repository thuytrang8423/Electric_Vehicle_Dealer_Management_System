import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../../utils/api/usersAPI';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
import { handleAPIError } from '../../../utils/apiConfig';
import CreateAccountUser from './CreateAccountUser';
import EditAccountUser from './EditAccountUser';
import DeleteUserModal from './DeleteUserModal';
import Pagination from '../../common/Pagination';
import 'boxicons/css/boxicons.min.css';

const UserManagement = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (error) {
      showErrorToast(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to normalize role strings (handle '-', '_', and space separators)
  const normalizeRole = (role) => {
    if (!role) return '';
    
    // Handle backend enum values (uppercase with underscores)
    if (role === 'ADMIN') return 'admin';
    if (role === 'DEALER_MANAGER') return 'dealer-manager';
    if (role === 'DEALER_STAFF') return 'dealer-staff';
    if (role === 'EVM_MANAGER') return 'evm-manager';
    
    // Convert to lowercase and replace spaces, underscores, and hyphens with hyphen
    let normalized = role.toLowerCase().replace(/[\s\-_]/g, '-').replace(/-+/g, '-');
    
    // Handle role name normalization - all variations map to "evm-manager"
    if (normalized === 'evmmanager' || normalized === 'evmstaff') {
      normalized = 'evm-manager';
    }
    
    return normalized;
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

  // Filter users based on search and filters
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || normalizeRole(u.role) === normalizeRole(filterRole);
    const matchesStatus = filterStatus === 'all' || normalizeStatus(u.status) === normalizeStatus(filterStatus);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'active': return 'var(--color-success)';
      case 'inactive': return 'var(--color-error)';
      case 'pending': return 'var(--color-warning)';
      case 'suspended': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getRoleColor = (role) => {
    const normalizedRole = normalizeRole(role);
    switch (normalizedRole) {
      case 'admin': return '#DC2626'; // Red
      case 'dealer-manager': return '#3B82F6'; // Blue
      case 'dealer-staff': return '#22C55E'; // Green
      case 'evm-manager': return '#F59E0B'; // Orange/Amber
      default: return 'var(--color-text-muted)';
    }
  };

  // Helper function to format role for display
  const formatRoleForDisplay = (role) => {
    if (!role) return '';
    const normalized = normalizeRole(role);
    // Map specific roles to their display names
    const roleDisplayMap = {
      'admin': 'Admin',
      'dealer-manager': 'Dealer Manager',
      'dealer-staff': 'Dealer Staff',
      'evm-manager': 'EVM Manager'
    };
    
    // Use the mapped display name if available, otherwise format generically
    if (roleDisplayMap[normalized]) {
      return roleDisplayMap[normalized];
    }
    
    // Fallback: capitalize each word
    return normalized.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleAddUser = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    fetchUsers(); // Refresh the list
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchUsers(); // Refresh the list
  };

  const handleDeleteUser = (userToDelete) => {
    // Prevent user from deleting themselves
    if (isCurrentUser(userToDelete)) {
      showErrorToast('You cannot delete your own account');
      return;
    }

    setDeletingUser(userToDelete);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const userId = deletingUser.id || deletingUser.userId;
      await usersAPI.delete(userId);
      setUsers(users.filter(u => (u.id !== userId && u.userId !== userId)));
      showSuccessToast('User deleted successfully');
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (error) {
      showErrorToast(handleAPIError(error));
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteModal(false);
    setDeletingUser(null);
  };

  // Helper function to check if user is trying to delete themselves
  const isCurrentUser = (userItem) => {
    if (!user) return false;
    
    // Check multiple possible ID fields
    const currentUserId = user.id || user.userId;
    const itemUserId = userItem.id || userItem.userId;
    
    return currentUserId === itemUserId;
  };


  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>User Management</h2>
          <button className="btn btn-primary" onClick={handleAddUser}>
            <i className="bx bx-plus"></i>
            Create New User
          </button>
        </div>

        {/* User Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Users', value: users.length, icon: 'bx-user', color: 'var(--color-primary)' },
            { label: 'Admin', value: users.filter(u => normalizeRole(u.role) === 'admin').length, icon: 'bx-shield-quarter', color: 'var(--color-primary)' },
            { label: 'Active', value: users.filter(u => normalizeStatus(u.status) === 'active').length, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Inactive', value: users.filter(u => normalizeStatus(u.status) === 'inactive').length, icon: 'bx-x-circle', color: 'var(--color-error)' }
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
                placeholder="Search users..."
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
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="dealer-manager">Dealer Manager</option>
            <option value="dealer-staff">Dealer Staff</option>
            <option value="evm-manager">EVM Manager</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
            <div>Loading users...</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                tableLayout: 'fixed'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--color-text-muted)',
                      width: '20%'
                    }}>Name</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--color-text-muted)',
                      width: '30%'
                    }}>Email</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--color-text-muted)',
                      width: '15%'
                    }}>Role</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--color-text-muted)',
                      width: '15%'
                    }}>Status</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--color-text-muted)',
                      width: '20%'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((userItem) => (
                    <tr key={userItem.id || userItem.userId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{userItem.fullName}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{userItem.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 'var(--radius)',
                          background: 'var(--color-bg)',
                          color: getRoleColor(userItem.role),
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {formatRoleForDisplay(userItem.role)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 'var(--radius)',
                          background: 'var(--color-bg)',
                          color: getStatusColor(userItem.status),
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {normalizeStatus(userItem.status)}
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
                            onClick={() => handleEditUser(userItem)}
                            title="Edit User"
                          >
                            <i className="bx bx-edit"></i>
                          </button>
                          {/* Only show delete button if user is not deleting themselves */}
                          {!isCurrentUser(userItem) && (
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
                              onClick={() => handleDeleteUser(userItem)}
                              title="Delete User"
                            >
                              <i className="bx bx-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-user-x" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <div>No users found</div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAddUser}>
                  <i className="bx bx-plus"></i>
                  Add First User
                </button>
              </div>
            )}

            {/* Pagination Info - Always show info even if only one page */}
            {filteredUsers.length > 0 && (
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
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
                </div>
                
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredUsers.length}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateAccountUser 
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditAccountUser 
          user={editingUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete User Modal */}
      {showDeleteModal && deletingUser && (
        <DeleteUserModal 
          user={deletingUser}
          onConfirm={confirmDeleteUser}
          onCancel={cancelDeleteUser}
        />
      )}
    </div>
  );
};

export default UserManagement;
