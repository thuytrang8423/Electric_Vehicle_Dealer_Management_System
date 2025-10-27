import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import './HomePage.css';

const HomePage = ({ loggedInUser, onLogout }) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const vehicles = [
    {
      name: 'EVM Sedan Pro',
      image: '/images/honda-dien_thanhnien-2_WXZA.jpg',
      description: 'Premium electric sedan',
      range: '650km range',
      price: '$280,000'
    },
    {
      name: 'EVM SUV Max',
      image: '/images/vinfast-vf8-18.jpg',
      description: '7-seat electric SUV',
      range: '580km range',
      price: '$320,000'
    },
    {
      name: 'EVM Sport GT',
      image: '/images/xe-o-to-dien-dau-tien-cua-nuoc-phap.jpg',
      description: 'Sports coupe',
      range: '0-100km/h in 3.2s',
      price: '$450,000'
    },
    {
      name: 'EVM City Mini',
      image: '/images/image.jpg',
      description: 'Compact city car',
      range: '450km range',
      price: '$150,000'
    }
  ];

  const features = [
    {
      iconClass: 'bx bxs-battery',
      title: 'Battery Technology',
      description: 'Next-generation lithium-ion battery with high energy density, lifespan up to 1 million km and fast charging in 15 minutes.'
    },
    {
      iconClass: 'bx bxs-zap',
      title: 'Charging Speed',
      description: 'Ultra-fast 800V charging technology, from 10% to 80% in just 18 minutes with EVM Power charging station.'
    },
    {
      iconClass: 'bx bxs-shield-alt-2',
      title: 'AI Safety',
      description: 'Active safety system with AI, collision warning, automatic braking and smart driving assistance.'
    }
  ];

  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">
            <span className="logo-text">EVM</span>
          </div>
          <ul className="nav-menu">
            <li className="nav-item active">Home</li>
            <li className="nav-item">
              <Link to="/vehicles" style={{ textDecoration: 'none', color: 'inherit' }}>
                Electric Vehicles
              </Link>
            </li>
            <li className="nav-item">Technology</li>
            <li className="nav-item">Dealer</li>
            <li className="nav-item">Contact</li>
          </ul>
          <div className="nav-buttons">
            {loggedInUser ? (
              <>
                <button 
                  className="btn-login"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </button>
                <button 
                  className="btn-register"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn-login"
                  onClick={() => navigate('/auth')}
                >
                  Login
                </button> 
                <button 
                  className="btn-register"
                  onClick={() => navigate('/auth')}
                >
                  Test Drive              
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Video Background */}
        <div className="hero-video-container">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            src="/Introduction.mp4"
          />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="hero-text"
          >
            <h1 className="hero-title">
              Drive the Future with
              <br />
              <span className="highlight">
                Power and <span className="red-text">Precision</span>
              </span>
            </h1>
            <p className="hero-subtitle">
              Experience the future of transportation with the most advanced electric vehicle technology
            </p>
            <div className="hero-buttons">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-hero-primary"
              >
                Explore EVs
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-hero-secondary"
              >
                Book a Test Drive
              </motion.button>
            </div>
          </motion.div>
        </div>
        <div className="energy-flow"></div>
      </section>

      {/* Feature Section */}
      <section className="feature-section">
        <div className="section-header">
          <h2 className="section-title">
            Future <span className="highlight-text">Technology</span>
          </h2>
          <p className="section-subtitle">
            Leading the electric vehicle revolution with breakthrough technology
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="feature-card"
            >
              <div className="feature-icon">
                <i className={feature.iconClass}></i>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vehicle Showcase */}
      <section className="vehicle-section">
        <div className="section-header">
          <h2 className="section-title">
            EVM <span className="highlight-text">Fleet</span>
          </h2>
          <p className="section-subtitle">
            Explore our premium electric vehicle collection
          </p>
        </div>
        <div className="vehicle-carousel">
          {vehicles.map((vehicle, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="vehicle-card"
            >
              <div className="vehicle-image">
                <div className="vehicle-type-label">{vehicle.name}</div>
                <img src={vehicle.image} alt={vehicle.name} />
              </div>
              <div className="vehicle-info">
                <h3 className="vehicle-name-main">{vehicle.name}</h3>
                <p className="vehicle-description">
                  {vehicle.description}, {vehicle.range}
                </p>
                <div className="vehicle-price">{vehicle.price}</div>
                <button className="btn-details">Details</button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="cta-content"
        >
          <h2 className="cta-title">
            Become a Dealer with <span className="highlight-text">EVM</span>
          </h2>
          <p className="cta-subtitle">
            Start your journey in the future of automotive business
          </p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="btn-cta"
          >
            Get Started Today
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
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
    </div>
  );
};

export default HomePage;
