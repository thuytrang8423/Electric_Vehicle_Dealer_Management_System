import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import 'boxicons/css/boxicons.min.css';
import './Dealers.css';
import Footer from './Footer';
import Navbar from './Navbar';
import { dealersAPI } from '../utils/api/dealersAPI';

const Dealer = ({ loggedInUser, onLogout }) => {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [sortBy, setSortBy] = useState('Sort by: Newest');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch dealers from API
  useEffect(() => {
    const fetchDealers = async () => {
      try {
        setLoading(true);
        const data = await dealersAPI.getAll();
        setDealers(data);
      } catch (err) {
        console.error('Error fetching dealers:', err);
        setError('Failed to load dealers');
        setDealers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDealers();
  }, []);

  // Filter dealers
  const filteredDealers = dealers.filter(dealer => {
    const matchesSearch = dealer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dealer.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dealer.region?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = selectedRegion === 'All Regions' || dealer.region === selectedRegion;
    
    const matchesStatus = selectedStatus === 'All Status' || dealer.status === selectedStatus;
    
    return matchesSearch && matchesRegion && matchesStatus;
  });

  // Get unique regions for filter
  const uniqueRegions = [...new Set(dealers.map(d => d.region).filter(Boolean))];

  // Sort dealers
  const sortedDealers = [...filteredDealers].sort((a, b) => {
    switch (sortBy) {
      case 'Sort by: Name A-Z':
        return (a.name || '').localeCompare(b.name || '');
      case 'Sort by: Name Z-A':
        return (b.name || '').localeCompare(a.name || '');
      case 'Sort by: Newest':
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  return (
    <div className="dealers-page">
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
            Our <span className="highlight-text">Dealer Network</span>
          </h1>
          <p className="page-subtitle">
            Find authorized EVM dealers near you for sales, service, and support
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
              placeholder="Search dealers by name, address, region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn-search">Search</button>
          </div>

          <div className="filter-container">
            <select 
              className={`filter-select ${selectedRegion !== 'All Regions' ? 'filter-active' : ''}`} 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option>All Regions</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <select 
              className={`filter-select ${selectedStatus !== 'All Status' ? 'filter-active' : ''}`} 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </motion.div>
      </div>

      {/* Dealers Grid */}
      <section className="dealers-grid-section">
        <div className="results-header">
          <h2 className="results-count">
            Found <span className="results-number">{sortedDealers.length}</span> authorized dealers
          </h2>
          <select 
            className="sort-select"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Sort by: Newest">Sort by: Newest</option>
            <option value="Sort by: Name A-Z">Sort by: Name A-Z</option>
            <option value="Sort by: Name Z-A">Sort by: Name Z-A</option>
          </select>
        </div>

        <div className="dealers-grid">
          {loading ? (
            <div className="loading-message">Loading dealers...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : sortedDealers.length === 0 ? (
            <div className="no-dealers-message">No dealers available</div>
          ) : (
            sortedDealers.map((dealer, index) => {
              const status = dealer.status || 'ACTIVE';
              const getStatusClass = () => {
                if (status === 'ACTIVE') return 'active';
                if (status === 'SUSPENDED') return 'suspended';
                return 'inactive';
              };
              
              return (
                <motion.div
                  key={dealer.dealerId || index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="dealer-card"
                >
                  <div className="dealer-card-header">
                    <div className="dealer-icon">
                      <i className="bx bx-store"></i>
                    </div>
                    <div className={`dealer-status ${getStatusClass()}`}>
                      {status}
                    </div>
                  </div>
                  
                  <div className="dealer-info">
                    <h3 className="dealer-name">{dealer.name || 'Dealer Name'}</h3>
                    
                    <div className="dealer-details">
                      <div className="dealer-detail-item">
                        <i className="bx bx-map"></i>
                        <span className="detail-label">Address:</span>
                        <span className="detail-value">{dealer.address || 'N/A'}</span>
                      </div>
                      
                      <div className="dealer-detail-item">
                        <i className="bx bx-phone"></i>
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{dealer.phone || 'N/A'}</span>
                      </div>
                      
                      <div className="dealer-detail-item">
                        <i className="bx bx-user"></i>
                        <span className="detail-label">Representative:</span>
                        <span className="detail-value">{dealer.representativeName || 'N/A'}</span>
                      </div>
                      
                      <div className="dealer-detail-item">
                        <i className="bx bx-map-pin"></i>
                        <span className="detail-label">Region:</span>
                        <span className="detail-value">{dealer.region || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dealer-actions">
                    <button
                      className="btn-contact-dealer"
                      onClick={() => {
                        const dealerId = dealer.dealerId || dealer.id || index;
                        navigate(`/detail-dealer/${dealerId}`, { state: { dealer } });
                      }}
                    >
                      <i className="bx bx-comment-dots"></i>
                      Feedback
                    </button>
                    <button 
                      className="btn-view-details"
                      onClick={() => {
                        const address = dealer.address || '';
                        if (address && address !== 'N/A') {
                          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                          window.open(googleMapsUrl, '_blank');
                        }
                      }}
                    >
                      <i className="bx bx-map"></i>
                      View Map
                    </button>
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

export default Dealer;
