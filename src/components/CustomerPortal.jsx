import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import './CustomerPortal.css';

const CustomerPortal = ({ loggedInUser, onLogout }) => {
  const [formValues, setFormValues] = useState({
    customerId: '',
    citizenId: '',
  });
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!formValues.customerId || !formValues.citizenId.trim()) {
      setError('Please provide both customerId and citizenId.');
      setResult(null);
      return;
    }

    // Mock lookup. Replace with API call to GET /api/customer/portal
    setResult({
      customerId: formValues.customerId,
      citizenId: formValues.citizenId,
      name: 'Demo Customer',
      note: 'Replace this with live data once API integration is ready.',
    });
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

            <button type="submit" className="lookup-button">
              Submit Request
            </button>
          </form>

          {result ? (
            <div className="result-card">
              <p>
                <strong>Name:</strong> {result.name}
              </p>
              <p>
                <strong>customerId:</strong> {result.customerId}
              </p>
              <p>
                <strong>citizenId:</strong> {result.citizenId}
              </p>
              <p className="result-note">{result.note}</p>
            </div>
          ) : (
            <div className="result-placeholder">
              Enter valid IDs to display customer information.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerPortal;
