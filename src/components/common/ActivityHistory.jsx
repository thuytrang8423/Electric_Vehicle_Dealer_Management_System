import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const ActivityHistory = ({ user }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock activity data
  const mockActivities = [
    { id: 1, action: 'Created order', target: 'ORD-001', user: 'John Smith', timestamp: '2024-01-15 10:30 AM', type: 'order' },
    { id: 2, action: 'Updated customer', target: 'Customer #1234', user: 'John Smith', timestamp: '2024-01-15 09:15 AM', type: 'customer' },
    { id: 3, action: 'Approved quote', target: 'Quote #5678', user: 'John Smith', timestamp: '2024-01-14 03:45 PM', type: 'approval' },
    { id: 4, action: 'Added payment', target: 'Payment #9012', user: 'John Smith', timestamp: '2024-01-14 02:20 PM', type: 'payment' },
    { id: 5, action: 'Scheduled test drive', target: 'Test Drive #3456', user: 'John Smith', timestamp: '2024-01-14 11:00 AM', type: 'test-drive' },
    { id: 6, action: 'Updated profile', target: 'Personal Info', user: 'John Smith', timestamp: '2024-01-13 04:30 PM', type: 'profile' },
    { id: 7, action: 'Exported report', target: 'Monthly Sales Report', user: 'John Smith', timestamp: '2024-01-13 10:15 AM', type: 'report' },
    { id: 8, action: 'Viewed vehicle', target: 'Vehicle #7890', user: 'John Smith', timestamp: '2024-01-12 01:45 PM', type: 'vehicle' },
    { id: 9, action: 'Updated order status', target: 'ORD-002', user: 'John Smith', timestamp: '2024-01-12 09:30 AM', type: 'order' },
    { id: 10, action: 'Sent notification', target: 'Customer Notification', user: 'John Smith', timestamp: '2024-01-11 03:00 PM', type: 'notification' }
  ];

  const getActivityIcon = (type) => {
    const icons = {
      order: 'bx-bx-clipboard',
      customer: 'bx-bx-user',
      approval: 'bx-bx-check-circle',
      payment: 'bx-bx-credit-card',
      'test-drive': 'bx-bx-car',
      profile: 'bx-bx-user-circle',
      report: 'bx-bx-bar-chart',
      vehicle: 'bx-bx-car',
      notification: 'bx-bx-bell'
    };
    return icons[type] || 'bx-bx-info-circle';
  };

  const getActivityColor = (type) => {
    const colors = {
      order: 'var(--color-info)',
      customer: 'var(--color-primary)',
      approval: 'var(--color-success)',
      payment: 'var(--color-accent)',
      'test-drive': 'var(--color-secondary)',
      profile: 'var(--color-text-muted)',
      report: 'var(--color-warning)',
      vehicle: 'var(--color-info)',
      notification: 'var(--color-primary)'
    };
    return colors[type] || 'var(--color-text-muted)';
  };

  const filters = ['all', 'order', 'customer', 'approval', 'payment', 'test-drive', 'report'];

  const filteredActivities = mockActivities.filter(activity => {
    const matchesFilter = selectedFilter === 'all' || activity.type === selectedFilter;
    const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          activity.target.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  return (
    <div className="main">
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>Activity History</h2>

        {/* Filters and Search */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search activities..."
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`btn ${selectedFilter === filter ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Action</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Target</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Timestamp</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {paginatedActivities.map((activity) => (
                <tr key={activity.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{activity.action}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', fontWeight: '500' }}>{activity.target}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{activity.user}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{activity.timestamp}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getActivityColor(activity.type),
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      <i className={`bx ${getActivityIcon(activity.type)}`}></i>
                      {activity.type}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredActivities.length)} of {filteredActivities.length} results
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                <i className="bx bx-chevron-left"></i>
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </div>
        )}

        {filteredActivities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
            <div>No activities found</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHistory;

