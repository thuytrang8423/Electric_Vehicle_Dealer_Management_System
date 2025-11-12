import React, { useEffect, useMemo, useState } from 'react';
import { inventoryAPI, vehiclesAPI, dealersAPI } from '../../utils/api';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';

const InventoryManagement = ({ user }) => {
  const normalizedRole = (user?.role || '').toUpperCase();
  const isDealerManager = normalizedRole === 'DEALER_MANAGER';
  const isEvmOrAdmin = normalizedRole === 'EVM_MANAGER' || normalizedRole === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [factoryInventory, setFactoryInventory] = useState([]);
  const [dealerInventory, setDealerInventory] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedDealerId, setSelectedDealerId] = useState(
    user?.dealerId ? String(user.dealerId) : ''
  );

  const [factoryForm, setFactoryForm] = useState({ vehicleId: '', quantity: '' });
  const [dealerForm, setDealerForm] = useState({
    dealerId: '',
    vehicleId: '',
    quantity: '',
  });

  const [submittingFactory, setSubmittingFactory] = useState(false);
  const [submittingDealer, setSubmittingDealer] = useState(false);

  const selectedDealerName = useMemo(() => {
    const dealer = dealers.find(
      (item) =>
        String(item.dealerId ?? item.id) ===
        String(selectedDealerId || dealerForm.dealerId || '')
    );
    return dealer?.name || '';
  }, [dealers, selectedDealerId, dealerForm.dealerId]);

  const fetchFactoryInventory = async () => {
    try {
      const data = await inventoryAPI.getFactoryInventory();
      setFactoryInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load factory inventory', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const fetchDealerInventory = async (dealerId) => {
    if (!dealerId) {
      setDealerInventory([]);
      return;
    }

    try {
      const data = await inventoryAPI.getDealerInventory(dealerId);
      setDealerInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load dealer inventory', error);
      showErrorToast(handleAPIError(error));
    }
  };

  const initializeData = async () => {
    try {
      setLoading(true);

      const tasks = [];

      if (isEvmOrAdmin) {
        tasks.push(
          vehiclesAPI.getAll().then((data) => setVehicles(Array.isArray(data) ? data : [])),
          dealersAPI.getAll().then((data) => setDealers(Array.isArray(data) ? data : [])),
          fetchFactoryInventory()
        );
      } else if (isDealerManager) {
        tasks.push(vehiclesAPI.getAll().then((data) => setVehicles(Array.isArray(data) ? data : [])));
      }

      if (user?.dealerId) {
        setSelectedDealerId(String(user.dealerId));
        tasks.push(fetchDealerInventory(user.dealerId));
      }

      await Promise.all(tasks);
    } catch (error) {
      console.error('Failed to initialize inventory data', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedRole]);

  useEffect(() => {
    if (isEvmOrAdmin && dealerForm.dealerId) {
      fetchDealerInventory(dealerForm.dealerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealerForm.dealerId]);

  useEffect(() => {
    if (selectedDealerId && (isDealerManager || isEvmOrAdmin)) {
      fetchDealerInventory(selectedDealerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDealerId]);

  const handleFactorySubmit = async (event) => {
    event.preventDefault();
    if (!factoryForm.vehicleId || !factoryForm.quantity) {
      showErrorToast('Please select vehicle and quantity');
      return;
    }

    try {
      setSubmittingFactory(true);
      await inventoryAPI.createFactoryInventory({
        vehicleId: Number(factoryForm.vehicleId),
        quantity: Number(factoryForm.quantity),
      });
      showSuccessToast('Factory inventory updated successfully');
      setFactoryForm({ vehicleId: '', quantity: '' });
      fetchFactoryInventory();
    } catch (error) {
      console.error('Failed to update factory inventory', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setSubmittingFactory(false);
    }
  };

  const handleDealerSubmit = async (event) => {
    event.preventDefault();
    const dealerId = dealerForm.dealerId || selectedDealerId;
    if (!dealerId || !dealerForm.vehicleId || !dealerForm.quantity) {
      showErrorToast('Please select dealer, vehicle and quantity');
      return;
    }

    try {
      setSubmittingDealer(true);
      await inventoryAPI.createDealerInventory({
        dealerId: Number(dealerId),
        vehicleId: Number(dealerForm.vehicleId),
        quantity: Number(dealerForm.quantity),
      });
      showSuccessToast('Dealer inventory updated successfully');
      setDealerForm({ dealerId: '', vehicleId: '', quantity: '' });
      if (dealerId) {
        fetchDealerInventory(dealerId);
      }
    } catch (error) {
      console.error('Failed to update dealer inventory', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setSubmittingDealer(false);
    }
  };

  const renderInventoryTable = (data) => {
    if (data.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
          <i className="bx bx-package" style={{ fontSize: '42px', marginBottom: '12px' }}></i>
          <div>No inventory records found</div>
        </div>
      );
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={tableHeaderStyle}>Vehicle</th>
              <th style={tableHeaderStyle}>Brand</th>
              <th style={tableHeaderStyle}>Available</th>
              <th style={tableHeaderStyle}>Reserved</th>
              <th style={tableHeaderStyle}>Last Updated</th>
              <th style={tableHeaderStyle}>Dealer</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const vehicle = item.vehicle || {};
              const dealer = item.dealer || {};
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={tableCellStyle}>{vehicle.modelName || vehicle.name || 'N/A'}</td>
                  <td style={tableCellStyle}>{vehicle.brand || 'N/A'}</td>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>
                    {item.availableQuantity ?? 0}
                  </td>
                  <td style={tableCellStyle}>{item.reservedQuantity ?? 0}</td>
                  <td style={tableCellStyle}>
                    {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : 'N/A'}
                  </td>
                  <td style={tableCellStyle}>{dealer.name || 'Factory'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="main">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}></i>
          <div style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>Loading inventory...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>Inventory Overview</h2>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Role: {normalizedRole.replace(/_/g, ' ')}
          </span>
        </div>

        {isEvmOrAdmin && (
          <>
            <section style={{ marginBottom: '32px' }}>
              <h3 style={sectionTitleStyle}>Factory Inventory</h3>

              <form onSubmit={handleFactorySubmit} style={formStyle}>
                <div style={formRowStyle}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Vehicle *</label>
                    <select
                      value={factoryForm.vehicleId}
                      onChange={(event) =>
                        setFactoryForm((prev) => ({ ...prev, vehicleId: event.target.value }))
                      }
                      style={selectStyle}
                      required
                    >
                      <option value="">Select vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.modelName || vehicle.name || vehicle.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '160px' }}>
                    <label style={labelStyle}>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={factoryForm.quantity}
                      onChange={(event) =>
                        setFactoryForm((prev) => ({ ...prev, quantity: event.target.value }))
                      }
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div style={{ alignSelf: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={submittingFactory}>
                      {submittingFactory ? 'Updating...' : 'Add to Factory'}
                    </button>
                  </div>
                </div>
              </form>

              {renderInventoryTable(factoryInventory)}
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h3 style={sectionTitleStyle}>Dealer Inventory Management</h3>

              <form onSubmit={handleDealerSubmit} style={formStyle}>
                <div style={formRowStyle}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Dealer *</label>
                    <select
                      value={dealerForm.dealerId || selectedDealerId}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDealerForm((prev) => ({ ...prev, dealerId: value }));
                        setSelectedDealerId(value);
                      }}
                      style={selectStyle}
                      required
                    >
                      <option value="">Select dealer</option>
                      {dealers.map((dealer) => (
                        <option key={dealer.dealerId || dealer.id} value={dealer.dealerId || dealer.id}>
                          {dealer.name || `Dealer #${dealer.dealerId || dealer.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Vehicle *</label>
                    <select
                      value={dealerForm.vehicleId}
                      onChange={(event) =>
                        setDealerForm((prev) => ({ ...prev, vehicleId: event.target.value }))
                      }
                      style={selectStyle}
                      required
                    >
                      <option value="">Select vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.modelName || vehicle.name || vehicle.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '160px' }}>
                    <label style={labelStyle}>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={dealerForm.quantity}
                      onChange={(event) =>
                        setDealerForm((prev) => ({ ...prev, quantity: event.target.value }))
                      }
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div style={{ alignSelf: 'flex-end' }}>
                    <button type="submit" className="btn btn-outline" disabled={submittingDealer}>
                      {submittingDealer ? 'Processing...' : 'Add to Dealer'}
                    </button>
                  </div>
                </div>
              </form>

              <div style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
                Viewing inventory for: <strong>{selectedDealerName || 'Select a dealer'}</strong>
              </div>

              {renderInventoryTable(dealerInventory)}
            </section>
          </>
        )}

        {isDealerManager && (
          <section>
            <h3 style={sectionTitleStyle}>Dealer Inventory</h3>

            <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div>
                <label style={labelStyle}>Dealer</label>
                <input
                  type="text"
                  value={user?.dealerName || selectedDealerName || `Dealer #${user?.dealerId || 'N/A'}`}
                  readOnly
                  style={{ ...inputStyle, width: '240px', background: 'var(--color-bg-muted)' }}
                />
              </div>
              <div>
                <button
                  className="btn btn-outline"
                  onClick={() => fetchDealerInventory(user?.dealerId)}
                  type="button"
                >
                  Refresh
                </button>
              </div>
            </div>

            {renderInventoryTable(dealerInventory)}
          </section>
        )}

        {!isDealerManager && !isEvmOrAdmin && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-lock-alt" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
            <div>Inventory management is restricted for your role.</div>
          </div>
        )}
      </div>
    </div>
  );
};

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
};

const tableCellStyle = {
  padding: '12px',
  fontSize: '14px',
  color: 'var(--color-text)',
  whiteSpace: 'nowrap',
};

const sectionTitleStyle = {
  fontSize: '18px',
  marginBottom: '16px',
};

const formStyle = {
  padding: '16px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  marginBottom: '24px',
  background: 'var(--color-bg)',
};

const formRowStyle = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontSize: '14px',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
};

export default InventoryManagement;


















