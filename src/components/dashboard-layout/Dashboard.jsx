import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  const evmStaffData = {
    stats: [
      { label: 'Total Vehicles', value: '2,847', change: '+156', icon: 'bx-car', color: 'primary' },
      { label: 'Active Dealers', value: '156', change: '+5', icon: 'bx-store', color: 'secondary' },
      { label: 'System Inventory', value: '68%', change: 'Healthy', icon: 'bx-box', color: 'success' },
      { label: 'Vehicle Orders', value: '89', change: '+12 pending', icon: 'bx-clipboard', color: 'accent' }
    ],
    topDealers: [
      { name: 'Metro Auto Group', sales: 145, revenue: '$6.5M', vehicles: 78 },
      { name: 'City Motors', sales: 132, revenue: '$5.9M', vehicles: 65 },
      { name: 'Green Drive Dealers', sales: 108, revenue: '$4.8M', vehicles: 52 }
    ],
    vehicleOrders: [
      { id: 1, dealer: 'Metro Auto Group', vehicle: 'Tesla Model 3', qty: 15, status: 'Approved' },
      { id: 2, dealer: 'City Motors', vehicle: 'BMW i3', qty: 8, status: 'Pending' }
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
    switch (user?.role) {
      case 'dealer-staff': return dealerStaffData;
      case 'dealer-manager': return dealerManagerData;
      case 'evm-staff': return evmStaffData;
      case 'admin': return adminData;
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

      {user?.role === 'evm-staff' && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-card__title">Top Performing Dealers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.topDealers.map((dealer, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{dealer.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {dealer.sales} sales • {dealer.vehicles} vehicles
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{dealer.revenue}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-card__title">Vehicle Orders from Dealers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.vehicleOrders.map((order, index) => (
                <div key={index} style={{
                  padding: '12px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{order.dealer}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{order.vehicle}</div>
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{order.qty} units</div>
                  </div>
                  <div style={{ fontSize: '12px', color: getStatusColor(order.status), fontWeight: '500' }}>
                    {order.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-card__title">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={[
              { month: 'Jan', revenue: 4000, orders: 45 },
              { month: 'Feb', revenue: 3000, orders: 38 },
              { month: 'Mar', revenue: 5000, orders: 52 },
              { month: 'Apr', revenue: 4500, orders: 48 },
              { month: 'May', revenue: 6000, orders: 61 },
              { month: 'Jun', revenue: 5500, orders: 58 }
            ]}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--color-surface)', 
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#6C63FF" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (K)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-card__title">Sales Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Tesla', value: 45, color: '#6C63FF' },
                  { name: 'BMW', value: 30, color: '#00BFA6' },
                  { name: 'Nissan', value: 15, color: '#FFC107' },
                  { name: 'Others', value: 10, color: '#FF6B6B' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Tesla', value: 45, color: '#6C63FF' },
                  { name: 'BMW', value: 30, color: '#00BFA6' },
                  { name: 'Nissan', value: 15, color: '#FFC107' },
                  { name: 'Others', value: 10, color: '#FF6B6B' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
