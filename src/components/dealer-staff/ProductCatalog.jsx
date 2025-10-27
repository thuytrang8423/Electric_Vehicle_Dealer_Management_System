import React, { useState, useCallback, useEffect } from 'react';
import { showSuccessToast, showInfoToast, showErrorToast } from '../../utils/toast';
import { vehiclesAPI } from '../../utils/api/vehiclesAPI';
import 'boxicons/css/boxicons.min.css';

const ProductCatalog = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [processingClick, setProcessingClick] = useState(new Set());
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  // Fetch vehicles from API
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vehiclesAPI.getAll();
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showErrorToast('Failed to load vehicles');
      // Fallback to empty array
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch vehicle types from API
  const fetchVehicleTypes = useCallback(async () => {
    try {
      const data = await vehiclesAPI.getAllTypes();
      // Filter to only include active vehicle types
      const activeTypes = (data || []).filter(type => type.status === 'true');
      setVehicleTypes(activeTypes);
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      showErrorToast('Failed to load vehicle types');
      setVehicleTypes([]);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchVehicleTypes();
  }, [fetchVehicles, fetchVehicleTypes]);

  const promotions = [
    { vehicleId: 1, discount: '5%', endDate: '2024-02-01' },
    { vehicleId: 3, discount: '10%', endDate: '2024-01-31' }
  ];

  const getPromotion = (vehicleId) => {
    return promotions.find(p => p.vehicleId === vehicleId);
  };

  const toggleCompare = useCallback((vehicleId, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Prevent duplicate calls
    if (processingClick.has(vehicleId)) {
      return;
    }
    
    setProcessingClick(prev => new Set(prev).add(vehicleId));
    
    const vehicle = vehicles.find(v => v.id === vehicleId);
    setSelectedModels(prev => {
      const isSelected = prev.includes(vehicleId);
      if (isSelected) {
        showInfoToast(`Removed ${vehicle?.name} from comparison`);
        return prev.filter(id => id !== vehicleId);
      } else {
        showSuccessToast(`Added ${vehicle?.name} to comparison`);
        return [...prev, vehicleId];
      }
    });
    
    // Clear the processing flag after a short delay
    setTimeout(() => {
      setProcessingClick(prev => {
        const newSet = new Set(prev);
        newSet.delete(vehicleId);
        return newSet;
      });
    }, 100);
  }, [vehicles, processingClick]);

  const handleCompareClick = () => {
    if (selectedModels.length >= 2) {
      setShowCompareModal(true);
      showInfoToast(`Comparing ${selectedModels.length} vehicles`);
    }
  };

  // Transform API data to match VehicleManagement fields
  const transformedVehicles = vehicles.map(vehicle => {
    // Parse versions and colors from JSON (same as VehicleManagement)
    let versions = ['Standard'];
    let colors = ['White', 'Black'];
    
    try {
      if (vehicle.versionJson) {
        const versionData = JSON.parse(vehicle.versionJson);
        versions = Array.isArray(versionData.features) ? versionData.features : ['Standard'];
      }
    } catch (e) {
      console.warn('Error parsing versionJson:', e);
    }
    
    try {
      if (vehicle.availableColorsJson) {
        colors = JSON.parse(vehicle.availableColorsJson);
      }
    } catch (e) {
      console.warn('Error parsing availableColorsJson:', e);
    }

    // Find vehicle type name from vehicleTypes array
    const vehicleTypeName = vehicleTypes.find(type => type.id === vehicle.vehicleType?.id)?.typeName || 
                           vehicle.vehicleType?.typeName || 
                           vehicle.vehicleType || 
                           'Unknown Type';

    return {
      id: vehicle.id,
      name: vehicle.modelName || 'Unknown Model',
      price: vehicle.listedPrice || 0,
      battery: vehicle.batteryCapacity ? `${vehicle.batteryCapacity} kWh` : 'N/A',
      image: vehicle.specifications?.images?.[0] || '/images/image.jpg',
      brand: vehicle.brand || 'Unknown Brand',
      year: vehicle.yearOfManufacture || new Date().getFullYear(),
      status: vehicle.status || 'AVAILABLE',
      vehicleType: vehicleTypeName,
      versions: versions,
      colors: colors
    };
  });

  const filteredVehicles = transformedVehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedVehicles = transformedVehicles.filter(v => selectedModels.includes(v.id));

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Vehicle Catalog</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg)', borderRadius: 'var(--radius)', padding: '4px' }}>
              <button
                className="btn"
                onClick={() => setViewMode('grid')}
                style={{ background: viewMode === 'grid' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'grid' ? 'white' : 'var(--color-text)' }}
              >
                <i className="bx bx-grid-alt"></i>
              </button>
              <button
                className="btn"
                onClick={() => setViewMode('list')}
                style={{ background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'list' ? 'white' : 'var(--color-text)' }}
              >
                <i className="bx bx-list-ul"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--color-primary)' }}></i>
            <div style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Loading vehicles...</div>
          </div>
        )}

        {/* Content when not loading */}
        {!loading && (
          <>
            {/* Search */}
            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: '14px'
                  }}
                />
              </div>
              {selectedModels.length >= 2 && (
                <button 
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={handleCompareClick}
                >
                  <i className="bx bx-bar-chart-alt-2"></i>
                  Compare {selectedModels.length} models
                </button>
              )}
            </div>

        {/* Vehicle Grid */}
        {viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {filteredVehicles.map(vehicle => {
              const promo = getPromotion(vehicle.id);
              return (
                <div key={vehicle.id} style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  // Prevent any default card click behavior
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  {/* Vehicle Image */}
                  <div style={{ 
                    height: '180px', 
                    background: 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-surface) 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={vehicle.image} 
                      alt={vehicle.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      background: 'var(--color-bg)'
                    }}>
                      <i className="bx bx-car" style={{ fontSize: '48px', color: 'var(--color-text-muted)' }}></i>
                    </div>
                    
                    {/* Compare Button */}
                    <button
                      onClick={(e) => toggleCompare(vehicle.id, e)}
                      disabled={processingClick.has(vehicle.id)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: selectedModels.includes(vehicle.id) ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.3)',
                        background: selectedModels.includes(vehicle.id) ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)',
                        color: 'white',
                        cursor: processingClick.has(vehicle.id) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        transition: 'all 0.2s ease',
                        opacity: processingClick.has(vehicle.id) ? 0.6 : 1
                      }}
                    >
                      <i className="bx bx-check"></i>
                    </button>

                    {/* Promotion Badge */}
                    {promo && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        padding: '6px 12px',
                        background: 'var(--color-warning)',
                        borderRadius: 'var(--radius)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        {promo.discount} OFF
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '16px' }} onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
                      {vehicle.name}
                    </h3>
                    
                    <div style={{ marginBottom: '12px', fontSize: '20px', fontWeight: '700', color: 'var(--color-primary)' }}>
                      {vehicle.price.toLocaleString('vi-VN')} VND
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bx bx-battery" style={{ fontSize: '12px' }}></i>
                        {vehicle.battery}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bx bx-category" style={{ fontSize: '12px' }}></i>
                        {vehicle.vehicleType}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bx bx-calendar" style={{ fontSize: '12px' }}></i>
                        {vehicle.year}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bx bx-check-circle" style={{ fontSize: '12px' }}></i>
                        {vehicle.status.replace('_', ' ')}
                      </div>
                    </div>
                    
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        showSuccessToast(`${vehicle.name} added to quote`);
                      }}
                    >
                      <i className="bx bx-cart-add"></i>
                      Add to Quote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredVehicles.map(vehicle => {
              const promo = getPromotion(vehicle.id);
              return (
                <div key={vehicle.id} style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div style={{ 
                    width: '120px', 
                    height: '80px', 
                    background: 'var(--color-bg)', 
                    borderRadius: 'var(--radius)', 
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <img 
                      src={vehicle.image} 
                      alt={vehicle.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      background: 'var(--color-bg)'
                    }}>
                      <i className="bx bx-car" style={{ fontSize: '32px', color: 'var(--color-text-muted)' }}></i>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>{vehicle.name}</h3>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {vehicle.price.toLocaleString('vi-VN')} VND
                      </div>
                    </div>
                    {promo && (
                      <div style={{ marginBottom: '8px', padding: '4px 12px', background: 'var(--color-warning)', borderRadius: 'var(--radius)', color: 'white', fontSize: '12px', fontWeight: '600', display: 'inline-block' }}>
                        {promo.discount} OFF
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      <div><i className="bx bx-battery" style={{ marginRight: '4px' }}></i> {vehicle.battery}</div>
                      <div><i className="bx bx-category" style={{ marginRight: '4px' }}></i> {vehicle.vehicleType}</div>
                      <div><i className="bx bx-calendar" style={{ marginRight: '4px' }}></i> {vehicle.year}</div>
                      <div><i className="bx bx-check-circle" style={{ marginRight: '4px' }}></i> {vehicle.status.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={(e) => toggleCompare(vehicle.id, e)}
                      disabled={processingClick.has(vehicle.id)}
                      className={`btn ${selectedModels.includes(vehicle.id) ? 'btn-primary' : 'btn-outline'}`}
                      style={{ 
                        minWidth: '100px',
                        opacity: processingClick.has(vehicle.id) ? 0.6 : 1,
                        cursor: processingClick.has(vehicle.id) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <i className="bx bx-check"></i>
                      Compare
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ minWidth: '100px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        showSuccessToast(`${vehicle.name} added to quote`);
                      }}
                    >
                      <i className="bx bx-cart-add"></i>
                      Add to Quote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredVehicles.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
            <div>No vehicles found</div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Comparison Modal */}
      {showCompareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }} onClick={() => setShowCompareModal(false)}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            maxWidth: selectedVehicles.length <= 2 ? '75vw' : '90vw',
            maxHeight: '90vh',
            width: selectedVehicles.length <= 2 ? 'auto' : '100%',
            minWidth: selectedVehicles.length <= 2 ? '700px' : '600px',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              padding: selectedVehicles.length <= 2 ? '24px' : '24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-bg)'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>
                Compare Vehicles
              </h2>
              <button
                onClick={() => setShowCompareModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: '24px',
                  padding: '8px',
                  borderRadius: 'var(--radius)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--color-error)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--color-text-muted)';
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: selectedVehicles.length <= 2 ? '24px' : '24px' }}>
              {selectedVehicles.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'var(--color-text-muted)'
                }}>
                  <i className="bx bx-car" style={{ 
                    fontSize: '64px', 
                    marginBottom: '20px', 
                    opacity: 0.5,
                    color: 'var(--color-primary)'
                  }}></i>
                  <h3 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    color: 'var(--color-text)' 
                  }}>
                    No vehicles to compare
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    color: 'var(--color-text-muted)',
                    lineHeight: '1.5'
                  }}>
                    Select at least 2 vehicles from the catalog to start comparing their specifications.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    minWidth: selectedVehicles.length <= 2 ? '600px' : '600px'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        <th style={{ 
                          padding: '16px', 
                          textAlign: 'left', 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: 'var(--color-text)',
                          background: 'var(--color-bg)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1
                        }}>
                          Specification
                        </th>
                        {selectedVehicles.map(v => (
                          <th key={v.id} style={{ 
                            padding: '16px', 
                            textAlign: 'center', 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            color: 'var(--color-text)',
                            background: 'var(--color-bg)',
                            minWidth: selectedVehicles.length <= 2 ? '250px' : '200px'
                          }}>
                            <div style={{ marginBottom: '12px' }}>
                              <img 
                                src={v.image} 
                                alt={v.name}
                                style={{
                                  width: selectedVehicles.length <= 2 ? '150px' : '120px',
                                  height: selectedVehicles.length <= 2 ? '100px' : '80px',
                                  objectFit: 'cover',
                                  borderRadius: 'var(--radius)',
                                  marginBottom: '8px'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div style={{
                                display: 'none',
                                width: selectedVehicles.length <= 2 ? '150px' : '120px',
                                height: selectedVehicles.length <= 2 ? '100px' : '80px',
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '8px'
                              }}>
                                <i className="bx bx-car" style={{ fontSize: '32px', color: 'var(--color-text-muted)' }}></i>
                              </div>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                              {v.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {v.brand} • {v.year}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ 
                          padding: '16px', 
                          fontWeight: '600', 
                          background: 'var(--color-bg)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1
                        }}>
                          Price
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v.id} style={{ 
                            padding: '16px', 
                            textAlign: 'center',
                            fontSize: '18px',
                            fontWeight: '700',
                            color: 'var(--color-primary)'
                          }}>
                            {v.price.toLocaleString('vi-VN')} VND
                          </td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          background: 'var(--color-bg)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1
                        }}>
                          Battery Capacity
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v.id} style={{ padding: '16px', textAlign: 'center' }}>{v.battery}</td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          background: 'var(--color-bg)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1
                        }}>
                          Vehicle Type
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v.id} style={{ padding: '16px', textAlign: 'center' }}>{v.vehicleType}</td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          background: 'var(--color-bg)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1
                        }}>
                          Available Versions
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v.id} style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {v.versions.map((version, idx) => (
                                <span key={idx} style={{
                                  padding: '2px 8px',
                                  background: 'var(--color-surface)',
                                  borderRadius: 'var(--radius)',
                                  fontSize: '12px',
                                  color: 'var(--color-text)'
                                }}>
                                  {version}
                                </span>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          background: 'var(--color-bg)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1
                        }}>
                          Available Colors
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v.id} style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {v.colors.map((color, idx) => (
                                <span key={idx} style={{
                                  padding: '2px 8px',
                                  background: 'var(--color-surface)',
                                  borderRadius: 'var(--radius)',
                                  fontSize: '12px',
                                  color: 'var(--color-text)'
                                }}>
                                  {color}
                                </span>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          background: 'var(--color-bg)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1
                        }}>
                          Battery Capacity (kWh)
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v.id} style={{ padding: '16px', textAlign: 'center' }}>{v.battery}</td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          background: 'var(--color-bg)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1
                        }}>
                          Year of Manufacture
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v.id} style={{ padding: '16px', textAlign: 'center' }}>{v.year}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: selectedVehicles.length <= 2 ? '20px 24px' : '20px 24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-bg)'
            }}>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                Comparing {selectedVehicles.length} vehicles
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setSelectedModels([])}
                  style={{ padding: '10px 20px' }}
                >
                  <i className="bx bx-refresh"></i>
                  Clear Selection
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCompareModal(false)}
                  style={{ padding: '10px 20px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;

