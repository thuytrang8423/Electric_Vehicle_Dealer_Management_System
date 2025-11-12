import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import './HomePage.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/vehicles') return 'vehicles';
    if (path === '/recruitment') return 'recruitment';
    if (path === '/dealer') return 'dealer';
    if (path === '/contact') return 'contact';
    return '';
  };

  const currentPage = getCurrentPage();

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="logo" onClick={() => { window.scrollTo(0, 0); navigate('/'); }} style={{ cursor: 'pointer' }}>
          <span className="logo-text">EVM</span>
        </div>
        <ul className="nav-menu">
          <li className={`nav-item ${currentPage === 'home' ? 'active' : ''}`} onClick={() => { window.scrollTo(0, 0); navigate('/'); }} style={{ cursor: 'pointer' }}>Home</li>
          <li className={`nav-item ${currentPage === 'vehicles' ? 'active' : ''}`} onClick={() => { window.scrollTo(0, 0); navigate('/vehicles'); }} style={{ cursor: 'pointer' }}>Electric Vehicles</li>
          <li className={`nav-item ${currentPage === 'recruitment' ? 'active' : ''}`} onClick={() => { window.scrollTo(0, 0); navigate('/recruitment'); }} style={{ cursor: 'pointer' }}>Recruitment</li>
          <li className={`nav-item ${currentPage === 'dealer' ? 'active' : ''}`} onClick={() => { window.scrollTo(0, 0); navigate('/dealer'); }} style={{ cursor: 'pointer' }}>Dealer</li>
          <li className={`nav-item ${currentPage === 'contact' ? 'active' : ''}`} onClick={() => { window.scrollTo(0, 0); navigate('/contact'); }} style={{ cursor: 'pointer' }}>Contact</li>
        </ul>
        <div className="nav-buttons">
          <button 
            className="btn-login"
            onClick={() => navigate('/auth')}
          >
            Login
          </button> 
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
