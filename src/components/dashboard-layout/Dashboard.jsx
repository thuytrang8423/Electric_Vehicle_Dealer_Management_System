import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { evmAPI, handleAPIError } from '../../utils/api';
import 'boxicons/css/boxicons.min.css';

const Dashboard = ({ user }) => {
  // Role-specific data
  const dealerStaffData = {
    stats: [
      { label: 'Personal Sales', value: '$245K', change: '+8.2%', icon: 'bx-dollar-circle', color: 'primary' },
      { label: 'Orders Processing', value: '23', change: '+3 new', icon: 'bx-clipboard', color: 'accent' },
      { label: 'Customer Debt', value: '$89K', change: '-12%', icon: 'bx-credit-card', color: 'warning' },
      { label: 'Quotes Created', value: '45', change: '+15%', icon: 'bx-file', color: 'secondary' }
    ],
    topProducts: [
      { name: 'Tesla Model 3', sales: 18, revenue: '$810K' },
      { name: 'BMW i3', sales: 12, revenue: '$504K' },
      { name: 'Nissan Leaf', sales: 8, revenue: '$256K' }
    ],
    recentQuotes: [
      { id: 1, customer: 'John Doe', vehicle: 'Tesla Model 3', amount: '$42,750', status: 'Pending' },
      { id: 2, customer: 'Jane Smith', vehicle: 'BMW i3', amount: '$37,800', status: 'Approved' }
    ]
  };

  const dealerManagerData = {
    stats: [
      { label: 'Total Revenue', value: '$2.4M', change: '+12.5%', icon: 'bx-dollar-circle', color: 'primary' },
      { label: 'Active Staff', value: '12', change: '+2 new', icon: 'bx-user', color: 'secondary' },
      { label: 'Inventory Level', value: '85%', change: 'Good', icon: 'bx-box', color: 'success' },
      { label: 'Pending Approvals', value: '8', change: '2 urgent', icon: 'bx-clipboard', color: 'warning' }
    ],
    staffPerformance: [
      { name: 'John Smith', sales: 45, revenue: '$180K', rank: 1 },
      { name: 'Sarah Johnson', sales: 38, revenue: '$152K', rank: 2 },
      { name: 'Mike Chen', sales: 32, revenue: '$128K', rank: 3 }
    ],
    pendingApprovals: [
      { type: 'Quote', ref: 'Quote #5678', amount: '$42,750', requestedBy: 'John Smith', date: '2024-01-15' },
      { type: 'Order', ref: 'ORD-003', amount: '$52,000', requestedBy: 'Sarah Johnson', date: '2024-01-14' }
    ]
  };

  // EVM Manager state
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [systemStatus, setSystemStatus] = useState({
    orderStatusCounts: {},
    totalSales: 0
  });
  const [dealerPerformance, setDealerPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch EVM data
  const fetchEVMData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusData, performanceData] = await Promise.all([
        evmAPI.getSystemStatus(dateRange),
        evmAPI.getDealerPerformance(dateRange)
      ]);
      console.log('System Status Data:', statusData);
      console.log('Dealer Performance Data:', performanceData);
      setSystemStatus(statusData);
      setDealerPerformance(Array.isArray(performanceData) ? performanceData : []);
    } catch (err) {
      setError(handleAPIError(err));
      console.error('Error fetching EVM data:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Check if user is EVM Manager (support multiple role formats)
  const isEVMManager = user?.role === 'evm-manager' || user?.role === 'EVM_MANAGER' || user?.role === 'evm-staff';

  useEffect(() => {
    if (isEVMManager) {
      fetchEVMData();
    }
  }, [isEVMManager, fetchEVMData]);

  // Calculate total orders from status counts
  const getTotalOrders = () => {
    return Object.values(systemStatus.orderStatusCounts || {}).reduce((sum, count) => sum + (count || 0), 0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount?.toLocaleString() || '0'}`;
  };

  const evmStaffData = {
    stats: [
      { 
        label: 'Total Revenue', 
        value: formatCurrency(systemStatus.totalSales || 0), 
        change: 'System', 
        icon: 'bx-dollar-circle', 
        color: 'primary' 
      },
      { 
        label: 'Total Orders', 
        value: getTotalOrders().toLocaleString(), 
        change: 'All statuses', 
        icon: 'bx-clipboard', 
        color: 'secondary' 
      },
      { 
        label: 'Active Dealers', 
        value: dealerPerformance.length.toString(), 
        change: 'Active', 
        icon: 'bx-store', 
        color: 'success' 
      },
      { 
        label: 'Pending Orders', 
        value: (systemStatus.orderStatusCounts?.PENDING || systemStatus.orderStatusCounts?.PROCESSING || 0).toString(), 
        change: 'Needs attention', 
        icon: 'bx-time-five', 
        color: 'warning' 
      }
    ]
  };

  const adminData = {
    stats: [
      { label: 'Total Users', value: '1,247', change: '+89', icon: 'bx-user', color: 'primary' },
      { label: 'Active Dealers', value: '156', change: '+12', icon: 'bx-store', color: 'secondary' },
      { label: 'System Revenue', value: '$48.2M', change: '+18.5%', icon: 'bx-dollar-circle', color: 'success' },
      { label: 'Active Promotions', value: '24', change: '3 expiring', icon: 'bx-gift', color: 'accent' }
    ],
    userDistribution: [
      { role: 'Dealer Staff', count: 892, percentage: 71.5 },
      { role: 'Dealer Managers', count: 156, percentage: 12.5 },
      { role: 'EVM Staff', count: 127, percentage: 10.2 },
      { role: 'Admins', count: 72, percentage: 5.8 }
    ],
    systemStatus: [
      { service: 'Database', status: 'healthy', lastSync: '2 minutes ago' },
      { service: 'Backup', status: 'healthy', lastSync: '5 hours ago' },
      { service: 'Payment Gateway', status: 'healthy', lastSync: '1 minute ago' }
    ]
  };

  const getDataForRole = () => {
    const role = user?.role;
    // Support multiple EVM role formats
    if (role === 'evm-manager' || role === 'EVM_MANAGER' || role === 'evm-staff') {
      return evmStaffData;
    }
    switch (role) {
      case 'dealer-staff': return dealerStaffData;
      case 'dealer-manager': return dealerManagerData;
      case 'admin':
      case 'ADMIN': return adminData;
      default: return dealerManagerData;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing':
      case 'Pending':
        return 'var(--color-warning)';
      case 'Confirmed':
      case 'Approved':
        return 'var(--color-success)';
      case 'Delivered':
        return 'var(--color-success)';
      default:
        return 'var(--color-text-muted)';
    }
  };

  const data = getDataForRole();

  return (
    <div className="main">
      {/* Main Stats Cards */}
      <div className="cards-grid">
        {data.stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="card__header">
              <h3 className="card__title">{stat.label}</h3>
              <div className={`card__icon card__icon--${stat.color}`}>
                <i className={`bx ${stat.icon}`}></i>
              </div>
            </div>
            <div className="card__value">{stat.value}</div>
            <div className={`card__change card__change--positive`}>
              <i className="bx bx-trending-up"></i>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Role-specific content */}
      {user?.role === 'dealer-staff' && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-card__title">Top Selling Products</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.topProducts.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{item.name}</div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{item.sales} units sold</div>
                  </div>
                  <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{item.revenue}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-card__title">Recent Quotes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.recentQuotes.map((quote, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{quote.customer}</div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{quote.vehicle}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{quote.amount}</div>
                    <div style={{ fontSize: '12px', color: getStatusColor(quote.status), fontWeight: '500' }}>
                      {quote.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {user?.role === 'dealer-manager' && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-card__title">Staff Performance Leaderboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.staffPerformance.map((staff, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: index === 0 ? 'var(--color-warning)' : 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{staff.name}</div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{staff.sales} sales</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{staff.revenue}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-card__title">Pending Approvals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.pendingApprovals.map((item, index) => (
                <div key={index} style={{
                  padding: '12px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-warning)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{item.type} - {item.ref}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{item.requestedBy}</div>
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{item.amount}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{item.date}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      <i className="bx bx-check"></i> Approve
                    </button>
                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      <i className="bx bx-x"></i> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isEVMManager && (
        <>
          {/* Date Range Picker */}
          <div className="chart-card" style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <h3 className="chart-card__title" style={{ margin: 0 }}>System Data Summary</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>From:</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>To:</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <button
                  onClick={fetchEVMData}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
                >
                  <i className="bx bx-refresh"></i> {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
            {error && (
              <div style={{
                padding: '12px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid #FF6B6B',
                borderRadius: 'var(--radius)',
                color: '#FF6B6B',
                marginBottom: '16px'
              }}>
                <i className="bx bx-error-circle"></i> {error}
              </div>
            )}
          </div>

          {/* Order Status Counts */}
          <div className="chart-card" style={{ marginBottom: '24px' }}>
            <h3 className="chart-card__title">Order Status Statistics</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                <div>Loading data...</div>
              </div>
            ) : Object.keys(systemStatus.orderStatusCounts || {}).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-info-circle" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                <div>No data available for this time period</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {Object.entries(systemStatus.orderStatusCounts || {}).map(([status, count]) => {
                  // Map status to colors
                  const getStatusColor = (statusName) => {
                    const upperStatus = statusName.toUpperCase();
                    if (upperStatus.includes('COMPLETED') || upperStatus.includes('DONE') || upperStatus.includes('DELIVERED')) {
                      return '#22C55E'; // Green
                    } else if (upperStatus.includes('PENDING') || upperStatus.includes('WAITING')) {
                      return '#F59E0B'; // Orange/Amber
                    } else if (upperStatus.includes('APPROVED') || upperStatus.includes('CONFIRMED')) {
                      return '#3B82F6'; // Blue
                    } else if (upperStatus.includes('CANCELLED') || upperStatus.includes('REJECTED')) {
                      return '#EF4444'; // Red
                    } else if (upperStatus.includes('PROCESSING') || upperStatus.includes('IN_PROGRESS')) {
                      return '#8B5CF6'; // Purple
                    } else {
                      return 'var(--color-primary)'; // Default red
                    }
                  };

                  return (
                    <div key={status} style={{
                      padding: '16px',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700', 
                        color: getStatusColor(status),
                        marginBottom: '8px'
                      }}>
                        {count?.toLocaleString() || 0}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: 'var(--color-text-muted)',
                        textTransform: 'capitalize'
                      }}>
                        {status.replace(/_/g, ' ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dealer Performance and Order Status Distribution - Side by Side */}
          <div className="charts-grid">
            {/* Dealer Performance */}
            <div className="chart-card">
              <h3 className="chart-card__title">Dealer Performance</h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                  <div>Loading data...</div>
                </div>
              ) : dealerPerformance.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  <i className="bx bx-info-circle" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                  <div>No dealer data available for this time period</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '600' }}>No</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '600' }}>Dealer Name</th>
                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: '600' }} title="Tổng tiền đã đặt tới EVM">Total Sales</th>
                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: '600' }} title="Số đơn hàng đã đặt tới EVM">Total Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dealerPerformance
                        .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
                        .map((dealer, index) => (
                          <tr key={dealer.dealerId || index} style={{ 
                            borderBottom: '1px solid var(--color-border)',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px', color: 'var(--color-text)', fontWeight: '600' }}>
                            {index + 1}
                          </td>
                            <td style={{ padding: '12px', color: 'var(--color-text)', fontWeight: '600' }}>
                              {dealer.dealerName || `Dealer #${dealer.dealerId}`}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-primary)', fontWeight: '600' }}>
                              {formatCurrency(dealer.totalSales || 0)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text)' }}>
                              {(dealer.totalOrders || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Order Status Distribution Chart */}
            {Object.keys(systemStatus.orderStatusCounts || {}).length > 0 && (
              <div className="chart-card">
                <h3 className="chart-card__title">Order Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(systemStatus.orderStatusCounts || {}).map(([name, value]) => ({
                      name: name.replace(/_/g, ' '),
                      value: value || 0
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(systemStatus.orderStatusCounts || {}).map((entry, index) => {
                      const colors = ['#6C63FF', '#00BFA6', '#FFC107', '#FF6B6B', '#9C27B0', '#2196F3', '#4CAF50'];
                      return (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      );
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {user?.role === 'admin' && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-card__title">User Distribution by Role</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.userDistribution.map((item, index) => (
                <div key={index} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{item.role}</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>{item.count} users</div>
                  </div>
                  <div style={{
                    height: '8px',
                    background: 'var(--color-bg)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${item.percentage}%`,
                      background: `hsl(${index * 60}, 70%, 50%)`,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-card__title">System Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.systemStatus.map((service, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{service.service}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Last sync: {service.lastSync}</div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-success)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {service.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
