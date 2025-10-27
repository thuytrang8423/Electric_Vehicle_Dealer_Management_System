import React, { useState, useEffect } from 'react';
import auditLogsAPI from '../../utils/api/auditLogsAPI';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const AuditLogs = ({ user }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLogs: 0,
    actionStats: { CREATE: 0, UPDATE: 0, DELETE: 0 },
    entityStats: {},
    recentActivity: []
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  const entityTypes = ['Dealer', 'Promotion', 'User', 'Vehicle', 'Order', 'Quote'];
  const actions = ['CREATE', 'UPDATE', 'DELETE'];

  const fetchAuditLogs = async (page = pagination.page) => {
    try {
      setLoading(true);
      
      let response;
      const params = {
        page,
        size: pagination.size
      };

      // Apply filters
      if (filters.entityType && filters.action) {
        // Can't filter by both - use general search with params
        response = await auditLogsAPI.getAll({
          ...params,
          entityType: filters.entityType,
          action: filters.action
        });
      } else if (filters.entityType) {
        response = await auditLogsAPI.getByEntityType(filters.entityType, params);
      } else if (filters.action) {
        response = await auditLogsAPI.getByAction(filters.action, params);
      } else {
        response = await auditLogsAPI.getAll(params);
      }

      setAuditLogs(response.content || []);
      setPagination(prev => ({
        ...prev,
        page,
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      
      if (error.response?.status === 403) {
        setHasPermission(false);
        showErrorToast('Access denied: You do not have permission to view audit logs');
      } else if (error.response?.status === 401) {
        showErrorToast('Authentication required: Please log in again');
      } else {
        showErrorToast('Failed to fetch audit logs');
      }
      
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      
      // Get all logs for stats calculation (limit to recent 1000 for performance)
      const allLogsResponse = await auditLogsAPI.getAll({ page: 0, size: 1000 });
      const allLogs = allLogsResponse.content || [];
      
      // Calculate action stats
      const actionStats = { CREATE: 0, UPDATE: 0, DELETE: 0 };
      allLogs.forEach(log => {
        if (actionStats.hasOwnProperty(log.action)) {
          actionStats[log.action]++;
        }
      });
      
      // Calculate entity stats
      const entityStats = {};
      allLogs.forEach(log => {
        entityStats[log.entityType] = (entityStats[log.entityType] || 0) + 1;
      });
      
      // Get recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentActivity = allLogs.filter(log => 
        new Date(log.createdAt) > yesterday
      ).slice(0, 5);
      
      setStats({
        totalLogs: allLogsResponse.totalElements || allLogs.length,
        actionStats,
        entityStats,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching audit log stats:', error);
      // Don't show error toast for stats as it's secondary functionality
      // Just log the error and continue with empty stats
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(0);
    fetchStats();
  }, [filters.entityType, filters.action]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    fetchAuditLogs(0);
  };

  const handlePageChange = (newPage) => {
    fetchAuditLogs(newPage);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return 'bx-plus-circle';
      case 'UPDATE': return 'bx-edit';
      case 'DELETE': return 'bx-trash';
      default: return 'bx-info-circle';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'var(--color-success)';
      case 'UPDATE': return 'var(--color-warning)';
      case 'DELETE': return 'var(--color-error)';
      default: return 'var(--color-info)';
    }
  };

  const exportLogs = async () => {
    try {
      // Export current filtered results
      const allLogs = await auditLogsAPI.getAll({
        page: 0,
        size: 10000, // Large number to get all results
        entityType: filters.entityType,
        action: filters.action
      });
      
      const csvContent = [
        ['Log ID', 'Action', 'Entity Type', 'Entity ID', 'Username', 'IP Address', 'Created At'].join(','),
        ...allLogs.content.map(log => [
          log.logId,
          log.action,
          log.entityType,
          log.entityId,
          log.username,
          log.ipAddress,
          log.createdAt
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccessToast('Audit logs exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      showErrorToast('Failed to export audit logs');
    }
  };

  const showLogDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="main">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--color-primary)' }}></i>
            <div style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Loading audit logs...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="main">
        <div className="card">
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 40px',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)'
          }}>
            <i className="bx bx-lock-alt" style={{ 
              fontSize: '64px', 
              marginBottom: '24px', 
              color: 'var(--color-error)',
              opacity: '0.7'
            }}></i>
            
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              marginBottom: '12px',
              color: 'var(--color-text)'
            }}>
              Access Denied
            </h3>
            
            <p style={{ 
              fontSize: '16px', 
              color: 'var(--color-text-muted)',
              marginBottom: '32px',
              maxWidth: '500px',
              margin: '0 auto 32px'
            }}>
              You do not have permission to view audit logs. Please contact your administrator if you believe this is an error.
            </p>

            <div style={{
              padding: '20px',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              textAlign: 'left',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bx bx-info-circle" style={{ color: 'var(--color-info)' }}></i>
                About Audit Logs
              </h4>
              
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '12px' }}>
                  Audit logs are restricted to administrators and authorized personnel only. They contain:
                </p>
                <ul style={{ paddingLeft: '20px', margin: '0' }}>
                  <li>System activity records and user actions</li>
                  <li>Data modification history</li>
                  <li>Security and compliance information</li>
                  <li>Sensitive operational data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
          <h2>Audit Logs</h2>
            <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              {pagination.totalElements} total logs
            </p>
          </div>
          <button onClick={exportLogs} className="btn btn-outline">
            <i className="bx bx-download"></i>
            Export CSV
          </button>
        </div>

        {/* Statistics */}
        

        {/* Filters */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px',
          padding: '20px',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Entity Type
            </label>
            <select 
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}
            >
              <option value="">All Types</option>
              {entityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Action
            </label>
            <select 
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}
            >
              <option value="">All Actions</option>
              {actions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Search
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '14px'
                }}
              />
              <button 
                onClick={handleSearch}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                <i className="bx bx-search"></i>
              </button>
            </div>
          </div>

          {(filters.entityType || filters.action || filters.search) && (
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button 
                onClick={() => setFilters({ entityType: '', action: '', search: '', startDate: '', endDate: '' })}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                <i className="bx bx-x"></i>
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div style={{ 
          overflowX: 'auto',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)'
        }}>
          <table className="table" style={{ margin: '0', width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg)' }}>
                <th style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', width: '8%', textAlign: 'center' }}>Log ID</th>
                <th style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', width: '12%', textAlign: 'center' }}>Action</th>
                <th style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', width: '10%', textAlign: 'center' }}>Entity</th>
                <th style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', width: '8%', textAlign: 'center' }}>Entity ID</th>
                <th style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', width: '25%', textAlign: 'center' }}>User</th>
                <th style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', width: '12%', textAlign: 'center' }}>IP Address</th>
                <th style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', width: '15%', textAlign: 'center' }}>Timestamp</th>
                <th style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', width: '10%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '24px', color: 'var(--color-primary)' }}></i>
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    No audit logs found
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.logId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', textAlign: 'center' }}>
                      #{log.logId}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius)',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: `${getActionColor(log.action)}15`,
                        color: getActionColor(log.action),
                        border: `1px solid ${getActionColor(log.action)}30`
                      }}>
                        <i className={`bx ${getActionIcon(log.action)}`} style={{ fontSize: '12px' }}></i>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '500', color: 'var(--color-text)', textAlign: 'center' }}>
                      {log.entityType}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                      #{log.entityId}
                    </td>
                    <td style={{ 
                      padding: '12px 8px',
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                      title: log.username,
                      textAlign: 'center'
                    }}>
                      {log.username}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--color-text)', textAlign: 'center' }}>
                      {log.ipAddress}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => showLogDetails(log)}
                        className="btn btn-sm btn-outline"
                        style={{ 
                          fontSize: '11px', 
                          padding: '4px 8px',
                          borderRadius: 'var(--radius)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          width: '100%',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bx bx-show" style={{ fontSize: '12px' }}></i>
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '20px',
            padding: '16px 0',
            borderTop: '1px solid var(--color-border)'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              Showing {pagination.page * pagination.size + 1} to {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements} logs
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 0}
                className="btn btn-sm btn-outline"
              >
                <i className="bx bx-chevron-left"></i>
                Previous
              </button>
              
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0 16px', 
                fontSize: '14px' 
              }}>
                Page {pagination.page + 1} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages - 1}
                className="btn btn-sm btn-outline"
              >
                Next
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            width: '90%',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Audit Log Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)'
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Log ID
                  </label>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>#{selectedLog.logId}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Action
                  </label>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>
                    <span style={{ 
                      display: 'inline-flex', 
              alignItems: 'center',
                      gap: '6px',
                      color: getActionColor(selectedLog.action)
                    }}>
                      <i className={`bx ${getActionIcon(selectedLog.action)}`}></i>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Entity Type
                  </label>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>{selectedLog.entityType}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Entity ID
                  </label>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>#{selectedLog.entityId}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    IP Address
                  </label>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>{selectedLog.ipAddress}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Timestamp
                  </label>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>{formatDate(selectedLog.createdAt)}</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Username
                </label>
                <div style={{ 
                  fontSize: '14px', 
                  marginTop: '4px', 
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {selectedLog.username}
            </div>
          </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Details
                </label>
          <div style={{ 
            fontSize: '12px',
                  marginTop: '8px', 
                  padding: '12px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'monospace',
                  maxHeight: '300px',
                  overflow: 'auto',
                  border: '1px solid var(--color-border)'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
