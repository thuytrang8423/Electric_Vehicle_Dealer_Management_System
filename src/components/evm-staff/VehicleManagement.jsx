import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const VehicleManagement = ({ user }) => {
  const [vehicles] = useState([
    { id: 1, name: 'Tesla Model 3', versions: ['Standard', 'Long Range', 'Performance'], colors: 8, price: 45000 },
    { id: 2, name: 'Tesla Model Y', versions: ['Standard', 'Long Range'], colors: 10, price: 52000 },
    { id: 3, name: 'BMW i3', versions: ['Base'], colors: 5, price: 42000 }
  ]);

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Vehicle Management</h2>
          <button className="btn btn-primary">
            <i className="bx bx-plus"></i>
            Add Vehicle
          </button>
        </div>
        {vehicles.map(vehicle => (
          <div key={vehicle.id} style={{ marginBottom: '16px', padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>{vehicle.name}</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                  <div><i className="bx bx-star"></i> {vehicle.versions.length} versions</div>
                  <div><i className="bx bx-palette"></i> {vehicle.colors} colors</div>
                  <div><i className="bx bx-dollar-circle"></i> ${vehicle.price.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline">
                  <i className="bx bx-edit"></i>
                </button>
                <button className="btn btn-outline">
                  <i className="bx bx-trash"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleManagement;

