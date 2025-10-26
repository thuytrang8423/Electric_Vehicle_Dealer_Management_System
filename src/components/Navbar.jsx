import React, { useState, useEffect } from 'react';
import 'boxicons/css/boxicons.min.css';
import './HomePage.css';

const Navbar = ({ onNavigateAuth, onNavigateVehicles, onNavigateContact, onNavigateHome, currentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="logo" onClick={() => { window.scrollTo(0, 0); onNavigateHome(); }} style={{ cursor: 'pointer' }}>
          <span className="logo-text">EVM</span>
        </div>
        <ul className="nav-menu">
          <li className={`nav-item ${currentPage === 'home' ? 'active' : ''}`} onClick={() => { window.scrollTo(0, 0); onNavigateHome(); }} style={{ cursor: 'pointer' }}>Home</li>
          <li className={`nav-item ${currentPage === 'vehicles' ? 'active' : ''}`} onClick={() => { window.scrollTo(0, 0); onNavigateVehicles(); }} style={{ cursor: 'pointer' }}>Electric Vehicles</li>
          <li className="nav-item">Technology</li>
          <li className="nav-item">Dealer</li>
          <li className={`nav-item ${currentPage === 'contact' ? 'active' : ''}`} onClick={() => { window.scrollTo(0, 0); onNavigateContact(); }} style={{ cursor: 'pointer' }}>Contact</li>
        </ul>
        <div className="nav-buttons">
          <button 
            className="btn-login"
            onClick={onNavigateAuth}
          >
            Login
          </button> 
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
