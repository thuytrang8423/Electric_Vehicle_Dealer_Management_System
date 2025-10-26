import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import 'boxicons/css/boxicons.min.css';
import './AuthPage.css';

const AuthPage = ({ onNavigateHome }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const carouselImages = [
    '/images/tesla2.jpg',
    '/images/image.jpg',
    '/images/vinfast-vf8-18.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle login logic here
      console.log('Login data:', formData);
    }, 2000);
  };

  return (
    <div className="auth-page">
      {/* Background */}
      <div className="auth-background">
        <div className="background-overlay"></div>
      </div>

      {/* Centered Login Card */}
      <div className="login-card-container">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Left Section - Image */}
          <div className="card-left">
            <div className="logo-container">
              <span className="logo-text">EVM</span>
            </div>


            <div className="image-container">
              <motion.div 
                className="car-image"
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  backgroundImage: `url(${carouselImages[currentImageIndex]})`
                }}
              ></motion.div>
              <div className="image-overlay"></div>
              
              {/* Carousel Dots */}
              <div className="carousel-dots">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </div>
            
            <div className="brand-content">
              <h1 className="brand-slogan">
                Experience <span className="red-text">The Future</span>
              </h1>
              
              <p className="brand-description">
                Experience the most advanced electric vehicle management system. Connect with the future of the electric vehicle industry.
              </p>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="card-right">
            <div className="form-container">
              <div className="form-header">
                <h2 className="form-title">Login</h2>
                <p className="form-subtitle">Access the EVM management system</p>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="input-group">
                  <i className="bx bx-user input-icon"></i>
                  <input
                    type="email"
                    name="email"
                    placeholder="Username or Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="input-group">
                  <i className="bx bx-lock input-icon"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                  <i 
                    className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} password-toggle`}
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>

                <div className="form-options">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Remember me
                  </label>
                  <a href="#" className="forgot-password">Forgot password?</a>
                </div>

                <button 
                  type="submit" 
                  className={`login-button ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="bx bx-loader-alt loading-icon"></i>
                      Loading...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>

                <motion.button 
                  className="back-to-home"
                  onClick={onNavigateHome}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="bx bx-arrow-back"></i>
                  Back to Home
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default AuthPage;