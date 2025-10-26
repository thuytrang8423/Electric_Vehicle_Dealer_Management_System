import React, { useState } from 'react';
import { motion } from 'framer-motion';
import 'boxicons/css/boxicons.min.css';
import './Contact.css';
import Navbar from './Navbar';
import Footer from './Footer';

const Contact = ({ onNavigateHome, onNavigateAuth, onNavigateVehicles }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, type: '', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ và tên';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không đúng định dạng';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Vui lòng nhập nội dung tin nhắn';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowToast({
        show: true,
        type: 'success',
        message: 'Tin nhắn đã gửi thành công ✅'
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      
    } catch (error) {
      setShowToast({
        show: true,
        type: 'error',
        message: 'Có lỗi xảy ra ⚠️'
      });
    } finally {
      setIsSubmitting(false);
    }
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  return (
    <div className="contact-page">
      {/* Navbar */}
      <Navbar 
        onNavigateAuth={onNavigateAuth} 
        onNavigateVehicles={onNavigateVehicles} 
        onNavigateContact={() => {}} 
        onNavigateHome={onNavigateHome}
        currentPage="contact"
      />

      {/* Toast Notification */}
      {showToast.show && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className={`toast toast-${showToast.type}`}
        >
          {showToast.message}
        </motion.div>
      )}

      <div className="contact-container">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="contact-header"
        >
          <h1 className="contact-title">
            <i className="bx bx-phone-call"></i>
            Contact Us
          </h1>
          <p className="contact-subtitle">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn về quản lý xe điện
          </p>
        </motion.div>

        <div className="contact-content">
          {/* Contact Info Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="contact-info-section"
          >
            <h2 className="section-title">Thông tin liên hệ</h2>
            
            <div className="contact-info-grid">
              <div className="contact-info-card">
                <div className="contact-icon">
                  <i className="bx bx-map"></i>
                </div>
                <div className="contact-details">
                  <h3>Địa chỉ văn phòng</h3>
                  <p>123 Đường ABC, Quận XYZ<br />TP. Hồ Chí Minh, Việt Nam</p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-icon">
                  <i className="bx bx-phone"></i>
                </div>
                <div className="contact-details">
                  <h3>Số điện thoại hỗ trợ</h3>
                  <p>+84 123 456 789<br />+84 987 654 321</p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-icon">
                  <i className="bx bx-envelope"></i>
                </div>
                <div className="contact-details">
                  <h3>Email liên hệ</h3>
                  <p>support@evm.com<br />info@evm.com</p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-icon">
                  <i className="bx bx-world"></i>
                </div>
                <div className="contact-details">
                  <h3>Website & Social</h3>
                  <p>www.evm.com<br />Facebook | Instagram | YouTube</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="contact-form-section"
          >
            <h2 className="section-title">Gửi tin nhắn cho chúng tôi</h2>
            
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Họ & Tên *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Nhập họ và tên của bạn"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Nhập địa chỉ email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại (tùy chọn)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Nội dung tin nhắn *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className={errors.message ? 'error' : ''}
                  placeholder="Nhập nội dung tin nhắn của bạn..."
                  rows="6"
                />
                {errors.message && <span className="error-message">{errors.message}</span>}
              </div>

              <motion.button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin"></i>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <i className="bx bx-send"></i>
                    Gửi tin nhắn
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="map-section"
        >
          <h2 className="section-title">Vị trí văn phòng</h2>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.325123456789!2d106.6297!3d10.8231!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752a4567890abc%3A0x1234567890abcdef!2sHo%20Chi%20Minh%20City!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="EVM Office Location"
            />
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Contact;
