import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { customersAPI } from '../utils/api/customersAPI';
import { handleAPIError } from '../utils/apiConfig';
import './CustomerPortal.css';

const CustomerPortal = ({ loggedInUser, onLogout }) => {
  const [formValues, setFormValues] = useState({
    customerId: '',
    citizenId: '',
  });
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);

    if (!formValues.customerId || !formValues.citizenId.trim()) {
      setError('Please provide both customerId and citizenId.');
      return;
    }

    try {
      setLoading(true);
      const data = await customersAPI.getPortalInfo(
        Number(formValues.customerId),
        formValues.citizenId.trim()
      );
      setResult(data);
    } catch (err) {
      console.error('Error fetching customer portal info:', err);
      setError(handleAPIError(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-portal-page">
      <Navbar loggedInUser={loggedInUser} onLogout={onLogout} />
      <main className="customer-portal-main">
        <header className="portal-header">
          <p className="eyebrow">Customer-first service</p>
          <h1>
            EVM <span>Customer Portal</span>
          </h1>
          <p className="intro">
            Use your <strong>customerId</strong> and <strong>citizenId (CCCD)</strong> to look up personal information
            and order status.
          </p>
        </header>

        <section className="portal-form-wrapper">
          <form className="single-lookup-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="customerId">customerId *</label>
              <input
                id="customerId"
                name="customerId"
                type="number"
                placeholder="Enter your customer ID"
                value={formValues.customerId}
                onChange={handleChange}
              />
              <small>integer ($int32) — query</small>
            </div>

            <div className="form-group">
              <label htmlFor="citizenId">citizenId *</label>
              <input
                id="citizenId"
                name="citizenId"
                placeholder="Enter your citizen ID / CCCD"
                value={formValues.citizenId}
                onChange={handleChange}
              />
              <small>string — query</small>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="lookup-button" disabled={loading}>
              {loading ? 'Loading...' : 'Submit Request'}
            </button>
          </form>
        </section>

        {loading || result ? (
          <section className="portal-results-wrapper">
            {loading ? (
              <div className="result-placeholder" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading customer information...</div>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Please wait</div>
              </div>
            ) : result ? (
            <div className="result-card">
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                Customer Information
              </h3>
              
              {/* Customer Basic Info */}
              {result.customer && (
                <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {result.customer.fullName && (
                    <p style={{ marginBottom: '8px' }}>
                      <strong>Name:</strong> {result.customer.fullName}
                    </p>
                  )}
                  {result.customer.id && (
                    <p style={{ marginBottom: '8px' }}>
                      <strong>Customer ID:</strong> {result.customer.id}
                    </p>
                  )}
                  {result.customer.citizenId && (
                    <p style={{ marginBottom: '8px' }}>
                      <strong>Citizen ID:</strong> {result.customer.citizenId}
                    </p>
                  )}
                  {result.customer.email && (
                    <p style={{ marginBottom: '8px' }}>
                      <strong>Email:</strong> {result.customer.email}
                    </p>
                  )}
                  {result.customer.phone && (
                    <p style={{ marginBottom: '8px' }}>
                      <strong>Phone:</strong> {result.customer.phone}
                    </p>
                  )}
                  {result.customer.isVip && (
                    <p style={{ marginBottom: '8px' }}>
                      <span style={{ padding: '4px 8px', background: 'var(--color-warning)', color: 'white', fontSize: '12px', borderRadius: '4px' }}>
                        VIP Customer
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Debt Information */}
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#ff4040' }}>
                  Debt Information
                </h4>
                {result.customer && result.customer.totalDebt !== undefined && result.customer.totalDebt !== null && Number(result.customer.totalDebt) > 0 ? (
                  <div>
                    <p style={{ marginBottom: '8px', fontSize: '18px' }}>
                      <strong style={{ color: '#ff4040' }}>Total Outstanding Debt:</strong>{' '}
                      <span style={{ color: '#ff4040', fontWeight: '700' }}>
                        ${Number(result.customer.totalDebt).toLocaleString()}
                      </span>
                    </p>
                    {result.customer.totalSpent !== undefined && result.customer.totalSpent !== null && (
                      <p style={{ marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                        <strong>Total Spent:</strong> ${Number(result.customer.totalSpent).toLocaleString()}
                      </p>
                    )}
                    {result.orders && Array.isArray(result.orders) && result.orders.length > 0 && (
                      <div style={{ marginTop: '24px' }}>
                        <p style={{ marginBottom: '16px', fontWeight: '600', fontSize: '16px' }}>Order Details:</p>
                        <div style={{ 
                          overflowX: 'auto',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 64, 64, 0.2)',
                          background: 'rgba(0, 0, 0, 0.3)'
                        }}>
                          <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            minWidth: '800px'
                          }}>
                            <thead>
                              <tr style={{ 
                                background: 'rgba(255, 64, 64, 0.15)',
                                borderBottom: '2px solid rgba(255, 64, 64, 0.3)'
                              }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Order ID</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Total Amount</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Final Total</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Created Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.orders.map((order, index) => (
                                <tr 
                                  key={order.orderId || order.id || index}
                                  style={{ 
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 64, 64, 0.05)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                    #{order.orderId || order.id || 'N/A'}
                                  </td>
                                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                    {order.totalAmount ? `$${Number(order.totalAmount).toLocaleString()}` : 'N/A'}
                                  </td>
                                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                    {order.finalTotal ? `$${Number(order.finalTotal).toLocaleString()}` : 'N/A'}
                                  </td>
                                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                    {order.status || 'N/A'}
                                  </td>
                                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                    {order.createdDate ? new Date(order.createdDate).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    No outstanding debt found. All accounts are paid in full.
                  </p>
                )}
              </div>
            </div>
            ) : null}
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default CustomerPortal;
