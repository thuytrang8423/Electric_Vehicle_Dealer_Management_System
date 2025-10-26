import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const ProductCatalog = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const vehicles = [
    { id: 1, name: 'Tesla Model 3', price: 45000, battery: '60 kWh', range: '358 km', power: '283 hp', image: null },
    { id: 2, name: 'Tesla Model Y', price: 52000, battery: '75 kWh', range: '480 km', power: '384 hp', image: null },
    { id: 3, name: 'BMW i3', price: 42000, battery: '42 kWh', range: '300 km', power: '170 hp', image: null },
    { id: 4, name: 'Nissan Leaf', price: 32000, battery: '40 kWh', range: '240 km', power: '110 hp', image: null },
    { id: 5, name: 'Chevrolet Bolt', price: 38000, battery: '66 kWh', range: '383 km', power: '200 hp', image: null },
    { id: 6, name: 'Audi e-tron', price: 68000, battery: '95 kWh', range: '435 km', power: '355 hp', image: null }
  ];

  const promotions = [
    { vehicleId: 1, discount: '5%', endDate: '2024-02-01' },
    { vehicleId: 3, discount: '10%', endDate: '2024-01-31' }
  ];

  const getPromotion = (vehicleId) => {
    return promotions.find(p => p.vehicleId === vehicleId);
  };

  const toggleCompare = (vehicleId) => {
    setSelectedModels(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
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
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bx bx-bar-chart-alt-2"></i>
              Compare {selectedModels.length} models
            </button>
          )}
        </div>

        {/* Vehicle Grid */}
        {viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredVehicles.map(vehicle => {
              const promo = getPromotion(vehicle.id);
              return (
                <div key={vehicle.id} style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  padding: '20px',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ width: '60px', height: '40px', background: 'var(--color-bg)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bx bx-car" style={{ fontSize: '24px', color: 'var(--color-text-muted)' }}></i>
                    </div>
                    <button
                      onClick={() => toggleCompare(vehicle.id)}
                      style={{
                        padding: '4px 8px',
                        border: selectedModels.includes(vehicle.id) ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: selectedModels.includes(vehicle.id) ? 'var(--color-primary)' : 'transparent',
                        color: selectedModels.includes(vehicle.id) ? 'white' : 'var(--color-text)',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="bx bx-check"></i>
                    </button>
                  </div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
                    {vehicle.name}
                  </h3>
                  {promo && (
                    <div style={{ marginBottom: '12px', padding: '8px', background: 'var(--color-warning)', borderRadius: 'var(--radius)', color: 'white', fontSize: '12px', fontWeight: '600' }}>
                      {promo.discount} OFF - Ends {promo.endDate}
                    </div>
                  )}
                  <div style={{ marginBottom: '12px', fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>
                    ${vehicle.price.toLocaleString()}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                    <div>
                      <i className="bx bx-battery" style={{ marginRight: '4px' }}></i>
                      {vehicle.battery}
                    </div>
                    <div>
                      <i className="bx bx-current-location" style={{ marginRight: '4px' }}></i>
                      {vehicle.range}
                    </div>
                    <div>
                      <i className="bx bx-flash" style={{ marginRight: '4px' }}></i>
                      {vehicle.power}
                    </div>
                    <div>
                      <i className="bx bx-time" style={{ marginRight: '4px' }}></i>
                      {vehicle.id < 4 ? 'Fast charging' : 'Standard'}
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }}>
                    <i className="bx bx-cart-add"></i>
                    Add to Quote
                  </button>
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
                  <div style={{ width: '120px', height: '80px', background: 'var(--color-bg)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bx bx-car" style={{ fontSize: '32px', color: 'var(--color-text-muted)' }}></i>
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
                      <div><i className="bx bx-time" style={{ marginRight: '4px' }}></i> {vehicle.id < 4 ? 'Fast' : 'Standard'}</div>
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
                    <button className="btn btn-secondary" style={{ minWidth: '100px' }}>
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
      {selectedVehicles.length >= 2 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Compare Models</h3>
            <button className="btn btn-outline" onClick={() => setSelectedModels([])}>
              <i className="bx bx-x"></i>
              Clear
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Specification</th>
                  {selectedVehicles.map(v => (
                    <th key={v.id} style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                      {v.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>Price</td>
                  {selectedVehicles.map(v => (
                    <td key={v.id} style={{ padding: '12px', textAlign: 'center' }}>${v.price.toLocaleString()}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>Battery</td>
                  {selectedVehicles.map(v => (
                    <td key={v.id} style={{ padding: '12px', textAlign: 'center' }}>{v.battery}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>Range</td>
                  {selectedVehicles.map(v => (
                    <td key={v.id} style={{ padding: '12px', textAlign: 'center' }}>{v.range}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>Power</td>
                  {selectedVehicles.map(v => (
                    <td key={v.id} style={{ padding: '12px', textAlign: 'center' }}>{v.power}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;

