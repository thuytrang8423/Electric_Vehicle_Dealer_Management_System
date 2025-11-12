import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import './AuthPage.css';
import { authAPI, handleAPIError, usersAPI } from '../utils/api';
import { showErrorToast } from '../utils/toast';


const AuthPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
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
    }, 5000);

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
    
    try {
      const userData = await authAPI.login(formData.email, formData.password);
      const userId =
        userData['user Id'] ||
        userData.userId ||
        userData.id ||
        userData.user?.id;

      // Store user in localStorage
      const baseUser = {
        id: userId,
        name: userData.name || userData.user?.name,
        email: userData.email || userData.user?.email,
        role: userData.role || userData.user?.role,
        token: userData.token,
      };

      localStorage.setItem('currentUser', JSON.stringify(baseUser));

      // Fetch additional profile info (e.g., dealerId) after token is stored
      let enrichedUser = baseUser;
      try {
        if (userId) {
          const profile = await usersAPI.getById(userId);
          enrichedUser = {
            ...baseUser,
            name: profile?.fullName || baseUser.name,
            fullName: profile?.fullName || baseUser.name,
            dealerId: profile?.dealerId ?? baseUser?.dealerId ?? null,
            role: profile?.role || baseUser.role,
            email: profile?.email || baseUser.email,
            phoneNumber: profile?.phoneNumber,
            status: profile?.status,
          };
          localStorage.setItem('currentUser', JSON.stringify(enrichedUser));
        }
      } catch (profileError) {
        console.warn('Failed to fetch user profile after login:', profileError);
      }

      setIsLoading(false);

      // Call onLoginSuccess callback with user data
      if (onLoginSuccess) {
        onLoginSuccess(enrichedUser);
      }
      // Navigate to dashboard after successful login
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      
      // Show API error message
      const errorMessage = handleAPIError(error);
      showErrorToast(errorMessage);
    }
  };

  return (
    <div className="auth-page">
      {/* Background */}
      <div className="auth-background">
        <div className="background-overlay"></div>
      </div>

      {/* Centered Login Card */}
      <div className="login-card-container">
        {/* Back to Home Button - Above Form */}
        <motion.button 
          className="back-to-home-above-form"
          onClick={() => navigate('/')}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <i className="bx bx-arrow-back"></i>
          Back To Home
        </motion.button>

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
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;