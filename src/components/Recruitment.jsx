import React, { useRef, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import './Recruitment.css';

const Recruitment = ({ loggedInUser, onLogout }) => {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    position: '',
    cv: null,
  });
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic will be integrated later
    alert('Your application is recorded locally. Submission feature will be added later.');
  };

  const clearFile = () => {
    setForm((prev) => ({ ...prev, cv: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="recruitment-page">
      <Navbar loggedInUser={loggedInUser} onLogout={onLogout} />
      <section className="recruitment-hero">
        <div className="recruitment-hero-overlay" />
        <div className="recruitment-hero-content">
          <div className="recruitment-hero-left">
            <h1 className="recruitment-title">
              EVM <span className="accent">Recruitment</span>
            </h1>
            <p className="recruitment-subtitle">
              Join our journey to accelerate the shift to sustainable mobility.
            </p>
            <div className="opening-item">
              <span className="opening-index">1.</span>
              <span className="opening-name">Sales staff</span>
              <span className="opening-qty">(10)</span>
            </div>
          </div>
          <form className="recruitment-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-field">
                <i className="bx bx-user" />
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                />
              </div>
              <div className="form-field">
                <i className="bx bx-phone" />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone number / Zalo"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <i className="bx bx-envelope" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="E-mail"
                  required
                />
              </div>
              <div className="form-field">
                <i className="bx bx-map" />
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Address"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field select">
                <i className="bx bx-briefcase" />
                <select name="position" value={form.position} onChange={handleChange} required>
                  <option value="">Position applied for</option>
                  <option value="sales">Sales staff</option>
                  <option value="service">Service advisor</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
              <div className="form-field file">
                <i className="bx bx-paperclip" />
                <input
                  type="file"
                  name="cv"
                  accept=".pdf,.doc,.docx"
                  onChange={handleChange}
                  ref={fileInputRef}
                />
                <span className="file-name">{form.cv ? form.cv.name : 'No file chosen'}</span>
                {form.cv && (
                  <button type="button" className="btn-clear-file" onClick={clearFile} aria-label="Clear file">
                    ×
                  </button>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-register">Register</button>
            </div>
          </form>
        </div>
      </section>
      <section className="recruitment-details">
        <div className="details-left">
          <h3 className="section-heading">Position requirements:</h3>
          <ul className="bullet-list">
            <li>Enthusiastic, eager to learn</li>
            <li>Passionate about cars</li>
            <li>Agile with good communication</li>
            <li>Driver license is an advantage</li>
            <li>Desire to grow long-term with the Company</li>
          </ul>
          <h3 className="section-heading">Benefits:</h3>
          <ul className="bullet-list">
            <li>Do what you love</li>
            <li>Competitive salary and annual review</li>
            <li>Modern, friendly, high-performance culture</li>
            <li>Full insurance and welfare per regulations</li>
          </ul>
        </div>
        <div className="details-right">
          <h3 className="section-heading">General information:</h3>
          <ul className="bullet-list">
            <li>Working at: EVM HQ, Smart Mobility Campus</li>
            <li>Working hours: 8:00 a.m. - 5:00 p.m.</li>
          </ul>
          <h3 className="section-heading">Contact for interview:</h3>
          <ul className="bullet-list">
            <li>Email: admin@gmail.com – Title: Recruitment – Full name</li>
            <li>Zalo/Phone: 0946.324.984 (Mrs. Miru)</li>
          </ul>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Recruitment;
