import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const VehicleManagement = ({ user }) => {
  const [vehicles, setVehicles] = useState([
    { id: 1, name: 'Tesla Model 3', versions: ['Standard', 'Long Range', 'Performance'], colors: 8, price: 45000, status: 'available', stock: 15 },
    { id: 2, name: 'Tesla Model Y', versions: ['Standard', 'Long Range'], colors: 10, price: 52000, status: 'available', stock: 8 },
    { id: 3, name: 'BMW i3', versions: ['Base'], colors: 5, price: 42000, status: 'available', stock: 12 }
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    versions: '',
    colors: '',
    price: '',
    stock: '',
    status: 'available'
  });

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setFormData({
      name: '',
      versions: '',
      colors: '',
      price: '',
      stock: '',
      status: 'available'
    });
    setShowModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      versions: vehicle.versions.join(', '),
      colors: vehicle.colors.toString(),
      price: vehicle.price.toString(),
      stock: vehicle.stock.toString(),
      status: vehicle.status
    });
    setShowModal(true);
  };

  const handleDeleteVehicle = (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      showSuccessToast('Vehicle deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    const vehicleData = {
      name: formData.name,
      versions: formData.versions.split(',').map(v => v.trim()).filter(v => v),
      colors: parseInt(formData.colors) || 0,
      price: parseInt(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      status: formData.status
    };

    if (editingVehicle) {
      // Update existing vehicle
      setVehicles(vehicles.map(v => 
        v.id === editingVehicle.id 
          ? { ...v, ...vehicleData }
          : v
      ));
      showSuccessToast('Vehicle updated successfully');
    } else {
      // Add new vehicle
      const newVehicle = {
        id: Math.max(...vehicles.map(v => v.id)) + 1,
        ...vehicleData
      };
      setVehicles([...vehicles, newVehicle]);
      showSuccessToast('Vehicle added successfully');
    }

    setShowModal(false);
    setFormData({
      name: '',
      versions: '',
      colors: '',
      price: '',
      stock: '',
      status: 'available'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'var(--color-success)';
      case 'out_of_stock': return 'var(--color-error)';
      case 'discontinued': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Vehicle Management</h2>
          <button className="btn btn-primary" onClick={handleAddVehicle}>
            <i className="bx bx-plus"></i>
            Add Vehicle
          </button>
        </div>

        {/* Vehicle Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Vehicles', value: vehicles.length, icon: 'bx-car', color: 'var(--color-primary)' },
            { label: 'Available', value: vehicles.filter(v => v.status === 'available').length, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Out of Stock', value: vehicles.filter(v => v.status === 'out_of_stock').length, icon: 'bx-x-circle', color: 'var(--color-error)' },
            { label: 'Total Stock', value: vehicles.reduce((sum, v) => sum + v.stock, 0), icon: 'bx-package', color: 'var(--color-info)' }
          ].map((stat, index) => (
            <div key={index} style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px'
                }}>
                  <i className={`bx ${stat.icon}`}></i>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{stat.label}</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Vehicles List */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {vehicles.map(vehicle => (
            <div key={vehicle.id} style={{ 
              padding: '20px', 
              background: 'var(--color-bg)', 
              borderRadius: 'var(--radius)',
              border: `1px solid var(--color-border)`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>{vehicle.name}</h3>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: getStatusColor(vehicle.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {vehicle.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    <div><i className="bx bx-star" style={{ marginRight: '4px' }}></i> {vehicle.versions.length} versions</div>
                    <div><i className="bx bx-palette" style={{ marginRight: '4px' }}></i> {vehicle.colors} colors</div>
                    <div><i className="bx bx-dollar-circle" style={{ marginRight: '4px' }}></i> ${vehicle.price.toLocaleString()}</div>
                    <div><i className="bx bx-package" style={{ marginRight: '4px' }}></i> {vehicle.stock} in stock</div>
                  </div>
                  {vehicle.versions.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Versions:</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {vehicle.versions.map((version, idx) => (
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
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => handleEditVehicle(vehicle)}
                    title="Edit Vehicle"
                  >
                    <i className="bx bx-edit"></i>
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    style={{ color: 'var(--color-error)' }}
                    title="Delete Vehicle"
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {vehicles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-car" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No vehicles found</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAddVehicle}>
              <i className="bx bx-plus"></i>
              Add First Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Vehicle Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., Tesla Model 3"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Versions (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.versions}
                    onChange={(e) => setFormData({...formData, versions: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., Standard, Long Range, Performance"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Colors *
                    </label>
                    <input
                      type="number"
                      value={formData.colors}
                      onChange={(e) => setFormData({...formData, colors: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="8"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="45000"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Stock *
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="15"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                    >
                      <option value="available">Available</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;