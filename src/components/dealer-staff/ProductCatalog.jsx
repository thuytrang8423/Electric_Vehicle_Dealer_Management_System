import React, { useState } from 'react';
import { showSuccessToast, showInfoToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const ProductCatalog = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showCompareModal, setShowCompareModal] = useState(false);

  const vehicles = [
    { 
      id: 1, 
      name: 'Tesla Model 3', 
      price: 45000, 
      battery: '60 kWh', 
      range: '358 km', 
      power: '283 hp', 
      charging: 'Fast charging',
      image: '/images/image.jpg',
      brand: 'Tesla',
      year: '2024'
    },
    { 
      id: 2, 
      name: 'Tesla Model Y', 
      price: 52000, 
      battery: '75 kWh', 
      range: '480 km', 
      power: '384 hp', 
      charging: 'Fast charging',
      image: '/images/vinfast-vf8-18.jpg',
      brand: 'Tesla',
      year: '2024'
    },
    { 
      id: 3, 
      name: 'BMW i3', 
      price: 42000, 
      battery: '42 kWh', 
      range: '300 km', 
      power: '170 hp', 
      charging: 'Fast charging',
      image: '/images/honda-dien_thanhnien-2_WXZA.jpg',
      brand: 'BMW',
      year: '2024'
    },
    { 
      id: 4, 
      name: 'Nissan Leaf', 
      price: 32000, 
      battery: '40 kWh', 
      range: '240 km', 
      power: '110 hp', 
      charging: 'Standard',
      image: '/images/xe-o-to-dien-dau-tien-cua-nuoc-phap.jpg',
      brand: 'Nissan',
      year: '2024'
    },
    { 
      id: 5, 
      name: 'Chevrolet Bolt', 
      price: 38000, 
      battery: '66 kWh', 
      range: '383 km', 
      power: '200 hp', 
      charging: 'Standard',
      image: '/images/image.jpg',
      brand: 'Chevrolet',
      year: '2024'
    },
    { 
      id: 6, 
      name: 'Audi e-tron', 
      price: 68000, 
      battery: '95 kWh', 
      range: '435 km', 
      power: '355 hp', 
      charging: 'Standard',
      image: '/images/vinfast-vf8-18.jpg',
      brand: 'Audi',
      year: '2024'
    },
    { 
      id: 7, 
      name: 'Ford Mustang Mach-E', 
      price: 48000, 
      battery: '70 kWh', 
      range: '400 km', 
      power: '290 hp', 
      charging: 'Fast charging',
      image: '/images/honda-dien_thanhnien-2_WXZA.jpg',
      brand: 'Ford',
      year: '2024'
    },
    { 
      id: 8, 
      name: 'Hyundai IONIQ 5', 
      price: 41000, 
      battery: '58 kWh', 
      range: '350 km', 
      power: '225 hp', 
      charging: 'Fast charging',
      image: '/images/xe-o-to-dien-dau-tien-cua-nuoc-phap.jpg',
      brand: 'Hyundai',
      year: '2024'
    }
  ];

  const promotions = [
    { vehicleId: 1, discount: '5%', endDate: '2024-02-01' },
    { vehicleId: 3, discount: '10%', endDate: '2024-01-31' }
  ];

  const getPromotion = (vehicleId) => {
    return promotions.find(p => p.vehicleId === vehicleId);
  };

  const toggleCompare = (vehicleId) => {
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
  };

  const handleCompareClick = () => {
    if (selectedModels.length >= 2) {
      setShowCompareModal(true);
      showInfoToast(`Comparing ${selectedModels.length} vehicles`);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedVehicles = vehicles.filter(v => selectedModels.includes(v.id));

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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompare(vehicle.id);
                      }}
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
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        transition: 'all 0.2s ease'
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
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
                      {vehicle.name}
                    </h3>
                    
                    <div style={{ marginBottom: '12px', fontSize: '20px', fontWeight: '700', color: 'var(--color-primary)' }}>
                      ${vehicle.price.toLocaleString()}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bx bx-battery" style={{ fontSize: '12px' }}></i>
                        {vehicle.battery}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bx bx-current-location" style={{ fontSize: '12px' }}></i>
                        {vehicle.range}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bx bx-flash" style={{ fontSize: '12px' }}></i>
                        {vehicle.power}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bx bx-time" style={{ fontSize: '12px' }}></i>
                        {vehicle.charging}
                      </div>
                    </div>
                    
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                      onClick={() => showSuccessToast(`${vehicle.name} added to quote`)}
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
                        ${vehicle.price.toLocaleString()}
                      </div>
                    </div>
                    {promo && (
                      <div style={{ marginBottom: '8px', padding: '4px 12px', background: 'var(--color-warning)', borderRadius: 'var(--radius)', color: 'white', fontSize: '12px', fontWeight: '600', display: 'inline-block' }}>
                        {promo.discount} OFF
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      <div><i className="bx bx-battery" style={{ marginRight: '4px' }}></i> {vehicle.battery}</div>
                      <div><i className="bx bx-current-location" style={{ marginRight: '4px' }}></i> {vehicle.range}</div>
                      <div><i className="bx bx-flash" style={{ marginRight: '4px' }}></i> {vehicle.power}</div>
                      <div><i className="bx bx-time" style={{ marginRight: '4px' }}></i> {vehicle.charging}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => toggleCompare(vehicle.id)}
                      className={`btn ${selectedModels.includes(vehicle.id) ? 'btn-primary' : 'btn-outline'}`}
                      style={{ minWidth: '100px' }}
                    >
                      <i className="bx bx-check"></i>
                      Compare
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ minWidth: '100px' }}
                      onClick={() => showSuccessToast(`${vehicle.name} added to quote`)}
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

        {filteredVehicles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
            <div>No vehicles found</div>
          </div>
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
                            ${v.price.toLocaleString()}
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
                          Range
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v.id} style={{ padding: '16px', textAlign: 'center' }}>{v.range}</td>
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
                          Power
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v.id} style={{ padding: '16px', textAlign: 'center' }}>{v.power}</td>
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
                          Charging Type
                        </td>
                        {selectedVehicles.map(v => (
                          <td key={v.id} style={{ padding: '16px', textAlign: 'center' }}>{v.charging}</td>
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

