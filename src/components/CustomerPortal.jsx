import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { customersAPI } from '../utils/api/customersAPI';
import { showErrorToast } from '../utils/toast';
import { handleAPIError } from '../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';
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
      console.error('Error fetching portal info:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      showErrorToast(errorMsg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const numeric = Number(value || 0);
    if (Number.isNaN(numeric)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      currencyDisplay: 'code',
      maximumFractionDigits: 0,
    }).format(numeric).replace(/\u00A0/g, ' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
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
              {loading ? (
                <>
                  <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '8px' }}></i>
                  Loading...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>

          {!result && !loading && (
            <div className="result-placeholder">
              Enter valid IDs to display customer information.
            </div>
          )}

          {result && (
            <div className="portal-results">
              {/* Customer Information */}
              {result.customerInfo && (
                <div className="result-section">
                  <h2 className="result-section-title">
                    <i className="bx bx-user"></i>
                    Thông tin cá nhân
                  </h2>
                  <div className="info-grid">
                    {Object.entries(result.customerInfo).map(([key, value]) => (
                      <div key={key} className="info-item">
                        <span className="info-label">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="info-value">{value || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders List */}
              {result.orders && Array.isArray(result.orders) && result.orders.length > 0 && (
                <div className="result-section table-section">
                  <h2 className="result-section-title">
                    <i className="bx bx-list-ul"></i>
                    Danh sách đơn hàng ({result.orders.length})
                  </h2>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Order Date</th>
                          <th>Total Amount</th>
                          <th>Paid Amount</th>
                          <th>Remaining</th>
                          <th>Status</th>
                          <th>Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.orders.map((order, index) => (
                          <tr key={order.id || order.orderId || index}>
                            <td>#{order.id || order.orderId || 'N/A'}</td>
                            <td>{formatDate(order.orderDate)}</td>
                            <td className="amount">{formatCurrency(order.totalAmount || 0)}</td>
                            <td className="amount">{formatCurrency(order.paidAmount || 0)}</td>
                            <td className="amount remaining">
                              {formatCurrency(order.remainingAmount || 0)}
                            </td>
                            <td>
                              <span className={`status-badge status-${(order.status || '').toLowerCase()}`}>
                                {order.status || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge payment-${(order.paymentStatus || 'unpaid').toLowerCase()}`}>
                                {order.paymentStatus || 'UNPAID'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {result.paymentHistory && Array.isArray(result.paymentHistory) && result.paymentHistory.length > 0 && (
                <div className="result-section table-section">
                  <h2 className="result-section-title">
                    <i className="bx bx-history"></i>
                    Lịch sử thanh toán ({result.paymentHistory.length})
                  </h2>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Payment Date</th>
                          <th>Amount</th>
                          <th>Payment Method</th>
                          <th>Status</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.paymentHistory.map((payment, index) => (
                          <tr key={payment.id || payment.paymentId || index}>
                            <td>{formatDate(payment.paymentDate || payment.createdAt)}</td>
                            <td className="amount positive">{formatCurrency(payment.amount || 0)}</td>
                            <td>{payment.paymentMethod || 'N/A'}</td>
                            <td>
                              <span className={`status-badge payment-${(payment.status || 'pending').toLowerCase()}`}>
                                {payment.status || 'PENDING'}
                              </span>
                            </td>
                            <td className="notes">{payment.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Installments */}
              {result.installments && Array.isArray(result.installments) && result.installments.length > 0 && (
                <div className="result-section table-section">
                  <h2 className="result-section-title">
                    <i className="bx bx-calendar-check"></i>
                    Lịch trả góp ({result.installments.length})
                  </h2>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Due Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Paid Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.installments.map((installment, index) => (
                          <tr key={installment.id || index}>
                            <td>{formatDate(installment.dueDate)}</td>
                            <td className="amount">{formatCurrency(installment.amount || 0)}</td>
                            <td>
                              <span className={`status-badge installment-${(installment.status || 'pending').toLowerCase()}`}>
                                {installment.status || 'PENDING'}
                              </span>
                            </td>
                            <td>{installment.paidDate ? formatDate(installment.paidDate) : 'Chưa thanh toán'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!result.orders || result.orders.length === 0) && 
               (!result.paymentHistory || result.paymentHistory.length === 0) && 
               (!result.installments || result.installments.length === 0) && (
                <div className="result-placeholder">
                  <i className="bx bx-info-circle" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                  Không có dữ liệu để hiển thị
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerPortal;