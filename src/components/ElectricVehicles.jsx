import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import './ElectricVehicles.css';
import Footer from './Footer';
import Navbar from './Navbar';
import { vehiclesAPI } from '../utils/api/vehiclesAPI';

const ElectricVehicles = ({ loggedInUser, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedPrice, setSelectedPrice] = useState('Price Range');
  const [selectedBatteryCapacity, setSelectedBatteryCapacity] = useState('Battery Capacity');
  const [selectedType, setSelectedType] = useState('Vehicle Type');
  const [sortBy, setSortBy] = useState('Sort by: Newest');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch vehicles from API
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const data = await vehiclesAPI.getAll();
        setVehicles(data);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError('Failed to load vehicles');
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);


  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.modelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBrand = selectedBrand === 'All Brands' || vehicle.brand === selectedBrand;
    
    const matchesType = selectedType === 'Vehicle Type' || vehicle.vehicleType?.typeName === selectedType;
    
    // Price filter logic (VNĐ)
    let matchesPrice = true;
    if (selectedPrice !== 'Price Range') {
      const price = vehicle.listedPrice || 0;
      switch (selectedPrice) {
        case 'Under 10.000.000':
          matchesPrice = price < 10000000;
          break;
        case '10.000.000 - 100.000.000':
          matchesPrice = price >= 10000000 && price <= 100000000;
          break;
        case '100.000.000 - 1.000.000.000':
          matchesPrice = price >= 100000000 && price <= 1000000000;
          break;
        case 'Over 1.000.000.000':
          matchesPrice = price > 1000000000;
          break;
        default:
          matchesPrice = true;
      }
    }
    
    // Battery capacity filter logic
    let matchesBatteryCapacity = true;
    if (selectedBatteryCapacity !== 'Battery Capacity') {
      const capacity = vehicle.specifications?.battery?.capacity_kWh || 0;
      switch (selectedBatteryCapacity) {
        case 'Under 150kWh':
          matchesBatteryCapacity = capacity < 150;
          break;
        case '150-300kWh':
          matchesBatteryCapacity = capacity >= 150 && capacity < 300;
          break;
        case '300-500kWh':
          matchesBatteryCapacity = capacity >= 300 && capacity < 500;
          break;
        case 'Over 500kWh':
          matchesBatteryCapacity = capacity >= 500;
          break;
        default:
          matchesBatteryCapacity = true;
      }
    }
    
    return matchesSearch && matchesBrand && matchesType && matchesPrice && matchesBatteryCapacity;
  });

  // Get unique brands from API
  const uniqueBrands = [...new Set(vehicles.map(v => v.brand).filter(Boolean))];
  
  // Get unique vehicle types from API
  const uniqueVehicleTypes = [...new Set(vehicles.map(v => v.vehicleType?.typeName).filter(Boolean))];

  // Sort vehicles based on selected sort option
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortBy) {
      case 'Sort by: Price Low to High':
        return (a.listedPrice || 0) - (b.listedPrice || 0);
      case 'Sort by: Price High to Low':
        return (b.listedPrice || 0) - (a.listedPrice || 0);
      case 'Sort by: Battery Range':
        return (b.specifications?.battery?.range_km || 0) - (a.specifications?.battery?.range_km || 0);
      case 'Sort by: Newest':
      default:
        return new Date(b.yearOfManufacture || 0) - new Date(a.yearOfManufacture || 0);
    }
  });

  return (
    <div className="electric-vehicles-page">
      {/* Navbar */}
      <Navbar loggedInUser={loggedInUser} onLogout={onLogout} />

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
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <select 
              className={`filter-select ${selectedPrice !== 'Price Range' ? 'filter-active' : ''}`} 
              value={selectedPrice} 
              onChange={(e) => setSelectedPrice(e.target.value)}
            >
              <option value="Price Range">Price Range</option>
              <option value="Under 10.000.000">Under 10.000.000</option>
              <option value="10.000.000 - 100.000.000">10.000.000 - 100.000.000</option>
              <option value="100.000.000 - 1.000.000.000">100.000.000 - 1.000.000.000</option>
              <option value="Over 1.000.000.000">Over 1.000.000.000</option>
            </select>
            <select 
              className={`filter-select ${selectedBatteryCapacity !== 'Battery Capacity' ? 'filter-active' : ''}`} 
              value={selectedBatteryCapacity} 
              onChange={(e) => setSelectedBatteryCapacity(e.target.value)}
            >
              <option value="Battery Capacity">Battery Capacity</option>
              <option value="Under 150kWh">Under 150kWh</option>
              <option value="150-300kWh">150-300kWh</option>
              <option value="300-500kWh">300-500kWh</option>
              <option value="Over 500kWh">Over 500kWh</option>
            </select>
            <select 
              className={`filter-select ${selectedType !== 'Vehicle Type' ? 'filter-active' : ''}`} 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="Vehicle Type">Vehicle Type</option>
              {uniqueVehicleTypes.map(typeName => (
                <option key={typeName} value={typeName}>{typeName}</option>
              ))}
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
          {loading ? (
            <div className="loading-message">Loading vehicles...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : vehicles.length === 0 ? (
            <div className="no-vehicles-message">No vehicles available</div>
          ) : (
            sortedVehicles.map((vehicle, index) => {
              // Get the first image from specifications.images array
              const vehicleImage = vehicle.specifications?.images?.[0] || '/images/image.jpg';
              const range = vehicle.specifications?.battery?.range_km || 0;
              const capacity_kWh = vehicle.specifications?.battery?.capacity_kWh || 0;
              const price = vehicle.listedPrice ? `$${vehicle.listedPrice.toLocaleString()}` : 'Price TBD';
              const status = vehicle.status || 'Available';
              const statusColor = status.toLowerCase().replace(/\s+/g, '').replace(/_/g, '_');
              
              return (
                <motion.div
                  key={vehicle.id || index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="vehicle-card"
                >
                  <div className="vehicle-image-container">
                    <div className={`vehicle-status ${statusColor}`}>{status}</div>
                    <img src={vehicleImage} alt={vehicle.modelName} className="vehicle-image" />
                  </div>
                  <div className="vehicle-info">
                    <h3 className="vehicle-name">{vehicle.modelName}</h3>
                    <p className="vehicle-description">{vehicle.brand} {vehicle.yearOfManufacture}, {range}km range</p>
                    <div className="vehicle-specs">
                      <span className="spec-item">
                        <i className="bx bxs-battery"></i> {range}km
                      </span>
                      <span className="spec-item">
                        <i className="bx bxs-bolt"></i> {capacity_kWh} kWh
                      </span>
                    </div>
                    <div className="vehicle-price">{price}</div>
                    <button className="btn-details" onClick={() => navigate(`/details/${vehicle.id}`)}>Details</button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ElectricVehicles;

