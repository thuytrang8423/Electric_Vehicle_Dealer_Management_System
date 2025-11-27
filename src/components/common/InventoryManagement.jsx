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
  const [dealerInventorySummary, setDealerInventorySummary] = useState(null);
  const [dealerInventoryDetails, setDealerInventoryDetails] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedDealerId, setSelectedDealerId] = useState(
    user?.dealerId ? String(user.dealerId) : ''
  );

  const [factoryForm, setFactoryForm] = useState({ vehicleId: '', quantity: '' });
  const [dealerForm, setDealerForm] = useState({
    dealerId: '',
    vehicleId: '',
  });

  const [submittingFactory, setSubmittingFactory] = useState(false);
  const [submittingDealer, setSubmittingDealer] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      setDealerInventorySummary(null);
      setDealerInventoryDetails([]);
      return;
    }

    try {
      // Fetch tất cả: inventory list, summary, và details
      const [inventoryData, summaryData, detailsData] = await Promise.all([
        inventoryAPI.getDealerInventory(dealerId),
        inventoryAPI.getDealerInventorySummary(dealerId).catch(() => null),
        inventoryAPI.getDealerInventoryDetails(dealerId).catch(() => [])
      ]);
      
      setDealerInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setDealerInventorySummary(summaryData);
      setDealerInventoryDetails(Array.isArray(detailsData) ? detailsData : []);
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
          vehiclesAPI.getAll()
            .then((data) => {
              const vehiclesList = Array.isArray(data) ? data : [];
              console.log('✅ Loaded vehicles:', vehiclesList.length, vehiclesList);
              setVehicles(vehiclesList);
              if (vehiclesList.length === 0) {
                console.warn('⚠️ No vehicles found. Please create vehicles first in Vehicle Management.');
              }
            })
            .catch((error) => {
              console.error('❌ Failed to load vehicles:', error);
              showErrorToast('Không thể tải danh sách xe. Vui lòng kiểm tra lại.');
              setVehicles([]);
            }),
          dealersAPI.getAll().then((data) => setDealers(Array.isArray(data) ? data : [])),
          fetchFactoryInventory()
        );
      } else if (isDealerManager) {
        tasks.push(
          vehiclesAPI.getAll()
            .then((data) => {
              const vehiclesList = Array.isArray(data) ? data : [];
              console.log('✅ Loaded vehicles:', vehiclesList.length, vehiclesList);
              setVehicles(vehiclesList);
              if (vehiclesList.length === 0) {
                console.warn('⚠️ No vehicles found. Please create vehicles first in Vehicle Management.');
              }
            })
            .catch((error) => {
              console.error('❌ Failed to load vehicles:', error);
              showErrorToast('Không thể tải danh sách xe. Vui lòng kiểm tra lại.');
              setVehicles([]);
            })
        );
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
      setCurrentPage(1); // Reset to first page when dealer changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDealerId]);
  
  useEffect(() => {
    // Reset to first page when inventory details change
    setCurrentPage(1);
  }, [dealerInventoryDetails]);

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
    if (!dealerId || !dealerForm.vehicleId) {
      showErrorToast('Please select dealer and vehicle');
      return;
    }

    try {
      setSubmittingDealer(true);
      await inventoryAPI.createDealerInventory({
        dealerId: Number(dealerId),
        vehicleId: Number(dealerForm.vehicleId),
      });
      showSuccessToast('Vehicle added to dealer inventory successfully');
      setDealerForm({ dealerId: '', vehicleId: '' });
      if (dealerId) {
        fetchDealerInventory(dealerId);
      }
    } catch (error) {
      console.error('Failed to update dealer inventory', error);
      const errorMessage = handleAPIError(error);
      // Xử lý error message khi vehicle đã tồn tại
      if (errorMessage.includes('already exists') || errorMessage.includes('Vehicle already exists')) {
        showErrorToast('Vehicle đã tồn tại trong kho đại lý. Mỗi vehicle chỉ có thể thêm 1 lần.');
      } else {
        showErrorToast(errorMessage);
      }
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
                      disabled={vehicles.length === 0}
                    >
                      <option value="">
                        {vehicles.length === 0 
                          ? 'Không có xe nào. Vui lòng tạo xe trước trong Vehicle Management.' 
                          : 'Select vehicle'}
                      </option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.modelName || vehicle.name || `Vehicle #${vehicle.id}`}
                          {vehicle.brand ? ` - ${vehicle.brand}` : ''}
                        </option>
                      ))}
                    </select>
                    {vehicles.length === 0 && (
                      <div style={{ 
                        marginTop: '4px', 
                        fontSize: '12px', 
                        color: 'var(--color-warning)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="bx bx-info-circle"></i>
                        Chưa có xe nào. Vui lòng tạo xe trong <strong>Vehicle Management</strong> trước.
                      </div>
                    )}
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
                      disabled={vehicles.length === 0}
                    >
                      <option value="">
                        {vehicles.length === 0 
                          ? 'Không có xe nào. Vui lòng tạo xe trước trong Vehicle Management.' 
                          : 'Select vehicle'}
                      </option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.modelName || vehicle.name || `Vehicle #${vehicle.id}`}
                          {vehicle.brand ? ` - ${vehicle.brand}` : ''}
                        </option>
                      ))}
                    </select>
                    {vehicles.length === 0 && (
                      <div style={{ 
                        marginTop: '4px', 
                        fontSize: '12px', 
                        color: 'var(--color-warning)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="bx bx-info-circle"></i>
                        Chưa có xe nào. Vui lòng tạo xe trong <strong>Vehicle Management</strong> trước.
                      </div>
                    )}
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

              {/* Inventory Summary */}
              {dealerInventorySummary && Object.keys(dealerInventorySummary).length > 0 && (
                <div style={{ 
                  marginBottom: '24px', 
                  padding: '16px', 
                  background: 'var(--color-bg)', 
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)'
                }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
                    <i className="bx bx-bar-chart-alt-2" style={{ marginRight: '8px' }}></i>
                    Tổng hợp theo Model
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {Object.entries(dealerInventorySummary).map(([modelName, quantity]) => (
                      <div key={modelName} style={{ 
                        padding: '12px', 
                        background: 'var(--color-surface)', 
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--color-border)'
                      }}>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                          {modelName}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-primary)' }}>
                          {quantity} {quantity === 1 ? 'xe' : 'xe'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory Details */}
              {dealerInventoryDetails && dealerInventoryDetails.length > 0 && (() => {
                // Sort by lastUpdated (newest first)
                const sortedDetails = [...dealerInventoryDetails].sort((a, b) => {
                  const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
                  const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
                  return dateB - dateA; // Descending (newest first)
                });
                
                // Pagination
                const totalPages = Math.ceil(sortedDetails.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedDetails = sortedDetails.slice(startIndex, endIndex);
                
                return (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
                      <i className="bx bx-list-ul" style={{ marginRight: '8px' }}></i>
                      Chi tiết Inventory ({sortedDetails.length} xe)
                    </h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                            <th style={tableHeaderStyle}>Vehicle</th>
                            <th style={tableHeaderStyle}>Brand</th>
                            <th style={tableHeaderStyle}>VIN</th>
                            <th style={tableHeaderStyle}>Engine Number</th>
                            <th style={tableHeaderStyle}>Available</th>
                            <th style={tableHeaderStyle}>Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedDetails.map((item) => {
                            const vehicle = item.vehicle || {};
                            return (
                              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tableCellStyle}>{vehicle.modelName || vehicle.name || 'N/A'}</td>
                                <td style={tableCellStyle}>{vehicle.brand || 'N/A'}</td>
                                <td style={tableCellStyle}>
                                  {vehicle.vin && vehicle.vin.trim() ? (
                                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{vehicle.vin}</span>
                                  ) : (
                                    <span style={{ color: 'var(--color-warning)', fontSize: '12px' }}>Chưa có</span>
                                  )}
                                </td>
                                <td style={tableCellStyle}>
                                  {vehicle.engineNumber && vehicle.engineNumber.trim() ? (
                                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{vehicle.engineNumber}</span>
                                  ) : (
                                    <span style={{ color: 'var(--color-warning)', fontSize: '12px' }}>Chưa có</span>
                                  )}
                                </td>
                                <td style={{ ...tableCellStyle, fontWeight: 600 }}>
                                  {item.availableQuantity ?? 0}
                                </td>
                                <td style={tableCellStyle}>
                                  {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginTop: '16px',
                        padding: '12px',
                        background: 'var(--color-bg)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--color-border)'
                      }}>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                          Hiển thị {startIndex + 1}-{Math.min(endIndex, sortedDetails.length)} trong tổng số {sortedDetails.length} xe
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn btn-outline"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                          >
                            <i className="bx bx-chevron-left"></i> Trước
                          </button>
                          <div style={{ 
                            display: 'flex', 
                            gap: '4px',
                            fontSize: '14px',
                            color: 'var(--color-text)'
                          }}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(page => {
                                // Show first page, last page, current page, and pages around current
                                return page === 1 || 
                                       page === totalPages || 
                                       (page >= currentPage - 1 && page <= currentPage + 1);
                              })
                              .map((page, index, array) => {
                                // Add ellipsis if needed
                                const prevPage = array[index - 1];
                                const showEllipsisBefore = prevPage && page - prevPage > 1;
                                
                                return (
                                  <React.Fragment key={page}>
                                    {showEllipsisBefore && (
                                      <span style={{ padding: '0 4px', color: 'var(--color-text-muted)' }}>...</span>
                                    )}
                                    <button
                                      className={currentPage === page ? 'btn btn-primary' : 'btn btn-outline'}
                                      onClick={() => setCurrentPage(page)}
                                      style={{ 
                                        fontSize: '12px', 
                                        padding: '6px 12px',
                                        minWidth: '36px'
                                      }}
                                    >
                                      {page}
                                    </button>
                                  </React.Fragment>
                                );
                              })}
                          </div>
                          <button
                            className="btn btn-outline"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                          >
                            Sau <i className="bx bx-chevron-right"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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

            {/* Inventory Summary */}
            {dealerInventorySummary && Object.keys(dealerInventorySummary).length > 0 && (
              <div style={{ 
                marginBottom: '24px', 
                padding: '16px', 
                background: 'var(--color-bg)', 
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)'
              }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
                  <i className="bx bx-bar-chart-alt-2" style={{ marginRight: '8px' }}></i>
                  Tổng hợp theo Model
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {Object.entries(dealerInventorySummary).map(([modelName, quantity]) => (
                    <div key={modelName} style={{ 
                      padding: '12px', 
                      background: 'var(--color-surface)', 
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)'
                    }}>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                        {modelName}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {quantity} {quantity === 1 ? 'xe' : 'xe'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory Details */}
            {dealerInventoryDetails && dealerInventoryDetails.length > 0 && (() => {
              // Sort by lastUpdated (newest first)
              const sortedDetails = [...dealerInventoryDetails].sort((a, b) => {
                const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
                const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
                return dateB - dateA; // Descending (newest first)
              });
              
              // Pagination
              const totalPages = Math.ceil(sortedDetails.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const paginatedDetails = sortedDetails.slice(startIndex, endIndex);
              
              return (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
                    <i className="bx bx-list-ul" style={{ marginRight: '8px' }}></i>
                    Chi tiết Inventory ({sortedDetails.length} xe)
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                          <th style={tableHeaderStyle}>Vehicle</th>
                          <th style={tableHeaderStyle}>Brand</th>
                          <th style={tableHeaderStyle}>VIN</th>
                          <th style={tableHeaderStyle}>Engine Number</th>
                          <th style={tableHeaderStyle}>Available</th>
                          <th style={tableHeaderStyle}>Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedDetails.map((item) => {
                          const vehicle = item.vehicle || {};
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={tableCellStyle}>{vehicle.modelName || vehicle.name || 'N/A'}</td>
                              <td style={tableCellStyle}>{vehicle.brand || 'N/A'}</td>
                              <td style={tableCellStyle}>
                                {vehicle.vin && vehicle.vin.trim() ? (
                                  <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{vehicle.vin}</span>
                                ) : (
                                  <span style={{ color: 'var(--color-warning)', fontSize: '12px' }}>Chưa có</span>
                                )}
                              </td>
                              <td style={tableCellStyle}>
                                {vehicle.engineNumber && vehicle.engineNumber.trim() ? (
                                  <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{vehicle.engineNumber}</span>
                                ) : (
                                  <span style={{ color: 'var(--color-warning)', fontSize: '12px' }}>Chưa có</span>
                                )}
                              </td>
                              <td style={{ ...tableCellStyle, fontWeight: 600 }}>
                                {item.availableQuantity ?? 0}
                              </td>
                              <td style={tableCellStyle}>
                                {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginTop: '16px',
                      padding: '12px',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)'
                    }}>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, sortedDetails.length)} trong tổng số {sortedDetails.length} xe
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          <i className="bx bx-chevron-left"></i> Trước
                        </button>
                        <div style={{ 
                          display: 'flex', 
                          gap: '4px',
                          fontSize: '14px',
                          color: 'var(--color-text)'
                        }}>
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              // Show first page, last page, current page, and pages around current
                              return page === 1 || 
                                     page === totalPages || 
                                     (page >= currentPage - 1 && page <= currentPage + 1);
                            })
                            .map((page, index, array) => {
                              // Add ellipsis if needed
                              const prevPage = array[index - 1];
                              const showEllipsisBefore = prevPage && page - prevPage > 1;
                              
                              return (
                                <React.Fragment key={page}>
                                  {showEllipsisBefore && (
                                    <span style={{ padding: '0 4px', color: 'var(--color-text-muted)' }}>...</span>
                                  )}
                                  <button
                                    className={currentPage === page ? 'btn btn-primary' : 'btn btn-outline'}
                                    onClick={() => setCurrentPage(page)}
                                    style={{ 
                                      fontSize: '12px', 
                                      padding: '6px 12px',
                                      minWidth: '36px'
                                    }}
                                  >
                                    {page}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>
                        <button
                          className="btn btn-outline"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Sau <i className="bx bx-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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
































