import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'boxicons/css/boxicons.min.css';

const Reports = ({ user }) => {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('month');

  const reportData = {
    sales: {
      title: 'Sales Report',
      summary: {
        totalRevenue: '$2,450,000',
        orders: 156,
        averageOrder: '$15,705',
        growth: '+18.5%'
      },
      chart: { type: 'line', data: [120, 135, 145, 165, 180, 195, 210] }
    },
    inventory: {
      title: 'Inventory Report',
      summary: {
        totalVehicles: '1,247',
        inStock: '892',
        lowStock: '156',
        outOfStock: '45'
      },
      chart: { type: 'bar', data: [450, 320, 180, 90, 50] }
    },
    performance: {
      title: 'Performance Report',
      summary: {
        totalStaff: '47',
        topPerformer: 'John Smith',
        averageSales: '12.5',
        targetCompletion: '94%'
      },
      chart: { type: 'pie', data: [35, 25, 20, 15, 5] }
    }
  };

  const data = reportData[selectedReport];

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Reports & Analytics</h2>
          <button className="btn btn-primary">
            <i className="bx bx-download"></i>
            Export Report
          </button>
        </div>

        {/* Report Type Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['sales', 'inventory', 'performance'].map(report => (
            <button
              key={report}
              onClick={() => setSelectedReport(report)}
              className={`btn ${selectedReport === report ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {report}
            </button>
          ))}
        </div>

        {/* Date Range Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['week', 'month', 'quarter', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`btn ${dateRange === range ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="cards-grid">
          {Object.entries(data.summary).map(([key, value]) => (
            <div key={key} className="card">
              <h3 className="card__title" style={{ fontSize: '14px', textTransform: 'capitalize', marginBottom: '8px' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <div className="card__value" style={{ fontSize: '24px' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="chart-card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="chart-card__title">{data.title}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary">
                <i className="bx bx-download"></i>
                PDF
              </button>
              <button className="btn btn-primary">
                <i className="bx bx-table"></i>
                Excel
              </button>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            {selectedReport === 'sales' && (
              <LineChart data={data.chart.data.map((v, i) => ({ month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i], revenue: v }))}>
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
                <Line type="monotone" dataKey="revenue" stroke="#6C63FF" strokeWidth={3} name="Revenue (K)" />
              </LineChart>
            )}
            {selectedReport === 'inventory' && (
              <BarChart data={data.chart.data.map((v, i) => ({ model: ['Model 3', 'Model Y', 'i3', 'Leaf', 'Bolt'][i], stock: v }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="model" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--color-surface)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Legend />
                <Bar dataKey="stock" fill="#00BFA6" name="Units in Stock" />
              </BarChart>
            )}
            {selectedReport === 'performance' && (
              <AreaChart data={data.chart.data.map((v, i) => ({ month: ['Jan', 'Feb', 'Mar', 'Apr', 'May'][i], sales: v }))}>
                <defs>
                  <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC107" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFC107" stopOpacity={0}/>
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
                <Area type="monotone" dataKey="sales" stroke="#FFC107" fillOpacity={1} fill="url(#colorPerformance)" name="Sales" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Additional Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <i className="bx bx-calendar"></i>
                Schedule Report
              </button>
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <i className="bx bx-history"></i>
                View History
              </button>
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <i className="bx bx-filter"></i>
                Customize Report
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Saved Reports</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Monthly Sales Report', 'Inventory Overview', 'Staff Performance'].map((name, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{name}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>
                      <i className="bx bx-download"></i>
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

