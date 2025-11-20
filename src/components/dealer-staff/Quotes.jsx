    import React, { useState, useEffect } from 'react';
    import { quotesAPI } from '../../utils/api/quotesAPI';
    import { customersAPI } from '../../utils/api/customersAPI';
    import { vehiclesAPI } from '../../utils/api/vehiclesAPI';
    import { showSuccessToast, showErrorToast } from '../../utils/toast';
    import { handleAPIError } from '../../utils/apiConfig';
    import 'boxicons/css/boxicons.min.css';

    const Quotes = ({ user }) => {
        const [quotes, setQuotes] = useState([]); // Mảng quotes hiển thị trên table
        const [loading, setLoading] = useState(true);
        const [selectedStatus, setSelectedStatus] = useState('all');
        const [searchTerm, setSearchTerm] = useState('');
        const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
        const [createForm, setCreateForm] = useState({
            customerId: '',
            vehicleId: '',
            quantity: 1,
            unitPrice: '',
            notes: ''
        });
        const [createLoading, setCreateLoading] = useState(false);
        const [availableCustomers, setAvailableCustomers] = useState([]);
        const [availableVehicles, setAvailableVehicles] = useState([]);
        const [customerLookup, setCustomerLookup] = useState({});
        const [vehicleLookup, setVehicleLookup] = useState({});
        const [selectedCustomer, setSelectedCustomer] = useState(null);
        const [selectedVehicle, setSelectedVehicle] = useState(null);
        const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
        const [selectedQuote, setSelectedQuote] = useState(null);
        const [checkingQuoteId, setCheckingQuoteId] = useState(null);
        const [approvingQuoteId, setApprovingQuoteId] = useState(null);
        const [checkingInventoryQuoteId, setCheckingInventoryQuoteId] = useState(null);
        const [showInventoryModal, setShowInventoryModal] = useState(false);
        const [inventoryQuote, setInventoryQuote] = useState(null);
        const [inventoryResult, setInventoryResult] = useState(null);
        const [inventoryRejectReason, setInventoryRejectReason] = useState('');
        const [showQuoteDetailModal, setShowQuoteDetailModal] = useState(false);
        const [selectedQuoteDetail, setSelectedQuoteDetail] = useState(null);
        
        // State cho Dealer Manager
        const [managerAllQuotes, setManagerAllQuotes] = useState([]); // Chứa tất cả quotes Manager cần xem
        const [activeManagerTab, setActiveManagerTab] = useState('myQuotes'); // 'myQuotes' | 'staffQuotes'

        const userRole = user?.role?.toUpperCase().replace(/-/g, '_');
        const userId = user?.id || user?.userId || user?.user?.id;
        const dealerId = user?.dealerId || user?.user?.dealerId || null;

        // Quản lý state của form khi modal mở/đóng 
        useEffect(() => {
            if (showCreateQuoteModal && userRole === 'DEALER_MANAGER') {
                setCreateForm(prev => ({ ...prev, customerId: "" }));
                setSelectedCustomer(null);
            } else if (!showCreateQuoteModal) {
                setCreateForm({ customerId: '', vehicleId: '', quantity: 1, unitPrice: '', notes: '' });
                setSelectedCustomer(null);
                setSelectedVehicle(null);
            }
        }, [showCreateQuoteModal, userRole]);

        // Load quotes based on role - ĐÃ SỬA LỖI quotesAPI.getQuotesByDealer
        useEffect(() => {
            const loadQuotes = async () => {
                try {
                    setLoading(true);
                    let data = [];
                    
                    if (userRole === 'DEALER_STAFF' && userId) {
                        data = await quotesAPI.getByUser(userId);
                        setQuotes(sortQuotesByNewest(normalizeQuotes(data)));
                    } else if (userRole === 'DEALER_MANAGER' && userId) { 
                        
                        // SỬA LỖI: Dùng hàm API có sẵn getPendingDealerManagerApproval
                        const [myQuotes, staffQuotes] = await Promise.all([
                            quotesAPI.getByUser(userId), // Quotes Manager tự tạo
                            quotesAPI.getPendingDealerManagerApproval(userId) // Quotes Staff cần duyệt
                        ]);

                        const normalizedMyQuotes = normalizeQuotes(myQuotes);
                        const normalizedStaffQuotes = normalizeQuotes(staffQuotes);

                        // Combine quotes Manager và quotes Staff cần duyệt
                        const combinedManagerData = sortQuotesByNewest([...normalizedMyQuotes, ...normalizedStaffQuotes]);
                        setManagerAllQuotes(combinedManagerData);
                        
                        // Khởi tạo quotes chính bằng My Quotes (tab mặc định)
                        setQuotes(sortQuotesByNewest(normalizedMyQuotes)); 

                    } else if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
                        const [pendingQuotes, approvedQuotes] = await Promise.all([
                            quotesAPI.getPendingEVMApproval(),
                            quotesAPI.getApprovedReadyForOrder()
                        ]);
                        const allWorkflowQuotes = [
                            ...(Array.isArray(pendingQuotes) ? pendingQuotes : []),
                            ...(Array.isArray(approvedQuotes) ? approvedQuotes : [])
                        ];
                        data = allWorkflowQuotes.filter((quote) => {
                            return quote?.creatorRole === 'DEALER_MANAGER';
                        });
                        setQuotes(sortQuotesByNewest(normalizeQuotes(data)));
                    } else {
                        data = await quotesAPI.getAll();
                        setQuotes(sortQuotesByNewest(normalizeQuotes(data)));
                    }
                    
                } catch (error) {
                    console.error('Error loading quotes:', error);
                    showErrorToast(handleAPIError(error));
                    setQuotes([]);
                } finally {
                    setLoading(false);
                }
            };

            loadQuotes();
        }, [userRole, userId, dealerId]); 

        // Logic xử lý khi tab Manager thay đổi
        useEffect(() => {
            if (userRole === 'DEALER_MANAGER') {
                // Lọc My Quotes: Quotes do Manager tạo (userId khớp)
                const myQuotes = sortQuotesByNewest(managerAllQuotes.filter(q => 
                    (q.creatorRole === 'DEALER_MANAGER' || !q.creatorRole) && String(q.userId) === String(userId)
                ));
                
                // Lọc Staff Quotes for Approval: Quotes của Staff đang chờ duyệt
                const staffQuotes = sortQuotesByNewest(managerAllQuotes.filter(q => 
                    q.creatorRole === 'DEALER_STAFF' && q.approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL'
                ));

                if (activeManagerTab === 'myQuotes') {
                    setQuotes(myQuotes);
                } else if (activeManagerTab === 'staffQuotes') {
                    setQuotes(staffQuotes);
                }
                setSelectedStatus('all'); // Reset filter status
            }
        }, [activeManagerTab, userRole, managerAllQuotes, userId]);


        // --- Giữ nguyên các hàm lookup và utility (resolveCustomerName, etc.) ---

        useEffect(() => {
            const loadReferenceData = async () => {
                try {
                    const [customers, vehicles] = await Promise.all([
                        dealerId ? customersAPI.getByDealer(dealerId) : customersAPI.getAll(),
                        vehiclesAPI.getAll(),
                    ]);

                    setAvailableCustomers(Array.isArray(customers) ? customers : []);
                    setAvailableVehicles(Array.isArray(vehicles) ? vehicles : []);
                } catch (error) {
                    console.error('Failed to preload quote reference data:', error);
                }
            };

            if ((dealerId || userRole) && (availableCustomers.length === 0 || availableVehicles.length === 0)) {
                loadReferenceData();
            }
        }, [dealerId, userRole]); // eslint-disable-line react-hooks/exhaustive-deps

        useEffect(() => {
            const map = {};
            availableCustomers.forEach((customer) => {
                // Tạo lookup với nhiều key để dễ tìm
                const candidateIds = [
                    customer.id,
                    customer.customerId,
                    customer.customerID,
                    customer.userId,
                    customer.user?.id,
                    customer.user?.userId
                ];
                candidateIds.forEach((candidate) => {
                    if (candidate !== undefined && candidate !== null && candidate !== '') {
                        map[String(candidate)] = customer;
                    }
                });
            });
            setCustomerLookup(prev => ({ ...prev, ...map }));
        }, [availableCustomers]);

        // Load missing customers from quotes
        useEffect(() => {
            if (!Array.isArray(quotes) || quotes.length === 0) return;
            if (!customerLookup || Object.keys(customerLookup).length === 0) return;

            const missingCustomerIds = new Set();

            quotes.forEach((quote) => {
                let customerId = quote.customerId;
                if (customerId && typeof customerId === 'object') {
                    customerId = customerId.id || customerId.customerId || customerId.userId;
                }
                if (!customerId) {
                    customerId = quote.customer?.id || quote.customer?.customerId || quote.customer?.userId;
                }
                
                if (customerId !== undefined && customerId !== null && customerId !== '') {
                    const key = String(customerId);
                    if (!customerLookup[key] && !availableCustomers.find(c => 
                        String(c.id || c.customerId || c.userId) === key
                    )) {
                        missingCustomerIds.add(customerId);
                    }
                }
            });

            if (missingCustomerIds.size === 0) return;

            let isSubscribed = true;

            (async () => {
                try {
                    // Try to get customers by ID, fallback to getByDealer or getAll if getById doesn't exist
                    const results = await Promise.allSettled(
                        Array.from(missingCustomerIds).map(async (customerId) => {
                            try {
                                if (customersAPI.getById) {
                                    return await customersAPI.getById(customerId);
                                } else {
                                    // Fallback: get all customers and find the one we need
                                    const allCustomers = dealerId 
                                        ? await customersAPI.getByDealer(dealerId)
                                        : await customersAPI.getAll();
                                    return allCustomers.find(c => 
                                        String(c.id || c.customerId || c.userId) === String(customerId)
                                    ) || null;
                                }
                            } catch (error) {
                                console.error(`Failed to fetch customer ${customerId} for quotes page:`, error);
                                throw error;
                            }
                        })
                    );

                    if (!isSubscribed) return;

                    const updates = {};
                    results.forEach((result, index) => {
                        const customerId = Array.from(missingCustomerIds)[index];
                        if (result.status === 'fulfilled' && result.value) {
                            const customer = result.value;
                            const candidateIds = [
                                customer.id,
                                customer.customerId,
                                customer.customerID,
                                customer.userId,
                                customer.user?.id,
                                customer.user?.userId
                            ];
                            candidateIds.forEach((candidate) => {
                                if (candidate !== undefined && candidate !== null && candidate !== '') {
                                    updates[String(candidate)] = customer;
                                }
                            });
                        }
                    });

                    if (Object.keys(updates).length > 0) {
                        setCustomerLookup((prev) => ({ ...prev, ...updates }));
                    }
                } catch (error) {
                    console.error('Error loading missing customers:', error);
                }
            })();

            return () => {
                isSubscribed = false;
            };
        }, [quotes, customerLookup, availableCustomers]);

        useEffect(() => {
            const map = {};
            availableVehicles.forEach((vehicle) => {
                const key = String(vehicle.id ?? vehicle.vehicleId);
                map[key] = vehicle;
            });
            setVehicleLookup(map);
        }, [availableVehicles]);

        const getStatusColor = (status, approvalStatus) => {
            if (approvalStatus === 'REJECTED') return 'var(--color-error)';
            if (approvalStatus === 'APPROVED' && status === 'ACCEPTED') return 'var(--color-success)';
            if (approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL' || approvalStatus === 'PENDING_EVM_APPROVAL') {
                return 'var(--color-warning)';
            }
            if (approvalStatus === 'DRAFT') return 'var(--color-text-muted)';
            return 'var(--color-info)';
        };

        const getStatusLabel = (status, approvalStatus, creatorRole) => {
            if (approvalStatus === 'REJECTED') return 'Rejected';
            if (approvalStatus === 'APPROVED' && status === 'ACCEPTED') {
                if (creatorRole === 'DEALER_STAFF') {
                    return 'Approved by Manager - Ready for Order';
                }
                if (creatorRole === 'DEALER_MANAGER') {
                    return 'Approved by EVM - Ready for Order';
                }
                return 'Approved - Ready for Order';
            }
            if (approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL') return 'Pending Manager Approval';
            if (approvalStatus === 'PENDING_EVM_APPROVAL') {
                return 'Pending EVM Approval (Manager Quote)';
            }
            if (approvalStatus === 'APPROVED' && status === 'DRAFT') {
                return 'Approved - Pending';
            }
            if (approvalStatus === 'DRAFT') return 'Draft';
            return status || 'Unknown';
        };

        const extractQuoteTimestamp = (quote) => {
            if (!quote) return 0;
            const candidates = [
                quote.createdDate,
                quote.createdAt,
                quote.created_on,
                quote.creationDate,
                quote.createdOn,
                quote.updatedDate,
                quote.updatedAt,
                quote.quoteDate,
            ];
            for (const candidate of candidates) {
                if (!candidate) continue;
                const time = new Date(candidate).getTime();
                if (!Number.isNaN(time)) {
                    return time;
                }
            }
            const numericFallback = Number(quote.quoteId ?? quote.id ?? 0);
            return Number.isNaN(numericFallback) ? 0 : numericFallback;
        };

        const sortQuotesByNewest = (list = []) => {
            if (!Array.isArray(list)) return [];
            return [...list].sort((a, b) => extractQuoteTimestamp(b) - extractQuoteTimestamp(a));
        };

        const normalizeQuotes = (data) =>
            Array.isArray(data)
                ? data.map((quote) => ({
                    ...quote,
                    quoteDetails: Array.isArray(quote.quoteDetails)
                        ? quote.quoteDetails
                        : [],
                }))
                : [];

        const resolveCustomer = (quote) => {
            // Xử lý customerId có thể là object hoặc ID
            let customerId = quote.customerId;
            if (customerId && typeof customerId === 'object') {
                customerId = customerId.id || customerId.customerId || customerId.userId;
            }
            if (!customerId) {
                customerId = quote.customer?.id || quote.customer?.customerId || quote.customer?.userId;
            }
            
            // Tìm customer từ lookup với nhiều key
            if (customerId) {
                const customer = customerLookup[String(customerId)];
                if (customer) return customer;
            }
            
            // Fallback: từ quote.customer object
            return quote.customer || null;
        };

        const resolveCustomerName = (quote) => {
            const customer = resolveCustomer(quote);
            if (!customer) {
                // Kiểm tra customerId có phải null không (DEALER_MANAGER quotes)
                let customerId = quote.customerId;
                if (customerId && typeof customerId === 'object') {
                    customerId = customerId.id || customerId.customerId || customerId.userId;
                }
                if (customerId === null || customerId === undefined || customerId === "") {
                    return 'N/A (No customer)';
                }
                return customerId ? `Customer #${customerId}` : 'N/A';
            }
            
            // Lấy tên từ nhiều nguồn, ưu tiên fullName > name > firstName+lastName > email > phone
            if (customer.fullName) {
                return customer.fullName;
            }
            if (customer.name) {
                return customer.name;
            }
            if (customer.firstName || customer.lastName) {
                const firstName = customer.firstName || '';
                const lastName = customer.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                if (fullName) {
                    return fullName;
                }
            }
            if (customer.email) {
                return customer.email;
            }
            if (customer.phone) {
                return customer.phone;
            }
            return customer.id ? `Customer #${customer.id}` : 'N/A';
        };

        const resolveVehicleDetail = (quote) => {
            const firstDetail = Array.isArray(quote.quoteDetails)
                ? quote.quoteDetails[0]
                : null;
            if (!firstDetail) return { detail: null, vehicle: null };
            const vehicle =
                vehicleLookup[String(firstDetail.vehicleId)] || quote.vehicle || null;
            return { detail: firstDetail, vehicle };
        };

        const resolveVehicleName = (quote) => {
            const { detail, vehicle } = resolveVehicleDetail(quote);
            if (vehicle) {
                // Ưu tiên: brand + modelName > modelName > name > model > vehicleName
                if (vehicle.brand && vehicle.modelName) {
                    return `${vehicle.brand} ${vehicle.modelName}`;
                }
                if (vehicle.modelName) {
                    return vehicle.modelName;
                }
                if (vehicle.brand && vehicle.name) {
                    return `${vehicle.brand} ${vehicle.name}`;
                }
                return (
                    vehicle.name ||
                    vehicle.model ||
                    vehicle.vehicleName ||
                    vehicle.displayName ||
                    vehicle.title ||
                    (detail?.vehicleId ? `Vehicle #${detail.vehicleId}` : 'N/A')
                );
            }
            return detail?.vehicleId ? `Vehicle #${detail.vehicleId}` : 'N/A';
        };

        const resolveTotalAmount = (quote) => {
            const { detail } = resolveVehicleDetail(quote);
            return (
                quote.finalTotal ||
                quote.totalAmount ||
                detail?.totalAmount ||
                0
            );
        };

        const refreshManagerQuotes = async (tabToRender = activeManagerTab) => {
            if (userRole !== 'DEALER_MANAGER' || !userId) {
                return;
            }

            const [myQuotes, staffQuotes] = await Promise.all([
                quotesAPI.getByUser(userId),
                quotesAPI.getPendingDealerManagerApproval(userId)
            ]);

            const normalizedMyQuotes = normalizeQuotes(myQuotes);
            const normalizedStaffQuotes = normalizeQuotes(staffQuotes);

            const combinedManagerData = sortQuotesByNewest([...normalizedMyQuotes, ...normalizedStaffQuotes]);
            setManagerAllQuotes(combinedManagerData);
            setQuotes(sortQuotesByNewest(tabToRender === 'myQuotes' ? normalizedMyQuotes : normalizedStaffQuotes));
        };

        const handleSubmitForApproval = async (quoteId) => {
            if (!userId) {
                showErrorToast('User ID not found');
                return;
            }

            try {
                if (userRole === 'DEALER_STAFF') {
                    await quotesAPI.submitForDealerManagerApproval(quoteId, userId);
                    showSuccessToast('Quote submitted for manager approval successfully');
                } else if (userRole === 'DEALER_MANAGER') {
                    await quotesAPI.submitForEVMApproval(quoteId);
                    showSuccessToast('Quote submitted for EVM approval successfully');
                }
                
                // Reload quotes data sau khi submit - ĐÃ SỬA LỖI API
                if (userRole === 'DEALER_MANAGER' && userId) {
                    await refreshManagerQuotes('myQuotes');
                } else if (userId) {
                    const data = await quotesAPI.getByUser(userId);
                    setQuotes(sortQuotesByNewest(normalizeQuotes(data)));
                }
                
            } catch (error) {
                console.error('Error submitting quote:', error);
                showErrorToast(handleAPIError(error));
            }
        };

        const handleCreateOrder = async (quote) => {
            const id = quote.quoteId || quote.id;
            if (!id) {
                showErrorToast('Quote information is invalid');
                return;
            }

            try {
                setCheckingQuoteId(id);
                const canCreate = await quotesAPI.canCreateOrder(id);

                if (canCreate !== true && canCreate !== 'true') {
                    showErrorToast('Quote is not yet eligible to create an order. Please ensure it is approved and accepted.');
                    return;
                }

                setSelectedQuote(quote);
                setShowCreateOrderModal(true);
            } catch (error) {
                console.error('Error checking quote eligibility:', error);
                showErrorToast(handleAPIError(error));
            } finally {
                setCheckingQuoteId(null);
            }
        };

        const filteredQuotes = quotes.filter(quote => {
            const matchesStatus = selectedStatus === 'all' || 
                (selectedStatus === 'draft' && quote.approvalStatus === 'DRAFT') ||
                (selectedStatus === 'pending' && (quote.approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL' || quote.approvalStatus === 'PENDING_EVM_APPROVAL')) ||
                (selectedStatus === 'approved' && quote.approvalStatus === 'APPROVED' && quote.status === 'ACCEPTED') ||
                (selectedStatus === 'rejected' && quote.approvalStatus === 'REJECTED');
            
            const customerName = resolveCustomerName(quote);
            const vehicleName = resolveVehicleName(quote);
            const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    quote.quoteId?.toString().includes(searchTerm);
            
            return matchesStatus && matchesSearch;
        });

        const canSubmitForApproval = (quote) => {
            if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
                return false;
            }

            const isOwnQuote = String(quote.userId) === String(userId);
            const isDraft = quote.approvalStatus === 'DRAFT' && quote.status === 'DRAFT';

            if (!isOwnQuote || !isDraft) {
                return false;
            }

            if (userRole === 'DEALER_STAFF') {
                return !quote?.creatorRole || quote.creatorRole === 'DEALER_STAFF';
            }

            if (userRole === 'DEALER_MANAGER') {
                const isManagerQuote = !quote?.creatorRole || quote.creatorRole === 'DEALER_MANAGER';
                return activeManagerTab === 'myQuotes' && isManagerQuote;
            }

            return false;
        };

        const canApprove = (quote) => {
            // Chỉ Manager mới có quyền Approve quotes của Staff và đang ở tab Staff Quotes
            return userRole === 'DEALER_MANAGER' && 
                activeManagerTab === 'staffQuotes' &&
                quote.creatorRole === 'DEALER_STAFF' && 
                quote.approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL';
        };

        const canCreateOrder = (quote) => {
            if (userRole === 'EVM_MANAGER' || userRole === 'ADMIN') {
                return false;
            }
            // Chỉ cho phép tạo Order nếu là quote của chính user đó và đã được APPROVED và ACCEPTED
            return String(quote.userId) === String(userId) &&
                    quote.approvalStatus === 'APPROVED' && 
                    quote.status === 'ACCEPTED';
        };

        const closeInventoryModal = () => {
            setShowInventoryModal(false);
            setInventoryQuote(null);
            setInventoryResult(null);
            setInventoryRejectReason('');
        };

        const handleCheckInventory = async (quote) => {
            const quoteId = quote?.quoteId || quote?.id;

            if (!quoteId) {
                showErrorToast('Thông tin báo giá không hợp lệ');
                return;
            }

            setCheckingInventoryQuoteId(quoteId);
            try {
                const result = await quotesAPI.checkDealerInventory(quoteId);
                setInventoryQuote(quote);
                setInventoryResult(result);
                setInventoryRejectReason(result?.message || '');
                setShowInventoryModal(true);
            } catch (error) {
                console.error('Error checking dealer inventory:', error);
                showErrorToast(handleAPIError(error));
            } finally {
                setCheckingInventoryQuoteId(null);
            }
        };

        const handleApproveQuote = async (quoteId) => {
            if (!userId) {
                showErrorToast('Manager ID not found');
                return;
            }

            setApprovingQuoteId(quoteId);
            try {
                const inventoryCheck = await quotesAPI.checkDealerInventory(quoteId);
                setInventoryResult(inventoryCheck);
                setInventoryRejectReason(inventoryCheck?.message || '');

                if (!inventoryCheck?.hasSufficientInventory) {
                    const message =
                        inventoryCheck?.message ||
                        'Kho đại lý không đủ xe để duyệt báo giá này. Vui lòng bổ sung hàng tồn hoặc điều chỉnh báo giá.';
                    showErrorToast(message);
                    return;
                }

                // Dùng hàm API có sẵn để Approve
                await quotesAPI.approveByDealerManager(quoteId, userId, "Approved by Manager"); 
                showSuccessToast(`Quote #${quoteId} approved successfully!`);

                await refreshManagerQuotes('staffQuotes');
                closeInventoryModal();

            } catch (error) {
                console.error('Error approving quote:', error);
                showErrorToast(handleAPIError(error));
            } finally {
                setApprovingQuoteId(null);
            }
        };

        const processManagerReject = async (quote, reason, targetTab = 'staffQuotes') => {
            if (!quote || !userId) {
                throw new Error('Quote hoặc Manager ID không hợp lệ');
            }

            const quoteId = quote.quoteId || quote.id;
            await quotesAPI.rejectByDealerManager(quoteId, userId, reason);
            showSuccessToast(`Đã từ chối báo giá #${quoteId}`);
            await refreshManagerQuotes(targetTab);
        };

        const handleRejectAfterInventory = async () => {
            if (!inventoryQuote || !userId) {
                showErrorToast('Quote hoặc Manager ID không hợp lệ');
                return;
            }

            if (!inventoryRejectReason.trim()) {
                showErrorToast('Vui lòng nhập lý do từ chối');
                return;
            }

            try {
                await processManagerReject(inventoryQuote, inventoryRejectReason.trim(), 'staffQuotes');
                closeInventoryModal();
            } catch (error) {
                console.error('Error rejecting quote after inventory check:', error);
                showErrorToast(handleAPIError(error));
            }
        };


        // Xác định xem có nên ẩn cột Customer hay không
        const hideCustomerColumn = userRole === 'DEALER_MANAGER' && activeManagerTab === 'myQuotes';

        const detailModalCardStyle = {
            padding: '20px',
            borderRadius: 'var(--radius)',
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'var(--color-surface)',
            boxShadow: '0 14px 34px rgba(15,23,42,0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        };

        const detailSectionTitleStyle = {
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '8px'
        };

        const detailRowStyle = {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: 'var(--color-text)',
            gap: '12px'
        };

        const detailLabelStyle = {
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            minWidth: '120px'
        };

        const renderDetailRow = (label, value) => {
            if (value === undefined || value === null || value === '') return null;
            return (
                <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>{label}</span>
                    <span style={{ textAlign: 'right', flex: 1 }}>{value}</span>
                </div>
            );
        };


        if (loading) {
            return (
                <div className="main">
                    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}></i>
                        <div style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>Loading quotes...</div>
                    </div>
                </div>
            );
        }

        return (
            <div className="main">
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2>Quotes Management</h2>
                        {(userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') && (
                            <button className="btn btn-primary" onClick={() => setShowCreateQuoteModal(true)}>
                                <i className="bx bx-plus"></i>
                                Create New Quote
                            </button>
                        )}
                    </div>

                    {/* Phân Tab cho DEALER MANAGER */}
                    {userRole === 'DEALER_MANAGER' && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <button
                                onClick={() => setActiveManagerTab('myQuotes')}
                                className={`btn ${activeManagerTab === 'myQuotes' ? 'btn-primary' : 'btn-outline'}`}
                            >
                                My Quotes
                            </button>
                            <button
                                onClick={() => setActiveManagerTab('staffQuotes')}
                                className={`btn ${activeManagerTab === 'staffQuotes' ? 'btn-primary' : 'btn-outline'}`}
                            >
                                Staff Quotes for Approval ({managerAllQuotes.filter(q => q.creatorRole === 'DEALER_STAFF' && q.approvalStatus === 'PENDING_DEALER_MANAGER_APPROVAL').length})
                            </button>
                        </div>
                    )}
                    {/* Kết thúc Phân Tab */}


                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <div style={{ position: 'relative' }}>
                                <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
                                <input
                                    type="text"
                                    placeholder="Search quotes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px 10px 40px',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius)',
                                        background: 'var(--color-bg)',
                                        color: 'var(--color-text)',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['all', 'draft', 'pending', 'approved', 'rejected'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`btn ${selectedStatus === status ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quotes Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>ID</th>
                                    
                                    {/* Ẩn cột Customer cho DEALER_MANAGER khi ở tab My Quotes */}
                                    {!hideCustomerColumn && (
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Customer</th>
                                    )}

                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Vehicle</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Total</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Created</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredQuotes.map((quote) => {
                                    const customerName = resolveCustomerName(quote);
                                    const vehicleName = resolveVehicleName(quote);
                                    const totalAmount = resolveTotalAmount(quote);
                                    const statusColor = getStatusColor(quote.status, quote.approvalStatus);
                                    const statusLabel = getStatusLabel(quote.status, quote.approvalStatus, quote.creatorRole);
                                    
                                    return (
                                        <tr key={quote.quoteId || quote.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', fontWeight: '600' }}>
                                                #{quote.quoteId || quote.id}
                                            </td>
                                            
                                            {/* Ẩn ô Customer cho DEALER_MANAGER khi ở tab My Quotes */}
                                            {!hideCustomerColumn && (
                                                <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{customerName}</td>
                                            )}
                                            
                                            <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{vehicleName}</td>
                                            <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-primary)', fontWeight: '600', textAlign: 'right' }}>
                                                ${totalAmount.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <div style={{
                                                    padding: '4px 12px',
                                                    borderRadius: 'var(--radius)',
                                                    background: 'var(--color-bg)',
                                                    color: statusColor,
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    display: 'inline-block',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {statusLabel}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                                                {quote.createdDate ? new Date(quote.createdDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    
                                                    {/* Action Approve cho Staff Quotes for Approval */}
                                                    {canApprove(quote) && (
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{
                                                                padding: '6px 12px',
                                                                fontSize: '12px',
                                                                borderColor: 'var(--color-primary)',
                                                                color: 'var(--color-primary)'
                                                            }}
                                                            onClick={() => handleCheckInventory(quote)}
                                                            title="Kiểm tra tồn kho trước khi duyệt"
                                                            disabled={checkingInventoryQuoteId === (quote.quoteId || quote.id)}
                                                        >
                                                            <i className={`bx ${checkingInventoryQuoteId === (quote.quoteId || quote.id) ? 'bx-loader-alt bx-spin' : 'bx-analyse'}`}></i>
                                                            {checkingInventoryQuoteId === (quote.quoteId || quote.id) ? 'Checking...' : 'Check Inventory'}
                                                        </button>
                                                    )}

                                                    {/* Action Submit/Create Order (Chỉ áp dụng cho My Quotes) */}
                                                    {userRole === 'DEALER_MANAGER' && activeManagerTab === 'myQuotes' && canSubmitForApproval(quote) && (
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                                            onClick={() => handleSubmitForApproval(quote.quoteId || quote.id)}
                                                            title="Submit quote to EVM manager for approval"
                                                        >
                                                            <i className="bx bx-send"></i>
                                                            Submit to EVM
                                                        </button>
                                                    )}

                                                    {userRole === 'DEALER_STAFF' && canSubmitForApproval(quote) && (
                                                        <button 
                                                            className="btn btn-primary" 
                                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                                            onClick={() => handleSubmitForApproval(quote.quoteId || quote.id)}
                                                            title="Submit for Manager Approval"
                                                        >
                                                            <i className="bx bx-send"></i>
                                                            Submit to Manager
                                                        </button>
                                                    )}

                                                    {/* Action View Details */}
                                                    <button 
                                                        className="btn btn-outline" 
                                                        style={{ padding: '6px', fontSize: '14px' }} 
                                                        title="View Details"
                                                        onClick={() => {
                                                            setSelectedQuoteDetail(quote);
                                                            setShowQuoteDetailModal(true);
                                                        }}
                                                    >
                                                        <i className="bx bx-show"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredQuotes.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                            <i className="bx bx-file" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                            <div>No quotes found</div>
                        </div>
                    )}
                </div>

                {/* Create Quote Modal (Giữ nguyên) */}
                {showCreateQuoteModal && (
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
                            maxWidth: '620px',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3>Create New Quote</h3>
                                <button 
                                    onClick={() => setShowCreateQuoteModal(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                >
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>

                            {/* Load options when modal opens */}
                            {(() => {
                                if (availableCustomers.length === 0 || availableVehicles.length === 0) {
                                    (async () => {
                                        try {
                                            const [customers, vehicles] = await Promise.all([
                                                dealerId ? customersAPI.getByDealer(dealerId) : customersAPI.getAll(),
                                                vehiclesAPI.getAll()
                                            ]);
                                            setAvailableCustomers(Array.isArray(customers) ? customers : []);
                                            setAvailableVehicles(Array.isArray(vehicles) ? vehicles : []);
                                        } catch (err) {
                                            console.error('Failed to load dropdown data:', err);
                                        }
                                    })();
                                }
                                return null;
                            })()}

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!userId) {
                                    showErrorToast('User ID not found');
                                    return;
                                }
                                if (userRole === 'DEALER_STAFF' && !createForm.customerId) {
                                    showErrorToast('Please select a customer');
                                    return;
                                }
                                if (!createForm.vehicleId || !createForm.quantity || !createForm.unitPrice) {
                                    showErrorToast('Please fill in required fields');
                                    return;
                                }
                                if (!dealerId) {
                                    showErrorToast('Dealer ID not found');
                                    return;
                                }
                                try {
                                    setCreateLoading(true);
                                    const creatorRole = userRole === 'DEALER_MANAGER' ? 'DEALER_MANAGER' : 'DEALER_STAFF';
                                    
                                    const customerIdForApi = userRole === 'DEALER_MANAGER' 
                                        ? null 
                                        : (createForm.customerId ? Number(createForm.customerId) : null);

                                    const payload = {
                                        customerId: customerIdForApi,
                                        notes: createForm.notes || '',
                                        userId: Number(userId),
                                        dealerId: Number(dealerId),
                                        creatorRole: creatorRole,
                                        quoteDetails: [
                                            {
                                                vehicleId: Number(createForm.vehicleId),
                                                quantity: Number(createForm.quantity),
                                                unitPrice: Number(createForm.unitPrice),
                                                promotionDiscount: 0,
                                            },
                                        ],
                                    };
                                    await quotesAPI.create(payload);
                                    showSuccessToast('Quote created successfully');
                                    
                                    // Logic reload phức tạp hơn vì Manager có 2 list. Dùng logic fetch ban đầu:
                                    if (userRole === 'DEALER_MANAGER' && userId) {
                                        const [myQuotes, staffQuotes] = await Promise.all([
                                            quotesAPI.getByUser(userId), 
                                            quotesAPI.getPendingDealerManagerApproval(userId)
                                        ]);

                                        const normalizedMyQuotes = normalizeQuotes(myQuotes);
                                        const normalizedStaffQuotes = normalizeQuotes(staffQuotes);

                                        const combinedManagerData = [...normalizedMyQuotes, ...normalizedStaffQuotes];
                                        setManagerAllQuotes(combinedManagerData);
                                        setActiveManagerTab('myQuotes'); 
                                    } else if (userId) {
                                        const data = await quotesAPI.getByUser(userId);
                                        setQuotes(sortQuotesByNewest(normalizeQuotes(data)));
                                    } else {
                                        const data = await quotesAPI.getAll();
                                        setQuotes(sortQuotesByNewest(normalizeQuotes(data)));
                                    }
                                    
                                    setShowCreateQuoteModal(false);
                                } catch (error) {
                                    console.error('Error creating quote:', error);
                                    showErrorToast(handleAPIError(error));
                                } finally {
                                    setCreateLoading(false);
                                }
                            }}>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    
                                    {/* START: Customer Field - ẨN NẾU LÀ DEALER_MANAGER */}
                                    {userRole !== 'DEALER_MANAGER' && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                                                Customer *
                                            </label>
                                            <select
                                                value={createForm.customerId}
                                                onChange={(e) => {
                                                    const cid = e.target.value;
                                                    setCreateForm({ ...createForm, customerId: cid });
                                                    const c = availableCustomers.find(x => String(x.id || x.customerId) === String(cid));
                                                    setSelectedCustomer(c || null);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius)',
                                                    background: 'var(--color-bg)',
                                                    color: 'var(--color-text)',
                                                    fontSize: '14px'
                                                }}
                                                required={userRole === 'DEALER_STAFF'} 
                                            >
                                                <option value="">Select customer</option> 
                                                {availableCustomers.map(c => (
                                                    <option key={c.id || c.customerId} value={c.id || c.customerId}>
                                                        {(c.fullName || c.name || 'Unknown')} {c.isVip ? '(VIP)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            {selectedCustomer?.isVip && (
                                                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-success)' }}>
                                                    VIP customer - discount will be applied automatically
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* END: Customer Field */}

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                                            Vehicle *
                                        </label>
                                        <select
                                            value={createForm.vehicleId}
                                            onChange={(e) => {
                                                const vid = e.target.value;
                                                const v = availableVehicles.find(x => String(x.id || x.vehicleId) === String(vid));
                                                setSelectedVehicle(v || null);
                                                setCreateForm({ 
                                                    ...createForm, 
                                                    vehicleId: vid, 
                                                    unitPrice: v?.listedPrice ? Number(v.listedPrice) : createForm.unitPrice 
                                                });
                                                if (!v?.listedPrice && vid) {
                                                    vehiclesAPI.getById(vid).then(detail => {
                                                        if (detail?.listedPrice) {
                                                            setCreateForm(prev => ({ ...prev, unitPrice: Number(detail.listedPrice) }));
                                                        }
                                                    }).catch(() => {});
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius)',
                                                background: 'var(--color-bg)',
                                                color: 'var(--color-text)',
                                                fontSize: '14px'
                                            }}
                                            required
                                        >
                                            <option value="">Select vehicle</option>
                                            {availableVehicles.map(v => {
                                                // Ưu tiên: brand + modelName > modelName > name > model > vehicleName
                                                let vehicleDisplayName = '';
                                                if (v.brand && v.modelName) {
                                                    vehicleDisplayName = `${v.brand} ${v.modelName}`;
                                                } else if (v.modelName) {
                                                    vehicleDisplayName = v.modelName;
                                                } else if (v.brand && v.name) {
                                                    vehicleDisplayName = `${v.brand} ${v.name}`;
                                                } else if (v.name) {
                                                    vehicleDisplayName = v.name;
                                                } else if (v.model) {
                                                    vehicleDisplayName = v.model;
                                                } else if (v.vehicleName) {
                                                    vehicleDisplayName = v.vehicleName;
                                                } else {
                                                    vehicleDisplayName = 'Vehicle';
                                                }
                                                
                                                return (
                                                    <option key={v.id || v.vehicleId} value={v.id || v.vehicleId}>
                                                        {vehicleDisplayName} {v.listedPrice ? `($${Number(v.listedPrice).toLocaleString()})` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                                                Quantity *
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={createForm.quantity}
                                                onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius)',
                                                    background: 'var(--color-bg)',
                                                    color: 'var(--color-text)',
                                                    fontSize: '14px'
                                                }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                                                Unit Price ($) *
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={createForm.unitPrice}
                                                onChange={(e) => setCreateForm({ ...createForm, unitPrice: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius)',
                                                    background: 'var(--color-bg)',
                                                    color: 'var(--color-text)',
                                                    fontSize: '14px'
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                                            Notes
                                        </label>
                                        <textarea
                                            value={createForm.notes}
                                            onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius)',
                                                background: 'var(--color-bg)',
                                                color: 'var(--color-text)',
                                                fontSize: '14px',
                                                minHeight: '80px',
                                                resize: 'vertical'
                                            }}
                                            placeholder="Additional notes..."
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline" 
                                        onClick={() => setShowCreateQuoteModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={createLoading}>
                                        <i className={`bx ${createLoading ? 'bx-loader-alt bx-spin' : 'bx-save'}`}></i>
                                        {createLoading ? 'Creating...' : 'Create Quote'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Dealer Inventory Check Modal */}
                {showInventoryModal && inventoryQuote && (
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
                        zIndex: 1100
                    }}>
                        <div style={{
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius)',
                            padding: '24px',
                            width: '90%',
                            maxWidth: '520px',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0 }}>Kiểm tra tồn kho đại lý</h3>
                                <button
                                    onClick={closeInventoryModal}
                                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                >
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
                                Quote #{inventoryQuote.quoteId || inventoryQuote.id}
                            </p>

                            <div style={{
                                padding: '16px',
                                borderRadius: 'var(--radius)',
                                background: inventoryResult?.hasSufficientInventory ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                border: `1px solid ${inventoryResult?.hasSufficientInventory ? 'var(--color-success)' : 'var(--color-error)'}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <i
                                        className={`bx ${inventoryResult?.hasSufficientInventory ? 'bx-check-circle' : 'bx-error-circle'}`}
                                        style={{
                                            fontSize: '24px',
                                            color: inventoryResult?.hasSufficientInventory ? 'var(--color-success)' : 'var(--color-error)'
                                        }}
                                    ></i>
                                    <div>
                                        <div style={{ fontWeight: 600, color: inventoryResult?.hasSufficientInventory ? 'var(--color-success)' : 'var(--color-error)', marginBottom: '4px' }}>
                                            {inventoryResult?.hasSufficientInventory ? 'Kho đủ hàng' : 'Kho không đủ hàng'}
                                        </div>
                                        <div style={{ color: 'var(--color-text)' }}>
                                            {inventoryResult?.message || 'Không có thông tin chi tiết về tồn kho.'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!inventoryResult?.hasSufficientInventory && (
                                <div style={{ marginTop: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                                        Lý do từ chối <span style={{ color: 'var(--color-error)' }}>*</span>
                                    </label>
                                    <textarea
                                        value={inventoryRejectReason}
                                        onChange={(e) => setInventoryRejectReason(e.target.value)}
                                        placeholder="Nhập lý do hoặc ghi chú bổ sung..."
                                        style={{
                                            width: '100%',
                                            minHeight: '120px',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius)',
                                            padding: '12px',
                                            fontSize: '14px',
                                            background: 'var(--color-bg)',
                                            color: 'var(--color-text)',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button
                                    className="btn btn-outline"
                                    onClick={closeInventoryModal}
                                >
                                    Đóng
                                </button>
                                {inventoryResult?.hasSufficientInventory ? (
                                    <button
                                        className="btn btn-success"
                                        style={{
                                            background: 'var(--color-success)',
                                            borderColor: 'var(--color-success)',
                                            color: '#fff'
                                        }}
                                        onClick={() => handleApproveQuote(inventoryQuote.quoteId || inventoryQuote.id)}
                                        disabled={approvingQuoteId === (inventoryQuote.quoteId || inventoryQuote.id)}
                                    >
                                        <i className={`bx ${approvingQuoteId === (inventoryQuote.quoteId || inventoryQuote.id) ? 'bx-loader-alt bx-spin' : 'bx-check'}`}></i>
                                        {approvingQuoteId === (inventoryQuote.quoteId || inventoryQuote.id) ? 'Approving...' : 'Approve'}
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-danger"
                                        style={{
                                            background: 'var(--color-error)',
                                            borderColor: 'var(--color-error)',
                                            color: '#fff'
                                        }}
                                        onClick={handleRejectAfterInventory}
                                    >
                                        <i className="bx bx-x"></i>
                                        Reject
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Order Modal - Giữ nguyên */}
                {showCreateOrderModal && selectedQuote && (
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
                            maxWidth: '500px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3>Create Order from Quote</h3>
                                <button 
                                    onClick={() => {
                                        setShowCreateOrderModal(false);
                                        setSelectedQuote(null);
                                    }}
                                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                >
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
                                Quote #{selectedQuote.quoteId || selectedQuote.id} - Total: ${(selectedQuote.finalTotal || selectedQuote.totalAmount || 0).toLocaleString()}
                            </p>
                            <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
                                Redirecting to Orders page to create order...
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button 
                                    className="btn btn-outline" 
                                    onClick={() => {
                                        setShowCreateOrderModal(false);
                                        setSelectedQuote(null);
                                    }}  
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => {
                                        // Store selected quote in localStorage or navigate to Orders with quoteId
                                        localStorage.setItem('selectedQuoteForOrder', JSON.stringify(selectedQuote));
                                        setShowCreateOrderModal(false);
                                        setSelectedQuote(null);
                                        // Trigger navigation to Orders - this will be handled by parent component
                                        window.dispatchEvent(new CustomEvent('navigateToOrders', { detail: { quoteId: selectedQuote.quoteId || selectedQuote.id } }));
                                    }}
                                >
                                    Go to Orders
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quote Detail Modal */}
                {showQuoteDetailModal && selectedQuoteDetail && (
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
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3>Quote Details</h3>
                                <button 
                                    onClick={() => {
                                        setShowQuoteDetailModal(false);
                                        setSelectedQuoteDetail(null);
                                    }}
                                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                >
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>

                            {(() => {
                                const { detail, vehicle } = resolveVehicleDetail(selectedQuoteDetail);
                                const vehicleName = resolveVehicleName(selectedQuoteDetail);
                                const totalAmount = resolveTotalAmount(selectedQuoteDetail);
                                
                                // Lấy customer từ quote, ưu tiên từ customerLookup
                                const customer = resolveCustomer(selectedQuoteDetail);
                                const customerName = resolveCustomerName(selectedQuoteDetail);

                                const status = selectedQuoteDetail.status || selectedQuoteDetail.quoteStatus || '';
                                const approvalStatus = selectedQuoteDetail.approvalStatus || selectedQuoteDetail.workflowStatus || '';
                                const combinedStatus = [approvalStatus, status].filter(Boolean).join(' - ') || 'N/A';

                                return (
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        <div style={detailModalCardStyle}>
                                            <div style={detailSectionTitleStyle}>Quote Overview</div>
                                            {renderDetailRow('ID', `#${selectedQuoteDetail.quoteId || selectedQuoteDetail.id}`)}
                                            {renderDetailRow('Status', combinedStatus)}
                                            {renderDetailRow('Created', selectedQuoteDetail.createdDate ? new Date(selectedQuoteDetail.createdDate).toLocaleDateString() : 'N/A')}
                                            {renderDetailRow('Total Value', `$${totalAmount.toLocaleString()}`)}
                                        </div>

                                        {/* Customer details */}
                                        {userRole === 'DEALER_STAFF' && (
                                            <div style={detailModalCardStyle}>
                                                <div style={detailSectionTitleStyle}>Customer</div>
                                                {renderDetailRow('Name', customerName)}
                                                {renderDetailRow('Email', customer?.email)}
                                                {renderDetailRow('Phone', customer?.phone)}
                                            </div>
                                        )}

                                        <div style={detailModalCardStyle}>
                                            <div style={detailSectionTitleStyle}>Vehicle & Pricing</div>
                                            {renderDetailRow('Name', vehicleName)}
                                            {renderDetailRow('Brand', vehicle?.brand)}
                                            {renderDetailRow('Model', vehicle?.modelName || vehicle?.name)}
                                            {renderDetailRow('Year', vehicle?.yearOfManufacture)}
                                            {renderDetailRow('Listed Price', vehicle?.listedPrice ? `$${vehicle.listedPrice.toLocaleString()}` : null)}
                                            {renderDetailRow('Quantity', detail?.quantity)}
                                            {renderDetailRow('Unit Price', detail?.unitPrice ? `$${detail.unitPrice.toLocaleString()}` : null)}
                                        </div>

                                        {selectedQuoteDetail.notes && (
                                            <div style={detailModalCardStyle}>
                                                <div style={detailSectionTitleStyle}>Notes</div>
                                                <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                                                    {selectedQuoteDetail.notes}
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                            <button 
                                                className="btn btn-outline" 
                                                onClick={() => {
                                                    setShowQuoteDetailModal(false);
                                                    setSelectedQuoteDetail(null);
                                                }}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    export default Quotes;