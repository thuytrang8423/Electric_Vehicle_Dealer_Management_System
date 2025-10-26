import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import 'boxicons/css/boxicons.min.css';
import './ElectricVehicles.css';
import Footer from './Footer';

const ElectricVehicles = ({ onNavigateHome, onNavigateAuth }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedPrice, setSelectedPrice] = useState('Price Range');
  const [selectedRange, setSelectedRange] = useState('Battery Range');
  const [selectedType, setSelectedType] = useState('Vehicle Type');
  const [sortBy, setSortBy] = useState('Sort by: Newest');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const vehicles = [
    {
      name: 'EVM Sedan Pro',
      image: '/images/honda-dien_thanhnien-2_WXZA.jpg',
      brand: 'EVM',
      type: 'Sedan',
      description: 'Premium electric sedan',
      range: '650km range',
      price: '$280,000',
      battery: '650km',
      status: 'New',
      statusColor: 'new'
    },
    {
      name: 'EVM SUV Max',
      image: '/images/vinfast-vf8-18.jpg',
      brand: 'EVM',
      type: 'SUV',
      description: '7-seat electric SUV',
      range: '580km range',
      price: '$320,000',
      battery: '580km',
      status: 'Available',
      statusColor: 'available'
    },
    {
      name: 'EVM Sport GT',
      image: '/images/xe-o-to-dien-dau-tien-cua-nuoc-phap.jpg',
      brand: 'EVM',
      type: 'Sport',
      description: 'Sports coupe',
      range: '0-100km/h in 3.2s',
      price: '$450,000',
      battery: '520km',
      status: 'Pre-order',
      statusColor: 'preorder'
    },
    {
      name: 'EVM City Mini',
      image: '/images/image.jpg',
      brand: 'EVM',
      type: 'City',
      description: 'Compact city car',
      range: '450km range',
      price: '$150,000',
      battery: '450km',
      status: 'Promotion',
      statusColor: 'promotion'
    }
  ];

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBrand = selectedBrand === 'All Brands' || vehicle.brand === selectedBrand;
    
    const matchesType = selectedType === 'Vehicle Type' || vehicle.type === selectedType;
    
    // Price filter logic
    let matchesPrice = true;
    if (selectedPrice !== 'Price Range') {
      const price = parseFloat(vehicle.price.replace(/[$,]/g, ''));
      switch (selectedPrice) {
        case 'Under $200k':
          matchesPrice = price < 200000;
          break;
        case '$200k - $350k':
          matchesPrice = price >= 200000 && price <= 350000;
          break;
        case '$350k - $500k':
          matchesPrice = price >= 350000 && price <= 500000;
          break;
        case 'Over $500k':
          matchesPrice = price > 500000;
          break;
        default:
          matchesPrice = true;
      }
    }
    
    // Battery range filter logic
    let matchesRange = true;
    if (selectedRange !== 'Battery Range') {
      const range = parseInt(vehicle.battery);
      switch (selectedRange) {
        case 'Under 500km':
          matchesRange = range < 500;
          break;
        case '500km - 600km':
          matchesRange = range >= 500 && range <= 600;
          break;
        case 'Over 600km':
          matchesRange = range > 600;
          break;
        default:
          matchesRange = true;
      }
    }
    
    return matchesSearch && matchesBrand && matchesType && matchesPrice && matchesRange;
  });

  // Sort vehicles based on selected sort option
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortBy) {
      case 'Sort by: Price Low to High':
        return parseFloat(a.price.replace(/[$,]/g, '')) - parseFloat(b.price.replace(/[$,]/g, ''));
      case 'Sort by: Price High to Low':
        return parseFloat(b.price.replace(/[$,]/g, '')) - parseFloat(a.price.replace(/[$,]/g, ''));
      case 'Sort by: Battery Range':
        return parseInt(b.battery) - parseInt(a.battery);
      case 'Sort by: Newest':
      default:
        return 0; // Keep original order
    }
  });

  return (
    <div className="electric-vehicles-page">
      {/* Navbar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo" onClick={onNavigateHome} style={{ cursor: 'pointer' }}>
            <span className="logo-text">EVM</span>
          </div>
          <ul className="nav-menu">
            <li className="nav-item" onClick={() => { onNavigateHome(); window.scrollTo(0, 0); }} style={{ cursor: 'pointer' }}>Home</li>
            <li className="nav-item active">Electric Vehicles</li>
            <li className="nav-item" onClick={() => window.scrollTo(0, 0)} style={{ cursor: 'pointer' }}>Technology</li>
            <li className="nav-item" onClick={() => window.scrollTo(0, 0)} style={{ cursor: 'pointer' }}>Dealer</li>
            <li className="nav-item" onClick={() => window.scrollTo(0, 0)} style={{ cursor: 'pointer' }}>Contact</li>
          </ul>
          <div className="nav-buttons">
            <button className="btn-login" onClick={onNavigateAuth}>Login</button>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="page-header">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="header-content"
        >
          <h1 className="page-title">
            Discover <span className="highlight-text">EVM Electric Vehicles</span>
          </h1>
          <p className="page-subtitle">
            Search and compare electric vehicle models suitable for you
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="search-filter-section"
        >
          <div className="search-bar-container">
            <i className="bx bx-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search vehicles by name, brand, price..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn-search">Search</button>
          </div>

          <div className="filter-container">
            <select 
              className={`filter-select ${selectedBrand !== 'All Brands' ? 'filter-active' : ''}`} 
              value={selectedBrand} 
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option>All Brands</option>
              <option>EVM</option>
            </select>
            <select 
              className={`filter-select ${selectedPrice !== 'Price Range' ? 'filter-active' : ''}`} 
              value={selectedPrice} 
              onChange={(e) => setSelectedPrice(e.target.value)}
            >
              <option value="Price Range">Price Range</option>
              <option value="Under $200k">Under $200k</option>
              <option value="$200k - $350k">$200k - $350k</option>
              <option value="$350k - $500k">$350k - $500k</option>
              <option value="Over $500k">Over $500k</option>
            </select>
            <select 
              className={`filter-select ${selectedRange !== 'Battery Range' ? 'filter-active' : ''}`} 
              value={selectedRange} 
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              <option value="Battery Range">Battery Range</option>
              <option value="Under 500km">Under 500km</option>
              <option value="500km - 600km">500km - 600km</option>
              <option value="Over 600km">Over 600km</option>
            </select>
            <select 
              className={`filter-select ${selectedType !== 'Vehicle Type' ? 'filter-active' : ''}`} 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="Vehicle Type">Vehicle Type</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Sport">Sport</option>
              <option value="City">City</option>
            </select>
          </div>
        </motion.div>
      </div>

      {/* Vehicle Grid */}
      <section className="vehicles-grid-section">
        <div className="results-header">
          <h2 className="results-count">Found <span className="results-number">{filteredVehicles.length}</span> electric vehicles</h2>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="Sort by: Newest">Sort by: Newest</option>
            <option value="Sort by: Price Low to High">Sort by: Price Low to High</option>
            <option value="Sort by: Price High to Low">Sort by: Price High to Low</option>
            <option value="Sort by: Battery Range">Sort by: Battery Range</option>
          </select>
        </div>

        <div className="vehicles-grid">
          {sortedVehicles.map((vehicle, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="vehicle-card"
            >
              <div className="vehicle-image-container">
                <div className={`vehicle-status ${vehicle.statusColor}`}>{vehicle.status}</div>
                <img src={vehicle.image} alt={vehicle.name} className="vehicle-image" />
              </div>
              <div className="vehicle-info">
                <h3 className="vehicle-name">{vehicle.name}</h3>
                <p className="vehicle-description">{vehicle.description}, {vehicle.range}</p>
                <div className="vehicle-specs">
                  <span className="spec-item">
                    <i className="bx bxs-battery"></i> {vehicle.battery}
                  </span>
                  <span className="spec-item">
                    <i className="bx bxs-bolt"></i> 18 min
                  </span>
                </div>
                <div className="vehicle-price">{vehicle.price}</div>
                <button className="btn-details">Details</button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ElectricVehicles;

