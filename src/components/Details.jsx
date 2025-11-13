import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import 'boxicons/css/boxicons.min.css';
import './Details.css';
import Footer from './Footer';
import Navbar from './Navbar';
import { vehiclesAPI } from '../utils/api/vehiclesAPI';
import { dealersAPI } from '../utils/api/dealersAPI';
import { customersAPI } from '../utils/api/customersAPI';

const Details = ({ loggedInUser, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTestDriveModal, setShowTestDriveModal] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const dateInputRef = useRef(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    phoneNumber: '',
    carModel: '',
    dealerId: '',
    date: '',
    time: '07:00:00',
    note: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch dealers when modal opens
  useEffect(() => {
    if (showTestDriveModal) {
      const fetchDealers = async () => {
        try {
          setLoadingDealers(true);
          const data = await dealersAPI.getAll();
          setDealers(data.filter(d => d.status === 'ACTIVE' || d.status === 'active'));
        } catch (err) {
          console.error('Error fetching dealers:', err);
        } finally {
          setLoadingDealers(false);
        }
      };
      fetchDealers();
    }
  }, [showTestDriveModal]);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const data = await vehiclesAPI.getById(id);
        setVehicle(data);
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        setError('Failed to load vehicle details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="details-page">
        <Navbar loggedInUser={loggedInUser} onLogout={onLogout} />
        <div className="loading-container">
          <div className="loading-message">Loading vehicle details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="details-page">
        <Navbar loggedInUser={loggedInUser} onLogout={onLogout} />
        <div className="error-container">
          <div className="error-message">{error || 'Vehicle not found'}</div>
          <button className="btn-back" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = vehicle.specifications?.images || [];
  const currentImage = images[selectedImageIndex] || images[0] || '/images/image.jpg';
  const range = vehicle.specifications?.battery?.range_km || 0;
  const status = vehicle.status || 'AVAILABLE';
  const isNew = vehicle.yearOfManufacture >= new Date().getFullYear() - 1;
  
  // Format price - show as $100 (without decimals if whole number)
  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Contact Us';
    const numPrice = Number(price);
    if (Number.isInteger(numPrice)) {
      return `$${numPrice}`;
    }
    return `$${numPrice.toFixed(2)}`;
  };

  const formattedPrice = formatPrice(vehicle.listedPrice);
  
  // Specifications from API - only use fields that exist in API
  const batteryCapacity = vehicle.batteryCapacity || vehicle.specifications?.battery?.capacity_kWh || 0;
  const brand = vehicle.brand || 'N/A';
  const yearOfManufacture = vehicle.yearOfManufacture || null;
  
  // Format range display - show "Økm" if 0, otherwise show value
  const formatRange = (range) => {
    return range > 0 ? `${range}km` : 'Økm';
  };
  
  // Format battery capacity display
  const formatBatteryCapacity = (capacity) => {
    return capacity > 0 ? `${capacity} kWh` : 'Ø kWh';
  };
  
  // Format year display
  const formatYear = (year) => {
    return year ? `${year}` : 'N/A';
  };
  
  // Parse versionJson to get version info and features
  let versionData = null;
  let features = [];
  let versionName = null;
  try {
    if (vehicle.versionJson) {
      const parsed = JSON.parse(vehicle.versionJson);
      versionData = parsed;
      features = parsed.features || [];
      versionName = parsed.name || parsed.version || parsed.package || null;
    }
  } catch (e) {
    console.error('Error parsing versionJson:', e);
  }
  
  // Parse availableColorsJson to get colors
  let colors = [];
  try {
    if (vehicle.availableColorsJson) {
      const parsedColors = JSON.parse(vehicle.availableColorsJson);
      colors = Array.isArray(parsedColors) ? parsedColors : [];
      console.log('Parsed colors:', colors);
    } else {
      console.log('No availableColorsJson found in vehicle data');
    }
  } catch (e) {
    console.error('Error parsing availableColorsJson:', e);
    console.log('Raw availableColorsJson:', vehicle.availableColorsJson);
  }
  
  // Debug: Log colors array
  console.log('Colors array length:', colors.length);
  console.log('Colors:', colors);
  
  // Get color description based on color name
  const getColorDescription = (colorName) => {
    const colorMap = {
      'Đen': 'Elegant black, perfect for modern and sophisticated style',
      'Trắng': 'Pure white, creating a clean and luxurious feeling',
      'Bạc': 'Metallic silver, showcasing modernity and high technology',
      'Xám': 'Gentle gray, suitable for all styles',
      'Xanh': 'Dynamic blue, reflecting environmental friendliness',
      'Đỏ': 'Striking red, expressing strength and determination',
      'Xanh dương': 'Fresh blue, creating a youthful feeling',
      'Vàng': 'Unique yellow, eye-catching and attention-grabbing',
      'Cam': 'Energetic orange, showing passion',
      'Tím': 'Luxurious purple, unique and noble',
      'Black': 'Elegant black, perfect for modern and sophisticated style',
      'White': 'Pure white, creating a clean and luxurious feeling',
      'Silver': 'Metallic silver, showcasing modernity and high technology',
      'Gray': 'Gentle gray, suitable for all styles',
      'Blue': 'Dynamic blue, reflecting environmental friendliness',
      'Red': 'Striking red, expressing strength and determination',
      'Yellow': 'Unique yellow, eye-catching and attention-grabbing',
      'Orange': 'Energetic orange, showing passion',
      'Purple': 'Luxurious purple, unique and noble'
    };
    return colorMap[colorName] || `Premium ${colorName} color with scratch-resistant protective coating`;
  };
  
  // Get color hex code for display
  const getColorHex = (colorName) => {
    const colorHexMap = {
      'Đen': '#1a1a1a',
      'Trắng': '#f5f5f5',
      'Bạc': '#c0c0c0',
      'Xám': '#808080',
      'Xanh': '#00a8ff',
      'Đỏ': '#e50914',
      'Xanh dương': '#0066cc',
      'Vàng': '#ffd700',
      'Cam': '#ff6600',
      'Tím': '#8b00ff',
      'Black': '#1a1a1a',
      'White': '#f5f5f5',
      'Silver': '#c0c0c0',
      'Gray': '#808080',
      'Grey': '#808080',
      'Blue': '#00a8ff',
      'Red': '#e50914',
      'Yellow': '#ffd700',
      'Orange': '#ff6600',
      'Purple': '#8b00ff'
    };
    return colorHexMap[colorName] || '#e50914';
  };
  
  // Get vehicle type for subtitle
  const vehicleTypeName = vehicle.vehicleType?.name || 'Sedan';

  // Handle share button click
  const handleShareClick = () => {
    setShowSharePopup(true);
    setCopied(false);
  };

  // Handle copy link
  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowSharePopup(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setShowSharePopup(false);
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Close popup when clicking outside
  const handleClosePopup = (e) => {
    if (e.target.classList.contains('share-popup-overlay')) {
      setShowSharePopup(false);
      setCopied(false);
    }
  };

  // Handle test drive modal
  const handleOpenTestDriveModal = () => {
    setShowTestDriveModal(true);
    setFormData({
      customerName: '',
      customerEmail: '',
      phoneNumber: '',
      carModel: vehicle?.modelName || '',
      dealerId: '',
      date: '',
      time: '07:00:00',
      note: ''
    });
    setFormErrors({});
    setSubmitSuccess(false);
  };

  const handleCloseTestDriveModal = () => {
    setShowTestDriveModal(false);
    setFormData({
      customerName: '',
      customerEmail: '',
      phoneNumber: '',
      carModel: vehicle?.modelName || '',
      dealerId: '',
      date: '',
      time: '07:00:00',
      note: ''
    });
    setFormErrors({});
    setSubmitSuccess(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) errors.customerName = 'Name is required';
    if (!formData.customerEmail.trim()) {
      errors.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = 'Invalid email format';
    }
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
    if (!formData.carModel.trim()) errors.carModel = 'Car model is required';
    if (!formData.dealerId) errors.dealerId = 'Please select a dealer';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.time) errors.time = 'Time is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitTestDrive = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      // Extract hour and minute from time (format: HH:mm:ss or HH:mm)
      const timeParts = formData.time ? formData.time.split(':') : ['07', '00'];
      const hour = timeParts[0] || '07';
      const minute = timeParts[1] || '00';
      
      // Combine date and time into ISO datetime string: "YYYY-MM-DDTHH:mm:ss.sssZ"
      const dateTimeString = `${formData.date}T${hour}:${minute}:00.000Z`;
      const requestTime = new Date(dateTimeString).toISOString();

      const testDriveData = {
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        carModel: formData.carModel.trim(),
        dealerId: parseInt(formData.dealerId, 10),
        date: formData.date,
        requestTime: requestTime,
        note: formData.note.trim() || ''
      };

      await customersAPI.bookTestDrive(testDriveData);
      setSubmitSuccess(true);
      setTimeout(() => {
        handleCloseTestDriveModal();
      }, 2000);
    } catch (err) {
      console.error('Error booking test drive:', err);
      setFormErrors({ submit: 'Failed to book test drive. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="details-page">
      <Navbar />

      <div className="details-container">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb">
          <span onClick={() => navigate('/')} className="breadcrumb-link">Home</span>
          <span className="breadcrumb-separator"> &gt; </span>
          <span onClick={() => navigate('/vehicles')} className="breadcrumb-link">Electric Vehicles</span>
          <span className="breadcrumb-separator"> &gt; </span>
          <span className="breadcrumb-current">{vehicle.modelName}</span>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="details-content">
          {/* Left Column - Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="details-image-section"
          >
            <div className="image-wrapper">
              <div className="neon-glow"></div>
              <div className="reflection-overlay"></div>
              {/* Status Badges */}
              <div className="status-badges">
                {isNew && (
                  <span className="status-badge badge-new">NEW</span>
                )}
                {status === 'AVAILABLE' && (
                  <span className="status-badge badge-available">Available</span>
                )}
              </div>
              <img src={currentImage} alt={vehicle.modelName} className="main-image" />
              {images.length > 1 && (
                <div className="image-thumbnails">
                  {images.slice(0, 4).map((img, index) => (
                    <motion.img
                      key={index}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      src={img}
                      alt={`${vehicle.modelName} ${index + 1}`}
                      className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Available Colors Section - below image, left side */}
            <div className="colors-section-left">
              <h3 className="colors-title-left">
                <span className="colors-title-text">Available</span>
                <span className="colors-title-highlight"> Colors</span>
              </h3>
              {colors.length > 0 ? (
                <div className="colors-grid-left">
                  {colors.map((color, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="color-item-left"
                    >
                      <span className="color-name-left">{color.toUpperCase()}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="no-colors-message-left">
                  <p>Color information is being updated.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Info Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="details-info-section"
          >
            {/* Vehicle Header */}
            <div className="vehicle-header">
              <h1 className="vehicle-title">{vehicle.modelName?.toUpperCase() || 'VEHICLE'}</h1>
              <p className="vehicle-subtitle">
                {brand && brand !== 'N/A' ? `${brand} ` : ''}Premium {vehicleTypeName} Electric Vehicle
              </p>
            </div>

            {/* Price Section */}
            <div className="price-section">
              <span className="price-value">{formattedPrice}</span>
            </div>

            {/* Key Specifications - 2 Column Grid */}
            <div className="key-specs-section">
              <h3 className="key-specs-title">KEY SPECIFICATIONS</h3>
              <div className="key-specs-grid">
                <div className="key-spec-item">
                  <div className="key-spec-icon">
                    <i className="bx bxs-battery"></i>
                  </div>
                  <div className="key-spec-content">
                    <span className="key-spec-label">RANGE</span>
                    <span className="key-spec-value">{formatRange(range)}</span>
                  </div>
                </div>
                <div className="key-spec-item">
                  <div className="key-spec-icon">
                    <i className="bx bxs-battery-charging"></i>
                  </div>
                  <div className="key-spec-content">
                    <span className="key-spec-label">BATTERY CAPACITY</span>
                    <span className="key-spec-value">{formatBatteryCapacity(batteryCapacity)}</span>
                  </div>
                </div>
                <div className="key-spec-item">
                  <div className="key-spec-icon">
                    <i className="bx bxs-car"></i>
                  </div>
                  <div className="key-spec-content">
                    <span className="key-spec-label">BRAND</span>
                    <span className="key-spec-value">{brand}</span>
                  </div>
                </div>
                <div className="key-spec-item">
                  <div className="key-spec-icon">
                    <i className="bx bxs-calendar"></i>
                  </div>
                  <div className="key-spec-content">
                    <span className="key-spec-label">YEAR</span>
                    <span className="key-spec-value">{formatYear(yearOfManufacture)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(229, 9, 20, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                className="btn-glow btn-test-drive"
                onClick={handleOpenTestDriveModal}
              >
                <i className="bx bx-calendar"></i>
                Book Test Drive
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(229, 9, 20, 0.8)' }}
                whileTap={{ scale: 0.95 }}
                className="btn-glow btn-order-now"
                onClick={() => navigate('/auth')}
              >
                <i className="bx bx-cart"></i>
                Order Now ( For Business )
              </motion.button>
            </div>

            {/* Interaction Buttons */}
            <div className="interaction-buttons">
              <button className="interaction-btn">
                <i className="bx bx-heart"></i>
                <span>Favorite</span>
              </button>
              <button className="interaction-btn">
                <i className="bx bx-bar-chart-alt-2"></i>
                <span>Compare</span>
              </button>
              <button className="interaction-btn" onClick={handleShareClick}>
                <i className="bx bx-share-alt"></i>
                <span>Share</span>
              </button>
            </div>

            {/* Live Consultation */}
            <div className="consultation-section">
              <div className="consultation-icon">
                <i className="bx bx-phone"></i>
              </div>
              <div className="consultation-content">
                <span className="consultation-label">Live Consultation</span>
                <span className="consultation-phone">1900 1234</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Version Section - from versionJson */}
        {versionData && (
          <div className="version-section">
            <h2 className="version-title">
              <span className="version-title-text">Vehicle</span>
              <span className="version-title-highlight"> Version</span>
            </h2>
            <div className="version-card">
              <div className="version-header">
                <div className="version-icon">
                  <i className="bx bxs-package"></i>
                </div>
                <div className="version-info">
                  <h3 className="version-name">
                    {versionName || 'Standard Package'}
                  </h3>
                  <p className="version-description">
                    {versionData.description || 'Standard package with all basic features'}
                  </p>
                </div>
              </div>
              {features.length > 0 && (
                <div className="version-features-list">
                  <h4 className="version-features-title">Package Features:</h4>
                  <ul className="features-list">
                    {features.map((feature, index) => (
                      <li key={index} className="feature-list-item">
                        <i className="bx bx-check"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Features Section - Original Static */}
        <div className="features-section">
          <h2 className="features-title">
            <span className="features-title-text">Key</span>
            <span className="features-title-highlight"> Features</span>
          </h2>
          <div className="features-grid">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="feature-card"
            >
              <div className="feature-icon">
                <div className="icon-background">
                  <i className="bx bx-check"></i>
                </div>
              </div>
              <h3 className="feature-title">AUTOPILOT</h3>
              <p className="feature-description">
                Advanced AI smart safety system
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="feature-card"
            >
              <div className="feature-icon">
                <div className="icon-background">
                  <i className="bx bx-check"></i>
                </div>
              </div>
              <h3 className="feature-title">HEATED SEATS</h3>
              <p className="feature-description">
                Premium comfort with adjustable temperature control
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="feature-card"
            >
              <div className="feature-icon">
                <div className="icon-background">
                  <i className="bx bx-check"></i>
                </div>
              </div>
              <h3 className="feature-title">5G CONNECTIVITY</h3>
              <p className="feature-description">
                High-speed internet connection and OTA updates
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Share Popup */}
      {showSharePopup && (
        <div className="share-popup-overlay" onClick={handleClosePopup}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="share-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-popup-header">
              <h3 className="share-popup-title">Share Vehicle</h3>
              <button 
                className="share-popup-close"
                onClick={() => {
                  setShowSharePopup(false);
                  setCopied(false);
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className="share-popup-content">
              <p className="share-popup-description">
                Copy the link below to share this vehicle:
              </p>
              <div className="share-popup-url">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="share-url-input"
                />
              </div>
              <button
                className={`share-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <i className="bx bx-check"></i>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <i className="bx bx-copy"></i>
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Test Drive Booking Modal */}
      <AnimatePresence>
        {showTestDriveModal && (
          <div className="test-drive-modal-overlay" onClick={handleCloseTestDriveModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.3 }}
              className="test-drive-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="test-drive-modal-header">
                <h2 className="test-drive-modal-title">
                  <i className="bx bx-calendar"></i>
                  Book Test Drive
                </h2>
                <button 
                  className="test-drive-modal-close"
                  onClick={handleCloseTestDriveModal}
                >
                  <i className="bx bx-x"></i>
                </button>
              </div>

              {submitSuccess ? (
                <div className="test-drive-success">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="success-icon"
                  >
                    <i className="bx bx-check-circle"></i>
                  </motion.div>
                  <h3>Booking Successful!</h3>
                  <p>Your test drive request has been submitted. We'll contact you soon.</p>
                </div>
              ) : (
                <form className="test-drive-form" onSubmit={handleSubmitTestDrive}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="customerName">
                        Full Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className={formErrors.customerName ? 'error' : ''}
                      />
                      {formErrors.customerName && (
                        <span className="error-message">{formErrors.customerName}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="customerEmail">
                        Email <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="customerEmail"
                        name="customerEmail"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className={formErrors.customerEmail ? 'error' : ''}
                      />
                      {formErrors.customerEmail && (
                        <span className="error-message">{formErrors.customerEmail}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phoneNumber">
                        Phone Number <span className="required">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className={formErrors.phoneNumber ? 'error' : ''}
                      />
                      {formErrors.phoneNumber && (
                        <span className="error-message">{formErrors.phoneNumber}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="carModel">
                        Car Model <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="carModel"
                        name="carModel"
                        value={formData.carModel}
                        onChange={handleInputChange}
                        placeholder="Car model"
                        className={formErrors.carModel ? 'error' : ''}
                      />
                      {formErrors.carModel && (
                        <span className="error-message">{formErrors.carModel}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="dealerId">
                        Dealer <span className="required">*</span>
                      </label>
                      <select
                        id="dealerId"
                        name="dealerId"
                        value={formData.dealerId}
                        onChange={handleInputChange}
                        className={formErrors.dealerId ? 'error' : ''}
                        disabled={loadingDealers}
                      >
                        <option value="">Select a dealer</option>
                        {dealers.map((dealer) => (
                          <option key={dealer.dealerId || dealer.id} value={dealer.dealerId || dealer.id}>
                            {dealer.dealerName} - {dealer.address || dealer.region || ''}
                          </option>
                        ))}
                      </select>
                      {loadingDealers && <span className="loading-text">Loading dealers...</span>}
                      {formErrors.dealerId && (
                        <span className="error-message">{formErrors.dealerId}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="date">
                        Date <span className="required">*</span>
                      </label>
                      <div className="date-picker-wrapper">
                        <input
                          type="date"
                          id="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          min={today}
                          className={formErrors.date ? 'error' : ''}
                          ref={dateInputRef}
                        />
                        <button
                          type="button"
                          className="date-picker-icon"
                          onClick={() => {
                            if (dateInputRef.current) {
                              if (typeof dateInputRef.current.showPicker === 'function') {
                                dateInputRef.current.showPicker();
                              } else {
                                dateInputRef.current.focus();
                              }
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              if (dateInputRef.current) {
                                if (typeof dateInputRef.current.showPicker === 'function') {
                                  dateInputRef.current.showPicker();
                                } else {
                                  dateInputRef.current.focus();
                                }
                              }
                            }
                          }}
                          aria-label="Open date picker"
                        >
                          <i className="bx bx-calendar"></i>
                        </button>
                      </div>
                      {formErrors.date && (
                        <span className="error-message">{formErrors.date}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="time">
                        Time <span className="required">*</span>
                      </label>
                      <div className="time-picker-wrapper">
                        <select
                          id="time-hour"
                          name="time-hour"
                          value={formData.time ? formData.time.split(':')[0] || '07' : '07'}
                          onChange={(e) => {
                            const hour = e.target.value.padStart(2, '0');
                            const minute = formData.time ? (formData.time.split(':')[1] || '00') : '00';
                            setFormData(prev => ({
                              ...prev,
                              time: `${hour}:${minute}:00`
                            }));
                            if (formErrors.time) {
                              setFormErrors(prev => ({
                                ...prev,
                                time: ''
                              }));
                            }
                          }}
                          className={formErrors.time ? 'error' : ''}
                        >
                          {Array.from({ length: 11 }, (_, i) => i + 7).map(hour => (
                            <option key={hour} value={hour.toString().padStart(2, '0')}>
                              {hour.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <span className="time-separator">:</span>
                        <select
                          id="time-minute"
                          name="time-minute"
                          value={formData.time ? formData.time.split(':')[1] || '00' : '00'}
                          onChange={(e) => {
                            const minute = e.target.value;
                            const hour = formData.time ? (formData.time.split(':')[0] || '07') : '07';
                            setFormData(prev => ({
                              ...prev,
                              time: `${hour}:${minute}:00`
                            }));
                            if (formErrors.time) {
                              setFormErrors(prev => ({
                                ...prev,
                                time: ''
                              }));
                            }
                          }}
                          className={formErrors.time ? 'error' : ''}
                        >
                          <option value="00">00</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                        </select>
                      </div>
                      {formErrors.time && (
                        <span className="error-message">{formErrors.time}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="note">Additional Notes (Optional)</label>
                    <textarea
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      placeholder="Any special requests or notes..."
                      rows="4"
                    />
                  </div>

                  {formErrors.submit && (
                    <div className="form-error-submit">{formErrors.submit}</div>
                  )}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={handleCloseTestDriveModal}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <i className="bx bx-loader-alt bx-spin"></i>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <i className="bx bx-calendar-check"></i>
                          Book Test Drive
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Details;

