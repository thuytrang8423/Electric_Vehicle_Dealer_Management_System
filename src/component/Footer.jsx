import React from 'react';
import 'boxicons/css/boxicons.min.css';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">
            <i className="bx bxs-bolt"></i>
            <span>EVM Motors</span>
          </h3>
          <p className="footer-description">
            Leading electric vehicle distributor
          </p>
          <div className="social-links">
            <a href="#" className="social-link">
              <i className="bx bxl-facebook"></i>
            </a>
            <a href="#" className="social-link">
              <i className="bx bxl-instagram"></i>
            </a>
            <a href="#" className="social-link">
              <i className="bx bxl-youtube"></i>
            </a>
          </div>
        </div>
        <div className="footer-section">
          <h4 className="footer-heading">Products</h4>
          <ul className="footer-links">
            <li><a href="#">Sedan</a></li>
            <li><a href="#">SUV</a></li>
            <li><a href="#">Sport</a></li>
            <li><a href="#">Accessories</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4 className="footer-heading">Services</h4>
          <ul className="footer-links">
            <li><a href="#">Test Drive</a></li>
            <li><a href="#">Warranty</a></li>
            <li><a href="#">Charging</a></li>
            <li><a href="#">Support</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4 className="footer-heading">Connect</h4>
          <div className="social-icons">
            <a href="#" className="social-icon">
              <i className="bx bxl-facebook"></i>
            </a>
            <a href="#" className="social-icon">
              <i className="bx bxl-instagram"></i>
            </a>
            <a href="#" className="social-icon">
              <i className="bx bxl-youtube"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2023 EVM MOTORS. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
