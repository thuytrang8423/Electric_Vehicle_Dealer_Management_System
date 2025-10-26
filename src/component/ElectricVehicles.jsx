import { useState } from 'react';
import { motion } from 'framer-motion';
import 'boxicons/css/boxicons.min.css';
import './ElectricVehicles.css';

const ElectricVehicles = ({ onNavigateHome }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedPrice, setSelectedPrice] = useState('All Prices');
  const [selectedRange, setSelectedRange] = useState('All Battery Ranges');
  const [selectedType, setSelectedType] = useState('All Types');

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
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrand === 'All Brands' || vehicle.brand === selectedBrand;
    const matchesType = selectedType === 'All Types' || vehicle.type === selectedType;
    return matchesSearch && matchesBrand && matchesType;
  });

  return (
    <div className="electric-vehicles-page">
      {/* Navbar */}
      <nav className={`navbar ${false ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo" onClick={onNavigateHome} style={{ cursor: 'pointer' }}>
            <span className="logo-text">EVM</span>
          </div>
          <ul className="nav-menu">
            <li className="nav-item" onClick={onNavigateHome} style={{ cursor: 'pointer' }}>Home</li>
            <li className="nav-item active">Electric Vehicles</li>
            <li className="nav-item">Technology</li>
            <li className="nav-item">Dealer</li>
            <li className="nav-item">Contact</li>
          </ul>
          <div className="nav-buttons">
            <button className="btn-login">Login</button>
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
            <select className="filter-select" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
              <option>All Brands</option>
              <option>EVM</option>
            </select>
            <select className="filter-select" value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value)}>
              <option>Price Range</option>
              <option>Under $200k</option>
              <option>$200k - $350k</option>
              <option>$350k - $500k</option>
              <option>Over $500k</option>
            </select>
            <select className="filter-select" value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)}>
              <option>Battery Range</option>
              <option>Under 500km</option>
              <option>500km - 600km</option>
              <option>Over 600km</option>
            </select>
            <select className="filter-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option>Vehicle Type</option>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Sport</option>
              <option>City</option>
            </select>
          </div>
        </motion.div>
      </div>

      {/* Vehicle Grid */}
      <section className="vehicles-grid-section">
        <div className="results-header">
          <h2 className="results-count">Found {filteredVehicles.length} electric vehicles</h2>
          <select className="sort-select">
            <option>Sort by: Newest</option>
            <option>Sort by: Price Low to High</option>
            <option>Sort by: Price High to Low</option>
            <option>Sort by: Battery Range</option>
          </select>
        </div>

        <div className="vehicles-grid">
          {filteredVehicles.map((vehicle, index) => (
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
    </div>
  );
};

export default ElectricVehicles;

