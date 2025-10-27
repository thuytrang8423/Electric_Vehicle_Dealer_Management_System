import React, { useState, useEffect } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { vehiclesAPI } from '../../utils/api/vehiclesAPI';
import 'boxicons/css/boxicons.min.css';

const VehicleTypeManagement = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    typeName: '',
    description: '',
    status: 'true'
  });

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const data = await vehiclesAPI.getAllTypes();
      setTypes(data || []);
    } catch (err) {
      console.error('Error fetching vehicle types:', err);
      showErrorToast('Failed to load vehicle types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const resetAndClose = () => {
    setFormData({ typeName: '', description: '', status: 'true' });
    setEditingType(null);
    setShowModal(false);
  };

  const openAdd = () => { 
    setEditingType(null); 
    setFormData({ typeName: '', description: '', status: 'true' }); 
    setShowModal(true); 
  };

  const openEdit = (type) => {
    setEditingType(type);
    setFormData({
      typeName: type.typeName || '',
      description: type.description || '',
      status: type.status || 'true'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle type?')) return;
    try {
      await vehiclesAPI.deleteType(id);
      setTypes(prev => prev.filter(t => t.id !== id));
      showSuccessToast('Vehicle type deleted successfully');
    } catch (err) {
      console.error('Error deleting vehicle type:', err);
      showErrorToast('Failed to delete vehicle type');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'true' ? 'false' : 'true';
    try {
      await vehiclesAPI.updateType(id, { status: newStatus });
      setTypes(prev => prev.map(t => 
        t.id === id ? { ...t, status: newStatus } : t
      ));
      showSuccessToast(`Vehicle type ${newStatus === 'true' ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating vehicle type status:', err);
      showErrorToast('Failed to update vehicle type status');
    }
  };

  const filteredTypes = types.filter(type => {
    if (statusFilter === 'all') return true;
    return type.status === statusFilter;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.typeName) {
      showErrorToast('Please fill in type name');
      return;
    }

    try {
      if (editingType) {
        await vehiclesAPI.updateType(editingType.id, formData);
        showSuccessToast('Vehicle type updated successfully');
      } else {
        await vehiclesAPI.createType(formData);
        showSuccessToast('Vehicle type added successfully');
      }
      await fetchTypes();
      resetAndClose();
    } catch (err) {
      console.error('Error saving vehicle type:', err);
      showErrorToast('Failed to save vehicle type');
    }
  };

  if (loading) {
    return (
      <div className="main">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--color-primary)' }}></i>
            <div style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Loading vehicle types...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Vehicle Type Management</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '14px'
              }}
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button className="btn btn-primary" onClick={openAdd}>
              <i className="bx bx-plus"></i>
              Add Type
            </button>
          </div>
        </div>

        {/* Types List */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredTypes.map(type => (
            <div key={type.id} style={{ 
              padding: '20px', 
              background: 'var(--color-bg)', 
              borderRadius: 'var(--radius)',
              border: `1px solid var(--color-border)`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>{type.typeName}</h3>
                    <button
                      onClick={() => handleStatusToggle(type.id, type.status)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius)',
                        background: type.status === 'true' ? 'var(--color-success)' : 'var(--color-surface)',
                        color: type.status === 'true' ? 'white' : 'var(--color-text-muted)',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={`Click to ${type.status === 'true' ? 'deactivate' : 'activate'} this vehicle type`}
                    >
                      <i className={`bx ${type.status === 'true' ? 'bx-check-circle' : 'bx-x-circle'}`}></i>
                      {type.status === 'true' ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  {type.description && (
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {type.description}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-outline"
                    onClick={() => openEdit(type)}
                    title="Edit Type"
                  >
                    <i className="bx bx-edit"></i>
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => handleDelete(type.id)}
                    style={{ color: 'var(--color-error)' }}
                    title="Delete Type"
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTypes.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-car" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>
              {statusFilter === 'all' ? 'No vehicle types found' : 
               statusFilter === 'true' ? 'No active vehicle types found' : 
               'No inactive vehicle types found'}
            </div>
            {statusFilter === 'all' && (
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openAdd}>
                <i className="bx bx-plus"></i>
                Add First Type
              </button>
            )}
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
              <h3>{editingType ? 'Edit Vehicle Type' : 'Add New Vehicle Type'}</h3>
              <button
                onClick={resetAndClose}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Type Name *
                  </label>
                  <input
                    type="text"
                    value={formData.typeName}
                    onChange={(e) => setFormData({ ...formData, typeName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., 7 chỗ"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      minHeight: '100px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="e.g., 7-seater vehicle..."
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
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetAndClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingType ? 'Update Type' : 'Add Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleTypeManagement;


