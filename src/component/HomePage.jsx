import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './HomePage.css';

const HomePage = ({ onNavigateAuth }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const vehicles = [
    {
      name: 'EVM Sedan Pro',
      image: 'https://images.unsplash.com/photo-1617531653332-bd46c24cf70d?w=800',
      description: 'Sedan điện cao cấp, phạm vi di chuyển',
      range: '550km',
      price: '2.8 tỷ VNĐ'
    },
    {
      name: 'EVM SUV Max',
      image: 'https://images.unsplash.com/photo-1617531652700-e107c9e2e8bb?w=800',
      description: 'SUV điện 7 chỗ, phạm vi di chuyển',
      range: '480km',
      price: '3.2 tỷ VNĐ'
    },
    {
      name: 'EVM Sport G1',
      image: 'https://images.unsplash.com/photo-1617531653522-0c5d4368a2d5?w=800',
      description: 'Coupe thể thao, 0-100km/h trong 3.2s',
      range: '520km',
      price: '4.5 tỷ VNĐ'
    }
  ];

  const features = [
    {
      icon: '🔋',
      title: 'Công nghệ pin',
      description: 'Pin Lithium-ion hiệu suất cao với tuổi thọ lên đến 10 năm'
    },
    {
      icon: '⚡',
      title: 'Tốc độ sạc',
      description: 'Sạc nhanh 80% trong 30 phút, sử dụng công nghệ sạc siêu tốc'
    },
    {
      icon: '🛡️',
      title: 'An toàn AI',
      description: 'Hệ thống trí tuệ nhân tạo phát hiện và phòng tránh va chạm tự động'
    }
  ];

  return (
    <div className={`homepage ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Navbar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isDarkMode ? '' : 'light-bg'}`}>
        <div className="nav-container">
          <div className={`logo ${isDarkMode ? '' : 'light-text'}`}>
            <span className="logo-icon">⚡</span>
            <span className="logo-text">EVM</span>
          </div>
          <ul className="nav-menu">
            <li className={`nav-item active ${isDarkMode ? '' : 'light-text'}`}>Trang chủ</li>
            <li className={`nav-item ${isDarkMode ? '' : 'light-text'}`}>Xe điện</li>
            <li className={`nav-item ${isDarkMode ? '' : 'light-text'}`}>Công nghệ</li>
            <li className={`nav-item ${isDarkMode ? '' : 'light-text'}`}>Đại lý</li>
            <li className={`nav-item ${isDarkMode ? '' : 'light-text'}`}>Liên hệ</li>
          </ul>
          <div className="nav-buttons">
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              title={isDarkMode ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button 
              className={`btn-register ${isDarkMode ? '' : 'light-btn'}`}
              onClick={onNavigateAuth}
            >
              Đăng ký
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="hero-text"
          >
            <h1 className={`hero-title ${isDarkMode ? '' : 'light-text'}`}>
              Drive the Future with
              <br />
              <span className="highlight">Power and Precision</span>
            </h1>
            <p className={`hero-subtitle ${isDarkMode ? '' : 'light-subtitle'}`}>
              Trải nghiệm tương lai của giao thông với công nghệ xe điện tiên tiến nhất
            </p>
            <div className="hero-buttons">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-hero-primary"
              >
                Khám phá xe điện
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`btn-hero-secondary ${isDarkMode ? '' : 'light-secondary'}`}
              >
                Đặt thử lái ngay
              </motion.button>
            </div>
          </motion.div>
        </div>
        <div className="energy-flow"></div>
      </section>

      {/* Feature Section */}
      <section className={`feature-section ${isDarkMode ? '' : 'light-bg-section'}`}>
        <div className="section-header">
          <h2 className={`section-title ${isDarkMode ? '' : 'light-title'}`}>
            Công nghệ <span className="highlight-text">Tương lai</span>
          </h2>
          <p className={`section-subtitle ${isDarkMode ? '' : 'light-subtitle'}`}>
            Dẫn đầu cuộc cách mạng xe điện với những đột phá công nghệ
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
              className={`feature-card ${isDarkMode ? '' : 'light-card'}`}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className={`feature-description ${isDarkMode ? '' : 'light-desc'}`}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vehicle Showcase */}
      <section className={`vehicle-section ${isDarkMode ? '' : 'light-bg-section'}`}>
        <div className="section-header">
          <h2 className={`section-title ${isDarkMode ? '' : 'light-title'}`}>
            Dòng xe <span className="highlight-text">EVM</span>
          </h2>
          <p className={`section-subtitle ${isDarkMode ? '' : 'light-subtitle'}`}>
            Khám phá bộ sưu tập xe điện cao cấp của chúng tôi
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
              whileHover={{ y: -10 }}
              className={`vehicle-card ${isDarkMode ? '' : 'light-card'}`}
            >
              <div className="vehicle-image">
                <img src={vehicle.image} alt={vehicle.name} />
              </div>
              <div className={`vehicle-info ${isDarkMode ? '' : 'light-text'}`}>
                <h3 className="vehicle-name">{vehicle.name}</h3>
                <p className={`vehicle-description ${isDarkMode ? '' : 'light-desc'}`}>
                  {vehicle.description} {vehicle.range}
                </p>
                <div className="vehicle-price">{vehicle.price}</div>
                <div className="vehicle-actions">
                  <button className="btn-details">Chi tiết</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={`cta-section ${isDarkMode ? '' : 'light-bg-section'}`}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="cta-content"
        >
          <h2 className={`cta-title ${isDarkMode ? '' : 'light-text'}`}>
            Trở thành đại lý cùng <span className="highlight-text">EVM</span>
          </h2>
          <p className={`cta-subtitle ${isDarkMode ? '' : 'light-subtitle'}`}>
            Bắt đầu hành trình kinh doanh trong tương lai của ngành ô tô
          </p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="btn-cta"
          >
            Bắt đầu ngay hôm nay
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={`footer ${isDarkMode ? '' : 'light-footer'}`}>
        <div className="footer-container">
          <div className="footer-section">
            <h3 className={`footer-title ${isDarkMode ? '' : 'light-text'}`}>
              <span className="logo-icon">⚡</span> EVM Motors
            </h3>
            <p className={`footer-description ${isDarkMode ? '' : 'light-desc'}`}>
              Nhà phân phối xe điện hàng đầu Việt Nam
            </p>
            <div className="social-links">
              <a href="#" className={`social-link ${isDarkMode ? '' : 'light-social'}`}>Facebook</a>
              <a href="#" className={`social-link ${isDarkMode ? '' : 'light-social'}`}>Instagram</a>
              <a href="#" className={`social-link ${isDarkMode ? '' : 'light-social'}`}>YouTube</a>
            </div>
          </div>
          <div className="footer-section">
            <h4 className={`footer-heading ${isDarkMode ? '' : 'light-text'}`}>Sản phẩm</h4>
            <ul className="footer-links">
              <li><a href="#" className={isDarkMode ? '' : 'light-text'}>Sedan</a></li>
              <li><a href="#" className={isDarkMode ? '' : 'light-text'}>SUV</a></li>
              <li><a href="#" className={isDarkMode ? '' : 'light-text'}>Sport</a></li>
              <li><a href="#" className={isDarkMode ? '' : 'light-text'}>Phụ kiện</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className={`footer-heading ${isDarkMode ? '' : 'light-text'}`}>Dịch vụ</h4>
            <ul className="footer-links">
              <li><a href="#" className={isDarkMode ? '' : 'light-text'}>Thử lái</a></li>
              <li><a href="#" className={isDarkMode ? '' : 'light-text'}>Bảo hành</a></li>
              <li><a href="#" className={isDarkMode ? '' : 'light-text'}>Sạc điện</a></li>
              <li><a href="#" className={isDarkMode ? '' : 'light-text'}>Hỗ trợ</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className={`footer-heading ${isDarkMode ? '' : 'light-text'}`}>Kết nối</h4>
            <div className="social-icons">
              <a href="#" className={`social-icon ${isDarkMode ? '' : 'light-social-icon'}`}>📘</a>
              <a href="#" className={`social-icon ${isDarkMode ? '' : 'light-social-icon'}`}>📷</a>
              <a href="#" className={`social-icon ${isDarkMode ? '' : 'light-social-icon'}`}>📺</a>
            </div>
          </div>
        </div>
        <div className={`footer-bottom ${isDarkMode ? '' : 'light-footer-bottom'}`}>
          <p>&copy; 2023 EVM MOTORS. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
