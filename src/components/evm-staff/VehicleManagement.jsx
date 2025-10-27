import React, { useState, useEffect } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { vehiclesAPI } from '../../utils/api/vehiclesAPI';
import { uploadImage } from '../../utils/cloudinary';
import 'boxicons/css/boxicons.min.css';

const defaultForm = {
  modelName: '',
  brand: '',
  yearOfManufacture: '',
  vehicleType: '',
  batteryCapacity: '',
  listedPrice: '',
  status: '',
  versions: '',
  colors: '',
  image: ''
};

const safeParse = (s, fallback = {}) => {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
};

const toArr = (text) =>
  String(text || '').split(',').map(t => t.trim()).filter(Boolean);

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typesLoading, setTypesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehiclesAPI.getAll();
      setVehicles(data || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      showErrorToast('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      setTypesLoading(true);
      const data = await vehiclesAPI.getAllTypes();
      // Filter to only include active vehicle types
      const activeTypes = (data || []).filter(type => type.status === 'true');
      setVehicleTypes(activeTypes);
    } catch (err) {
      showErrorToast('Failed to load vehicle types');
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => { 
    fetchVehicles(); 
    fetchVehicleTypes();
  }, []);

  const resetAndClose = () => {
    setFormData(defaultForm);
    setEditingVehicle(null);
    setShowModal(false);
    setImageFile(null);
    setImagePreview(null);
    setUploading(false);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploading(true);
        const imageUrl = await uploadImage(file);
        setFormData({ ...formData, image: imageUrl });
        setImagePreview(imageUrl);
        showSuccessToast('Image uploaded successfully');
      } catch (error) {
        console.error('Error uploading image:', error);
        showErrorToast('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  };

  const openAdd = () => { setEditingVehicle(null); setFormData(defaultForm); setShowModal(true); };

  const openEdit = (vehicle) => {
    const versionData = safeParse(vehicle.versionJson, {});
    const versionsText = Array.isArray(versionData.features)
      ? versionData.features.join(', ')
      : (versionData.standard || Object.values(versionData || {}).join(', '));

    const colorsData = safeParse(vehicle.availableColorsJson, []);
    const colorsText = Array.isArray(colorsData) ? colorsData.join(', ') : '';

    // Debug logging
    console.log('Vehicle being edited:', vehicle);
    console.log('Vehicle vehicleType:', vehicle.vehicleType);
    console.log('Available vehicleTypes when editing:', vehicleTypes);

    const vehicleTypeValue = vehicle.vehicleType?.typeName || vehicle.vehicleType || '';
    console.log('Setting vehicleType to:', vehicleTypeValue);
    
    // If vehicleType is empty and we have vehicleTypes loaded, set a default
    const finalVehicleTypeValue = vehicleTypeValue || (vehicleTypes.length > 0 ? vehicleTypes[0].typeName : '');
    console.log('Final vehicleType value:', finalVehicleTypeValue);

    setEditingVehicle(vehicle);
    setFormData({
      modelName: vehicle.modelName || '',
      brand: vehicle.brand || '',
      yearOfManufacture: vehicle.yearOfManufacture?.toString() || '',
      vehicleType: finalVehicleTypeValue,
      batteryCapacity: vehicle.batteryCapacity?.toString() || '',
      listedPrice: vehicle.listedPrice?.toString() || '',
      status: vehicle.status || '',
      versions: versionsText,
      colors: colorsText,
      image: vehicle.specifications?.images?.[0] || ''
    });
    setImagePreview(vehicle.specifications?.images?.[0] || null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await vehiclesAPI.delete(vehicleId);
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      showSuccessToast('Vehicle deleted successfully');
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      showErrorToast('Failed to delete vehicle');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.modelName || !formData.listedPrice) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    // Debug logging
    console.log('Form data vehicleType:', formData.vehicleType);
    console.log('Available vehicleTypes:', vehicleTypes);
    
    // Find the selected vehicle type object
    const selectedVehicleType = vehicleTypes.find(type => type.typeName === formData.vehicleType);
    console.log('Selected vehicle type:', selectedVehicleType);
    
    // Ensure vehicleType is never null - always create an object with typeName
    let vehicleTypePayload = null;
    if (selectedVehicleType) {
      vehicleTypePayload = { 
        id: selectedVehicleType.id,
        typeName: selectedVehicleType.typeName 
      };
    } else if (formData.vehicleType && formData.vehicleType.trim()) {
      vehicleTypePayload = { typeName: formData.vehicleType.trim() };
    } else {
      // Fallback to first available type or default
      const defaultType = vehicleTypes.length > 0 ? vehicleTypes[0] : { typeName: 'Sedan' };
      vehicleTypePayload = { typeName: defaultType.typeName };
    }
    
    console.log('Final vehicleType payload:', vehicleTypePayload);
    
    const payload = {
      modelName: formData.modelName,
      brand: formData.brand,
      yearOfManufacture: parseInt(formData.yearOfManufacture) || new Date().getFullYear(),
      vehicleType: vehicleTypePayload,
      batteryCapacity: parseInt(formData.batteryCapacity) || 0,
      listedPrice: parseInt(formData.listedPrice) || 0,
      status: formData.status,
      versionJson: JSON.stringify({ features: toArr(formData.versions) }),
      availableColorsJson: JSON.stringify(toArr(formData.colors)),
      specifications: {
        images: formData.image ? [formData.image] : [],
        battery: {
          capacity_kWh: parseInt(formData.batteryCapacity) || 0,
          range_km: 0
        }
      }
    };
    
    console.log('Payload vehicleType:', payload.vehicleType);

    try {
      if (editingVehicle) {
        await vehiclesAPI.update(editingVehicle.id, payload);
        showSuccessToast('Vehicle updated successfully');
      } else {
        await vehiclesAPI.create(payload);
        showSuccessToast('Vehicle added successfully');
      }
      await fetchVehicles();
      resetAndClose();
    } catch (err) {
      console.error('Error saving vehicle:', err);
      showErrorToast('Failed to save vehicle');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'AVAILABLE') return 'var(--color-success)';
    if (status === 'OUT_OF_STOCK') return 'var(--color-error)';
    return 'var(--color-text-muted)';
  };

  const parseVersionForDisplay = (vehicle) => {
    const data = safeParse(vehicle.versionJson, {});
    if (Array.isArray(data.features)) return data.features;
    if (data.standard) return [data.standard];
    return Object.values(data).filter(Boolean);
  };

  const parseColorsForDisplay = (vehicle) => {
    const arr = safeParse(vehicle.availableColorsJson, []);
    return Array.isArray(arr) ? arr : [];
  };

  const getVehicleImage = (vehicle) => {
    const firstImage = vehicle.specifications?.images?.[0];
    return firstImage || '';
  };

  if (loading) {
    return (
      <div className="main">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--color-primary)' }}></i>
            <div style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Loading vehicles...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Vehicle Management</h2>
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bx bx-plus"></i>
            Add Vehicle
          </button>
        </div>

        {/* Vehicle Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Vehicles', value: vehicles.length, icon: 'bx-car', color: 'var(--color-primary)' },
            { label: 'Available', value: vehicles.filter(v => v.status === 'AVAILABLE').length, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Out of Stock', value: vehicles.filter(v => v.status === 'OUT_OF_STOCK').length, icon: 'bx-x-circle', color: 'var(--color-error)' },
            { label: 'Vehicle Types', value: vehicleTypes.length, icon: 'bx-category', color: 'var(--color-info)' }
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
                  <img 
                    src={getVehicleImage(vehicle)} 
                    alt={vehicle.modelName}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)'
                    }}
                    onError={(e) => { 
                      if (e.target.src !== '/fallback.png') {
                        e.target.src = '/fallback.png';
                      }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>{vehicle.modelName}</h3>
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    <div><i className="bx bx-star" style={{ marginRight: '4px' }}></i> {parseVersionForDisplay(vehicle).length} versions</div>
                    <div><i className="bx bx-palette" style={{ marginRight: '4px' }}></i> {parseColorsForDisplay(vehicle).length} colors</div>
                    <div><i className="bx bx-dollar-circle" style={{ marginRight: '4px' }}></i> ${(vehicle.listedPrice || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    <strong>{vehicle.brand || 'N/A'}</strong> • {vehicle.yearOfManufacture || 'N/A'} • {vehicle.vehicleType?.typeName || 'N/A'}
                    {vehicle.batteryCapacity && <span> • {vehicle.batteryCapacity} kWh</span>}
                  </div>
                  {parseVersionForDisplay(vehicle).length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Versions:</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {parseVersionForDisplay(vehicle).map((version, idx) => (
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
                  {parseColorsForDisplay(vehicle).length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Colors:</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {parseColorsForDisplay(vehicle).map((color, idx) => (
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
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => openEdit(vehicle)}
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

        {vehicles.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-car" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No vehicles found</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openAdd}>
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
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <button
                onClick={resetAndClose}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Layout: Image on left, Form on right */}
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Left Side - Image Upload Section */}
                <div style={{ position: 'sticky', top: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Vehicle Image
                  </label>
                  
                  {/* Rectangular Image Preview with Click to Upload */}
                  <label 
                    htmlFor="image-upload-input"
                    onMouseEnter={(e) => {
                      if (!imagePreview && !uploading) {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.background = 'var(--color-surface)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!imagePreview && !uploading) {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.background = 'var(--color-bg)';
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      aspectRatio: '4/3', 
                      borderRadius: 'var(--radius)', 
                      overflow: 'hidden',
                      border: '2px dashed var(--color-border)',
                      marginBottom: '16px',
                      display: 'block',
                      cursor: 'pointer',
                      position: 'relative',
                      background: 'var(--color-bg)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploading}
                      style={{ display: 'none' }}
                      id="image-upload-input"
                    />
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        color: 'var(--color-text-muted)', 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <i className="bx bx-camera" style={{ fontSize: '48px', marginBottom: '8px' }}></i>
                        <div style={{ fontSize: '12px' }}>Click to upload image</div>
                      </div>
                    )}
                  </label>
                  
                  {uploading && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '8px' }}>
                      <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '4px' }}></i>
                      Uploading...
                    </div>
                  )}

                  {/* URL Input */}
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '12px'
                    }}
                    placeholder="Or paste image URL"
                  />
                </div>

                {/* Right Side - Form Fields */}
                <div style={{ display: 'grid', gap: '16px' }}>
                {/* Basic Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Model Name *
                    </label>
                    <input
                      type="text"
                      value={formData.modelName}
                      onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
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
                      Brand
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="e.g., Tesla"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Year of Manufacture
                    </label>
                    <input
                      type="number"
                      value={formData.yearOfManufacture}
                      onChange={(e) => setFormData({ ...formData, yearOfManufacture: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="2024"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Vehicle Type
                    </label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      disabled={typesLoading}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                        cursor: typesLoading ? 'wait' : 'pointer'
                      }}
                    >
                      <option value="">
                        {typesLoading ? 'Loading vehicle types...' : 'Select Vehicle Type'}
                      </option>
                      {vehicleTypes.map(type => (
                        <option key={type.id} value={type.typeName}>
                          {type.typeName}
                        </option>
                      ))}
                    </select>
                    {typesLoading && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '4px' }}></i>
                        Loading vehicle types...
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Battery Capacity (kWh)
                    </label>
                    <input
                      type="number"
                      value={formData.batteryCapacity}
                      onChange={(e) => setFormData({ ...formData, batteryCapacity: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="75"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Listed Price (VND) *
                    </label>
                    <input
                      type="number"
                      value={formData.listedPrice}
                      onChange={(e) => setFormData({ ...formData, listedPrice: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="1800000000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Versions (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.versions}
                    onChange={(e) => setFormData({ ...formData, versions: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Colors (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., Red, White, Midnight Silver"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                    <option value="AVAILABLE">Available</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="DISCONTINUED">Discontinued</option>
                  </select>
                </div>
                </div>
              </div>
              {/* End of layout grid */}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetAndClose}
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
