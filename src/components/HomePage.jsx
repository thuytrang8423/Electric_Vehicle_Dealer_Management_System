import { motion } from 'framer-motion';
import 'boxicons/css/boxicons.min.css';
import './HomePage.css';
import Footer from './Footer';
import Navbar from './Navbar';

const HomePage = ({ onNavigateAuth, onNavigateVehicles, onNavigateContact, onNavigateDashboard }) => {

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
      <Navbar onNavigateAuth={onNavigateAuth} onNavigateVehicles={onNavigateVehicles} onNavigateContact={onNavigateContact} onNavigateHome={() => {}} currentPage="home" />

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
      <Footer />
    </div>
  );
};

export default HomePage;
