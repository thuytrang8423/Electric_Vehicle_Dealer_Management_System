import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { ordersAPI, dealersAPI, usersAPI, customersAPI, handleAPIError } from '../../utils/api';
import 'boxicons/css/boxicons.min.css';

const Dashboard = ({ user }) => {
  // Role-specific data
  const dealerStaffData = {
    stats: [
      { label: 'Total Customers', value: '0', change: '—', icon: 'bx-user', color: 'primary' },
      { label: 'Active Customers', value: '0', change: '—', icon: 'bx-user-check', color: 'success' },
      { label: 'Customers with Orders', value: '0', change: '—', icon: 'bx-user-voice', color: 'accent' },
      { label: 'Total Orders', value: '0', change: '—', icon: 'bx-cart-alt', color: 'secondary' }
    ],
    statusBreakdown: [],
    recentCustomers: [],
    orderSummary: {
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      rejectedOrders: 0,
      revenue: 0,
      averageOrder: 0,
      customersWithOrders: 0
    },
    monthlyOrders: [],
    vehicleDistribution: [],
    feedbackSummary: {
      totalFeedback: 0,
      resolvedFeedback: 0,
      pendingFeedback: 0,
      feedbackByMonth: []
    }
  };

  const dealerManagerDefaults = {
    stats: [
      { label: 'Total Customers', value: '0', change: '—', icon: 'bx-user', color: 'primary' },
      { label: 'Total Staff', value: '0', change: '—', icon: 'bx-group', color: 'secondary' },
      { label: 'Orders Placed', value: '0', change: '—', icon: 'bx-cart', color: 'success' },
      { label: 'Orders Rejected', value: '0', change: '—', icon: 'bx-x-circle', color: 'warning' }
    ],
    revenueTrend: [],
    orderStatus: [],
    feedbackList: [],
    recentCustomers: [],
    staffMembers: [],
    orderSummary: {
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      rejectedOrders: 0,
      revenue: 0,
      averageOrder: 0,
      customersWithOrders: 0
    }
  };

  const [dealerStaffOverview, setDealerStaffOverview] = useState({
    stats: dealerStaffData.stats,
    statusBreakdown: [],
    recentCustomers: [],
    orderSummary: {
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      revenue: 0,
      averageOrder: 0,
      customersWithOrders: 0
    },
    monthlyOrders: [],
    vehicleDistribution: [],
    feedbackSummary: {
      totalFeedback: 0,
      resolvedFeedback: 0,
      pendingFeedback: 0,
      feedbackByMonth: []
    }
  });
  const [dealerStaffLoading, setDealerStaffLoading] = useState(false);
  const [dealerStaffError, setDealerStaffError] = useState(null);
  const [dealerManagerOverview, setDealerManagerOverview] = useState(dealerManagerDefaults);
  const [dealerManagerLoading, setDealerManagerLoading] = useState(false);
  const [dealerManagerError, setDealerManagerError] = useState(null);

  // EVM Manager state
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [systemStatus, setSystemStatus] = useState({
    orderStatusCounts: {},
    totalSales: 0
  });
  const [dealerPerformance, setDealerPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeDealers: 0,
    totalDealers: 0
  });
  const [userSummary, setUserSummary] = useState({
    totalUsers: 0,
    roleCounts: {},
    statusCounts: {}
  });
  const pieColors = ['#DC2626', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#0EA5E9', '#6366F1', '#10B981'];

  // Normalize role helpers
  const normalizedRole = String(user?.role ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');

  const isDealerStaff = normalizedRole === 'dealer-staff';
  const isDealerManager = normalizedRole === 'dealer-manager';
  const isEVMManager = normalizedRole === 'evm-manager' || normalizedRole === 'evm-staff';
  const isAdmin = normalizedRole === 'admin';

  const roleDisplayMap = {
    'admin': 'Admin',
    'dealer-manager': 'Dealer Manager',
    'dealer-staff': 'Dealer Staff',
    'evm-manager': 'EVM Manager'
  };

  const statusDisplayMap = {
    'active': 'Active',
    'inactive': 'Inactive',
    'pending': 'Pending',
    'suspended': 'Suspended'
  };

  const normalizeUserRole = (role) => String(role ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  const normalizeUserStatus = (status) => String(status ?? '').trim().toLowerCase();
  const toDisplayLabel = (label, map) => {
    if (!label) return 'Unknown';
    if (map[label]) return map[label];
    return label
      .split(/[-_\s]/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Unknown';
  };
  const formatStatusLabel = (label) => {
    if (!label) return 'Unknown';
    return String(label)
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Unknown';
  };

  const resolveDealerId = useCallback(async () => {
    if (user?.dealerId) {
      return user.dealerId;
    }
    if (user?.id) {
      try {
        const profile = await usersAPI.getById(user.id);
        return profile?.dealerId ?? null;
      } catch (err) {
        console.error('Failed to fetch user profile for dealer context:', err);
      }
    }
    return null;
  }, [user?.dealerId, user?.id]);

  const aggregateDashboardData = (orders = [], dealers = [], from, to) => {
    const toDateObject = (value, endOfDay = false) => {
      if (!value) return null;
      const base = new Date(value);
      if (!Number.isNaN(base.getTime())) {
        if (endOfDay) {
          base.setHours(23, 59, 59, 999);
        } else {
          base.setHours(0, 0, 0, 0);
        }
        return base;
      }
      const fallback = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    const start = toDateObject(from);
    const end = toDateObject(to, true);

    const normalizeDate = (value) => {
      if (!value) return null;
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
      const fallback = new Date(`${value}T00:00:00`);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    const normalizeAmount = (value) => {
      const amount = Number(value ?? 0);
      return Number.isNaN(amount) ? 0 : amount;
    };

    const normalizeStatus = (status) =>
      String(status ?? 'UNKNOWN').trim().toUpperCase();

    const statusCounts = {};
    let totalSales = 0;
    let totalOrders = 0;
    const dealerStats = new Map();

    orders.forEach((order) => {
      const orderDate = normalizeDate(
        order.orderDate ||
        order.date ||
        order.createdAt ||
        order.created_at ||
        order.requestTime ||
        order.request_time
      );

      if (start && orderDate && orderDate < start) return;
      if (end && orderDate && orderDate > end) return;

      const amount = normalizeAmount(
        order.totalAmount ?? order.amount ?? order.total ?? order.price
      );
      totalSales += amount;
      totalOrders += 1;

      const status = normalizeStatus(
        order.status ?? order.orderStatus ?? order.currentStatus
      );
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const dealerId =
        order.dealerId ??
        order.dealer_id ??
        order.dealer?.id ??
        order.dealer?.dealerId;

      if (dealerId !== undefined && dealerId !== null) {
        const current = dealerStats.get(dealerId) || {
          dealerId,
          dealerName: order.dealer?.dealerName || order.dealer?.name || '',
          totalSales: 0,
          totalOrders: 0
        };
        current.totalSales += amount;
        current.totalOrders += 1;
        dealerStats.set(dealerId, current);
      }
    });

    const dealerInfoMap = new Map();
    dealers.forEach((dealer) => {
      const id = dealer.dealerId ?? dealer.id;
      if (id === undefined || id === null) return;
      dealerInfoMap.set(id, dealer);
    });

    const dealerPerformance = Array.from(dealerStats.values()).map(
      (stat) => {
        const dealerInfo = dealerInfoMap.get(stat.dealerId) || {};
        return {
          dealerId: stat.dealerId,
          dealerName:
            stat.dealerName ||
            dealerInfo.dealerName ||
            dealerInfo.name ||
            dealerInfo.fullName ||
            `Dealer #${stat.dealerId}`,
          totalSales: stat.totalSales,
          totalOrders: stat.totalOrders
        };
      }
    );

    dealerPerformance.sort((a, b) => b.totalSales - a.totalSales);

    const activeDealers = dealers.filter((dealer) => {
      const status = normalizeStatus(dealer.status ?? dealer.dealerStatus);
      return status === 'ACTIVE';
    }).length;

    const pendingOrders =
      (statusCounts.PENDING || 0) +
      (statusCounts.PROCESSING || 0) +
      (statusCounts['IN_PROGRESS'] || 0);

    return {
      totalSales,
      totalOrders,
      pendingOrders,
      activeDealers,
      totalDealers: dealers.length,
      statusCounts,
      dealerPerformance
    };
  };

  const fetchEVMData = useCallback(async () => {
    if (!isEVMManager && !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const ordersPromise = ordersAPI.getAll();
      const dealersPromise = dealersAPI.getAll();
      const usersPromise = isAdmin ? usersAPI.getAll() : Promise.resolve(null);

      const [ordersData, dealersData, usersData] = await Promise.all([
        ordersPromise,
        dealersPromise,
        usersPromise
      ]);

      const {
        totalSales,
        totalOrders,
        pendingOrders,
        activeDealers,
        totalDealers,
        statusCounts,
        dealerPerformance: dealerStats
      } = aggregateDashboardData(
        ordersData || [],
        dealersData || [],
        dateRange.from,
        dateRange.to
      );

      setSystemStatus({
        orderStatusCounts: statusCounts,
        totalSales
      });
      setDealerPerformance(dealerStats);
      setSummaryStats({
        totalRevenue: totalSales,
        totalOrders,
        pendingOrders,
        activeDealers,
        totalDealers
      });

      if (isAdmin && Array.isArray(usersData)) {
        const roleCounts = {};
        const statusCountsUsers = {};

        usersData.forEach((account) => {
          const roleKey = normalizeUserRole(account.role);
          const roleLabel = toDisplayLabel(roleKey, roleDisplayMap);
          roleCounts[roleLabel] = (roleCounts[roleLabel] || 0) + 1;

          const statusKey = normalizeUserStatus(account.status);
          const statusLabel = toDisplayLabel(statusKey, statusDisplayMap);
          statusCountsUsers[statusLabel] =
            (statusCountsUsers[statusLabel] || 0) + 1;
        });

        setUserSummary({
          totalUsers: usersData.length,
          roleCounts,
          statusCounts: statusCountsUsers
        });
      }
    } catch (err) {
      setError(handleAPIError(err));
      console.error('Error fetching EVM data:', err);
      console.error('Error details:', err.response?.data);
      setSystemStatus({ orderStatusCounts: {}, totalSales: 0 });
      setDealerPerformance([]);
      setSummaryStats({
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        activeDealers: 0,
        totalDealers: 0
      });
      if (isAdmin) {
        setUserSummary({
          totalUsers: 0,
          roleCounts: {},
          statusCounts: {}
        });
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, isEVMManager, isAdmin]);

  useEffect(() => {
    if (isEVMManager || isAdmin) {
      fetchEVMData();
    }
  }, [isEVMManager, isAdmin, fetchEVMData]);

  useEffect(() => {
    if (!isDealerStaff) {
      return;
    }

    let ignore = false;

    const parseDateSafe = (value) => {
      if (!value) return null;
      const direct = new Date(value);
      if (!Number.isNaN(direct.getTime())) return direct;
      const fallback = new Date(`${value}T00:00:00`);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    const fetchDealerStaffOverview = async () => {
      try {
        setDealerStaffLoading(true);
        setDealerStaffError(null);

        const dealerId = await resolveDealerId();
        if (!dealerId) {
          if (!ignore) {
            setDealerStaffError('Dealer information not found for this account.');
            setDealerStaffOverview((prev) => ({
              ...prev,
              stats: dealerStaffData.stats,
              statusBreakdown: [],
              recentCustomers: [],
              orderSummary: dealerStaffData.orderSummary
            }));
          }
          return;
        }

        const [customersData, ordersData] = await Promise.all([
          customersAPI.getByDealer(dealerId),
          ordersAPI.getByDealer(dealerId)
        ]);

        if (ignore) return;

        const customersArray = Array.isArray(customersData) ? customersData : [];
        const ordersArray = Array.isArray(ordersData) ? ordersData : [];

        const insights = computeDealerInsights(customersArray, ordersArray);

        const stats = [
          {
            label: 'Total Customers',
            value: formatNumber(insights.totalCustomers),
            change:
              insights.newCustomersThisMonth > 0
                ? `${formatNumber(insights.newCustomersThisMonth)} added this month`
                : 'No new customers this month',
            icon: 'bx-user',
            color: 'primary'
          },
          {
            label: 'Active Customers',
            value: formatNumber(insights.activeCustomers),
            change:
              insights.totalCustomers > 0
                ? `${Math.round((insights.activeCustomers / insights.totalCustomers) * 100)}% active`
                : '—',
            icon: 'bx-user-check',
            color: 'success'
          },
          {
            label: 'Customers with Orders',
            value: formatNumber(insights.customersWithOrders),
            change: `${formatNumber(insights.orderSummary.totalOrders)} orders placed`,
            icon: 'bx-user-voice',
            color: 'accent'
          },
          {
            label: 'Total Revenue',
            value: formatCurrency(insights.orderSummary.revenue),
            change:
              insights.orderSummary.pendingOrders > 0
                ? `${formatNumber(insights.orderSummary.pendingOrders)} pending`
                : `${formatNumber(insights.orderSummary.completedOrders)} completed`,
            icon: 'bx-dollar-circle',
            color: 'secondary'
          }
        ];

        setDealerStaffOverview({
          stats,
          statusBreakdown: insights.statusBreakdown,
          recentCustomers: insights.recentCustomers,
          orderSummary: insights.orderSummary,
          monthlyOrders: insights.monthlyOrders,
          vehicleDistribution: insights.vehicleDistribution,
          feedbackSummary: insights.feedbackSummary
        });
      } catch (err) {
        console.error('Failed to load dealer staff overview:', err);
        if (!ignore) {
          setDealerStaffError(handleAPIError(err));
        }
      } finally {
        if (!ignore) {
          setDealerStaffLoading(false);
        }
      }
    };

    fetchDealerStaffOverview();

    return () => {
      ignore = true;
    };
  }, [isDealerStaff, resolveDealerId]);

  useEffect(() => {
    if (!isDealerManager) {
      return;
    }

    let ignore = false;

    const fetchDealerManagerOverview = async () => {
      try {
        setDealerManagerLoading(true);
        setDealerManagerError(null);

        const dealerId = await resolveDealerId();
        if (!dealerId) {
          if (!ignore) {
            setDealerManagerError('Dealer information not found for this account.');
            setDealerManagerOverview(dealerManagerDefaults);
          }
          return;
        }

        const [customersData, ordersData, usersData] = await Promise.all([
          customersAPI.getByDealer(dealerId),
          ordersAPI.getByDealer(dealerId),
          usersAPI.getAll()
        ]);

        if (ignore) return;

        const customersArray = Array.isArray(customersData) ? customersData : [];
        const ordersArray = Array.isArray(ordersData) ? ordersData : [];
        const usersArray = Array.isArray(usersData) ? usersData : [];

        const dealerIdKey = String(dealerId);
        const staffRoleSet = new Set([
          'dealer-staff',
          'dealer-manager',
          'sales',
          'service-staff',
          'support-staff'
        ]);

        const staffMembers = usersArray.filter((account) => {
          const roleKey = normalizeUserRole(account.role);
          const associatedDealer = String(
            account.dealerId ??
              account.dealer_id ??
              account.dealer?.dealerId ??
              account.dealer?.id ??
              ''
          );
          return staffRoleSet.has(roleKey) && associatedDealer === dealerIdKey;
        });

        const activeStaffCount = staffMembers.filter(
          (member) => normalizeUserStatus(member.status) === 'active'
        ).length;

        const insights = computeDealerInsights(customersArray, ordersArray);

        const stats = [
          {
            label: 'Total Customers',
            value: formatNumber(insights.totalCustomers),
            change: `${formatNumber(insights.customersWithOrders)} with orders`,
            icon: 'bx-user',
            color: 'primary'
          },
          {
            label: 'Total Staff',
            value: formatNumber(staffMembers.length),
            change:
              activeStaffCount > 0
                ? `${formatNumber(activeStaffCount)} active`
                : 'No active staff',
            icon: 'bx-group',
            color: 'secondary'
          },
          {
            label: 'Orders Placed',
            value: formatNumber(insights.orderSummary.totalOrders),
            change: `Revenue: ${formatCurrency(insights.orderSummary.revenue)}`,
            icon: 'bx-cart',
            color: 'success'
          },
          {
            label: 'Orders Rejected',
            value: formatNumber(insights.orderSummary.rejectedOrders),
            change: `${formatNumber(insights.orderSummary.pendingOrders)} pending`,
            icon: 'bx-x-circle',
            color: 'warning'
          }
        ];

        setDealerManagerOverview({
          stats,
          revenueTrend: insights.revenueTrend,
          orderStatus: insights.orderStatusCounts,
          feedbackList: insights.feedbackList,
          recentCustomers: insights.recentCustomers,
          staffMembers: staffMembers.map((member) => ({
            id: member.id,
            name: member.fullName || member.name || member.email || 'Staff',
            role: toDisplayLabel(normalizeUserRole(member.role), roleDisplayMap),
            status: toDisplayLabel(normalizeUserStatus(member.status), statusDisplayMap)
          })),
          orderSummary: insights.orderSummary
        });
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load dealer manager overview:', err);
          setDealerManagerError(handleAPIError(err));
          setDealerManagerOverview(dealerManagerDefaults);
        }
      } finally {
        if (!ignore) {
          setDealerManagerLoading(false);
        }
      }
    };

    fetchDealerManagerOverview();

    return () => {
      ignore = true;
    };
  }, [isDealerManager, resolveDealerId]);

  // Format helpers
  function formatCurrency(amount) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount?.toLocaleString() || '0'}`;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function parseDateSafe(value) {
    if (!value) return null;
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;
    const fallback = new Date(`${value}T00:00:00`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  function computeDealerInsights(customersArray = [], ordersArray = []) {
    const totalCustomers = customersArray.length;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthsToShow = 6;

    const monthlyOrderMap = new Map();
    const monthlyRevenueMap = new Map();
    const vehicleCountMap = new Map();
    const feedbackByMonthMap = new Map();
    const seenFeedbackIds = new Set();
    const feedbackEntries = [];

    let totalFeedback = 0;
    let resolvedFeedback = 0;
    let pendingFeedbackCounter = 0;

    const statusCountMap = {};
    let activeCustomers = 0;
    let newCustomersThisMonth = 0;

    const ensureMonthlyEntry = (map, date, factory) => {
      if (!date) return null;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!map.has(key)) {
        map.set(key, factory(date));
      }
      return map.get(key);
    };

    const addVehicleCount = (rawName, quantity = 1) => {
      if (!rawName) return;
      const name = String(rawName).trim() || 'Unnamed Vehicle';
      const parsedQuantity = Number(quantity);
      const increment = Number.isNaN(parsedQuantity) ? 1 : Math.max(parsedQuantity, 0);
      if (increment <= 0) return;
      vehicleCountMap.set(name, (vehicleCountMap.get(name) || 0) + increment);
    };

    const resolveFallbackVehicleName = (order) =>
      order.vehicleModel ||
      order.vehicleName ||
      order.vehicleType ||
      order.model ||
      order.productName ||
      order.vehicleBrand ||
      order.vehicle_title ||
      order.trim ||
      null;

    const trackFeedback = (feedback, customerContext = {}) => {
      if (!feedback) return;

      const rawId =
        feedback.id ??
        feedback.feedbackId ??
        feedback.feedback_id ??
        feedback.reviewId ??
        feedback.review_id ??
        null;

      const uniqueId =
        rawId !== null && rawId !== undefined
          ? String(rawId)
          : `generated-${feedbackEntries.length}-${Date.now()}`;
      if (seenFeedbackIds.has(uniqueId)) {
        return;
      }
      seenFeedbackIds.add(uniqueId);

      totalFeedback += 1;

      const statusRaw = String(
        feedback.status ??
          feedback.state ??
          feedback.feedbackStatus ??
          feedback.resolutionStatus ??
          feedback.currentStatus ??
          ''
      ).toLowerCase();

      const isResolved =
        statusRaw.includes('resolve') ||
        statusRaw.includes('closed') ||
        statusRaw.includes('complete') ||
        statusRaw.includes('done') ||
        statusRaw.includes('approved');

      if (isResolved) {
        resolvedFeedback += 1;
      } else {
        pendingFeedbackCounter += 1;
      }

      const createdDate = parseDateSafe(
        feedback.createdAt ||
          feedback.created_at ||
          feedback.date ||
          feedback.feedbackDate ||
          feedback.timestamp
      );

      const feedbackMonthlyEntry = ensureMonthlyEntry(
        feedbackByMonthMap,
        createdDate,
        (date) => ({
          date: new Date(date.getFullYear(), date.getMonth(), 1),
          total: 0,
          resolved: 0,
          pending: 0
        })
      );

      if (feedbackMonthlyEntry) {
        feedbackMonthlyEntry.total += 1;
        if (isResolved) {
          feedbackMonthlyEntry.resolved += 1;
        } else {
          feedbackMonthlyEntry.pending += 1;
        }
      }

      feedbackEntries.push({
        id: uniqueId,
        customer:
          feedback.customerName ||
          feedback.name ||
          feedback.customer ||
          feedback.author ||
          customerContext.fullName ||
          customerContext.name ||
          customerContext.email ||
          'Customer',
        message:
          feedback.message ||
          feedback.comment ||
          feedback.content ||
          feedback.note ||
          '',
        rating: Number(feedback.rating ?? feedback.stars ?? feedback.score ?? 0),
        createdAt: createdDate ? createdDate.getTime() : Date.now()
      });
    };

    customersArray.forEach((customer) => {
      const rawStatus =
        customer.status ??
        customer.customerStatus ??
        customer.state ??
        customer.currentStatus ??
        'unknown';
      const normalizedStatus = normalizeUserStatus(rawStatus) || 'unknown';
      if (normalizedStatus === 'active') {
        activeCustomers += 1;
      }
      statusCountMap[normalizedStatus] = (statusCountMap[normalizedStatus] || 0) + 1;

      const createdAt =
        customer.createdAt ||
        customer.created_at ||
        customer.registrationDate ||
        customer.registration_date ||
        customer.createdDate;
      const createdDate = parseDateSafe(createdAt);
      if (createdDate && createdDate >= startOfMonth) {
        newCustomersThisMonth += 1;
      }

      const feedbackCollections = [
        customer.feedbacks,
        customer.feedback,
        customer.feedbackEntries,
        customer.reviews,
        customer.feedback_list,
        customer.feedbackHistory
      ];

      let hasDetailedFeedback = false;
      feedbackCollections.forEach((collection) => {
        if (Array.isArray(collection)) {
          collection.forEach((item) => {
            if (item) {
              hasDetailedFeedback = true;
              trackFeedback(item, customer);
            }
          });
        }
      });

      if (!hasDetailedFeedback) {
        const feedbackCount = Number(
          customer.feedbackCount ??
            customer.totalFeedback ??
            customer.feedbackTotal ??
            customer.feedback_count ??
            0
        );

        if (!Number.isNaN(feedbackCount) && feedbackCount > 0) {
          totalFeedback += feedbackCount;

          const resolvedCount = Number(
            customer.resolvedFeedbackCount ??
              customer.feedbackResolved ??
              customer.resolvedFeedback ??
              customer.feedbackResolvedCount ??
              0
          );

          if (!Number.isNaN(resolvedCount) && resolvedCount > 0) {
            resolvedFeedback += Math.min(resolvedCount, feedbackCount);
          }

          const pendingFromCounts =
            feedbackCount - Math.max(Math.min(resolvedCount, feedbackCount), 0);
          if (pendingFromCounts > 0) {
            pendingFeedbackCounter += pendingFromCounts;
          }
        }
      }
    });

    let totalOrders = 0;
    let completedOrders = 0;
    let pendingOrders = 0;
    let rejectedOrders = 0;
    let totalRevenue = 0;
    const orderStatusCounts = {};
    const customersWithOrdersSet = new Set();

    ordersArray.forEach((order) => {
      totalOrders += 1;

      const customerId =
        order.customerId ??
        order.customer_id ??
        order.customer?.id ??
        order.customer?.customerId ??
        order.customer?.customer_id;
      if (customerId !== undefined && customerId !== null) {
        customersWithOrdersSet.add(String(customerId));
      }

      const orderDate = parseDateSafe(
        order.orderDate ||
          order.date ||
          order.createdAt ||
          order.created_at ||
          order.requestTime ||
          order.request_time
      );

      const monthlyOrderEntry = ensureMonthlyEntry(monthlyOrderMap, orderDate, (date) => ({
        date: new Date(date.getFullYear(), date.getMonth(), 1),
        orders: 0,
        customers: new Set()
      }));
      if (monthlyOrderEntry) {
        monthlyOrderEntry.orders += 1;
        if (customerId !== undefined && customerId !== null) {
          monthlyOrderEntry.customers.add(String(customerId));
        }
      }

      const monthlyRevenueEntry = ensureMonthlyEntry(
        monthlyRevenueMap,
        orderDate,
        (date) => ({
          date: new Date(date.getFullYear(), date.getMonth(), 1),
          revenue: 0,
          orders: 0
        })
      );

      const amount = Number(
        order.totalAmount ?? order.total ?? order.amount ?? order.price ?? 0
      );
      if (!Number.isNaN(amount)) {
        totalRevenue += amount;
        if (monthlyRevenueEntry) {
          monthlyRevenueEntry.revenue += amount;
        }
      }
      if (monthlyRevenueEntry) {
        monthlyRevenueEntry.orders += 1;
      }

      const status = String(
        order.status ?? order.orderStatus ?? order.currentStatus ?? ''
      )
        .trim()
        .toUpperCase();

      if (status.length > 0) {
        orderStatusCounts[status] = (orderStatusCounts[status] || 0) + 1;
      }

      if (
        status.includes('REJECT') ||
        status.includes('CANCEL') ||
        status.includes('DECLINED') ||
        status.includes('DENIED')
      ) {
        rejectedOrders += 1;
      } else if (
        status.includes('COMPLETE') ||
        status.includes('SUCCESS') ||
        status.includes('DELIVERED') ||
        status.includes('APPROVED')
      ) {
        completedOrders += 1;
      } else if (
        status.includes('PENDING') ||
        status.includes('PROCESS') ||
        status.includes('WAIT') ||
        status.includes('IN_PROGRESS')
      ) {
        pendingOrders += 1;
      }

      const orderVehicles = [];
      if (Array.isArray(order.vehicles)) {
        order.vehicles.forEach((vehicle) => {
          if (vehicle) {
            orderVehicles.push(vehicle);
          }
        });
      } else if (order.vehicles && typeof order.vehicles === 'object') {
        orderVehicles.push(order.vehicles);
      }

      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (!item) return;
          if (item.vehicle) {
            orderVehicles.push(item.vehicle);
          } else {
            orderVehicles.push(item);
          }
        });
      }

      if (order.vehicle) {
        orderVehicles.push(order.vehicle);
      }

      const fallbackVehicleName = resolveFallbackVehicleName(order);

      if (orderVehicles.length === 0) {
        if (fallbackVehicleName) {
          addVehicleCount(fallbackVehicleName, order.quantity ?? order.totalQuantity ?? 1);
        } else if (order.vehicleId ?? order.vehicle_id) {
          addVehicleCount(
            `Vehicle #${order.vehicleId ?? order.vehicle_id}`,
            order.quantity ?? 1
          );
        }
      } else {
        orderVehicles.forEach((vehicle) => {
          if (!vehicle) return;

          if (typeof vehicle === 'string') {
            addVehicleCount(vehicle, order.quantity ?? 1);
            return;
          }

          const name =
            vehicle.model ||
            vehicle.name ||
            vehicle.vehicleName ||
            vehicle.title ||
            vehicle.productName ||
            vehicle.trim ||
            fallbackVehicleName ||
            (vehicle.vehicleId || vehicle.vehicle_id
              ? `Vehicle #${vehicle.vehicleId ?? vehicle.vehicle_id}`
              : null);

          const quantityCandidate =
            vehicle.quantity ??
            vehicle.count ??
            vehicle.qty ??
            vehicle.total ??
            vehicle.totalQuantity ??
            order.quantity ??
            1;

          addVehicleCount(name, quantityCandidate);
        });
      }
    });

    const customersWithOrders = customersWithOrdersSet.size;

    const monthlyOrders = [];
    const revenueTrend = [];
    const feedbackByMonth = [];

    for (let i = monthsToShow - 1; i >= 0; i -= 1) {
      const baseDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${baseDate.getFullYear()}-${baseDate.getMonth()}`;

      const orderEntry = monthlyOrderMap.get(key);
      const revenueEntry = monthlyRevenueMap.get(key);
      const feedbackEntry = feedbackByMonthMap.get(key);

      const label = baseDate.toLocaleDateString(undefined, {
        month: 'short',
        year: '2-digit'
      });

      monthlyOrders.push({
        label,
        orders: orderEntry ? orderEntry.orders : 0,
        uniqueCustomers: orderEntry ? orderEntry.customers.size : 0,
        conversionRate:
          totalCustomers > 0
            ? Number(
                (
                  ((orderEntry ? orderEntry.customers.size : 0) / totalCustomers) *
                  100
                ).toFixed(1)
              )
            : 0
      });

      revenueTrend.push({
        label,
        revenue: revenueEntry ? revenueEntry.revenue : 0,
        orders: revenueEntry ? revenueEntry.orders : 0
      });

      feedbackByMonth.push({
        label,
        total: feedbackEntry ? feedbackEntry.total : 0,
        resolved: feedbackEntry ? feedbackEntry.resolved : 0,
        pending: feedbackEntry ? feedbackEntry.pending : 0
      });
    }

    const vehicleDistribution = Array.from(vehicleCountMap.entries())
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const statusBreakdown = Object.entries(statusCountMap)
      .map(([key, value]) => ({
        name: toDisplayLabel(key, statusDisplayMap),
        value
      }))
      .sort((a, b) => b.value - a.value);

    const recentCustomers = customersArray
      .slice()
      .sort((a, b) => {
        const dateA =
          parseDateSafe(
            a.updatedAt ||
              a.updated_at ||
              a.createdAt ||
              a.created_at ||
              a.registrationDate ||
              a.registration_date
          ) || 0;
        const dateB =
          parseDateSafe(
            b.updatedAt ||
              b.updated_at ||
              b.createdAt ||
              b.created_at ||
              b.registrationDate ||
              b.registration_date
          ) || 0;
        return (dateB ? dateB.getTime() : 0) - (dateA ? dateA.getTime() : 0);
      })
      .slice(0, 6)
      .map((customer) => {
        const joinedDate = parseDateSafe(
          customer.createdAt ||
            customer.created_at ||
            customer.registrationDate ||
            customer.registration_date
        );
        const displayStatus = toDisplayLabel(
          normalizeUserStatus(customer.status ?? customer.customerStatus ?? 'unknown'),
          statusDisplayMap
        );

        return {
          id: customer.id || customer.customerId || customer.customer_id,
          name: customer.fullName || customer.name || 'Unknown customer',
          email: customer.email || 'N/A',
          phone: customer.phone || customer.phoneNumber || 'N/A',
          status: displayStatus,
          joined: joinedDate ? joinedDate.toLocaleDateString() : 'N/A'
        };
      });

    const formattedFeedbackList = feedbackEntries
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 8)
      .map((entry) => ({
        id: entry.id,
        customer: entry.customer,
        message: entry.message,
        rating: entry.rating,
        createdAtLabel: entry.createdAt
          ? new Date(entry.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : 'Recently'
      }));

    return {
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      customersWithOrders,
      statusBreakdown,
      recentCustomers,
      orderSummary: {
        totalOrders,
        completedOrders,
        pendingOrders,
        rejectedOrders,
        revenue: totalRevenue,
        averageOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        customersWithOrders
      },
      monthlyOrders,
      revenueTrend,
      vehicleDistribution,
      feedbackSummary: {
        totalFeedback,
        resolvedFeedback,
        pendingFeedback: Math.max(
          totalFeedback - resolvedFeedback,
          pendingFeedbackCounter
        ),
        feedbackByMonth
      },
      feedbackList: formattedFeedbackList,
      orderStatusCounts: Object.entries(orderStatusCounts)
        .map(([status, value]) => ({
          name: formatStatusLabel(status),
          value
        }))
        .sort((a, b) => b.value - a.value)
    };
  }

  const evmStaffData = {
    stats: [
      {
        label: 'Total Revenue',
        value: formatCurrency(summaryStats.totalRevenue || 0),
        change: 'System',
        icon: 'bx-dollar-circle',
        color: 'primary'
      },
      {
        label: 'Total Orders',
        value: summaryStats.totalOrders.toLocaleString(),
        change: 'All statuses',
        icon: 'bx-clipboard',
        color: 'secondary'
      },
      {
        label: 'Active Dealers',
        value: summaryStats.activeDealers.toString(),
        change: `Total: ${summaryStats.totalDealers.toString()}`,
        icon: 'bx-store',
        color: 'success'
      },
      {
        label: 'Pending Orders',
        value: summaryStats.pendingOrders.toString(),
        change: 'Needs attention',
        icon: 'bx-time-five',
        color: 'warning'
      }
    ]
  };

  const roleDistribution = Object.entries(userSummary.roleCounts || {}).map(
    ([name, value]) => ({
      name,
      value
    })
  );

  const statusDistribution = Object.entries(userSummary.statusCounts || {}).map(
    ([name, value]) => ({
      name,
      value
    })
  );

  const dealerRevenueData = dealerPerformance
    .slice(0, 8)
    .map((dealer) => ({
      name: dealer.dealerName,
      revenue: dealer.totalSales
    }));

  const averageRevenue =
    summaryStats.totalDealers > 0
      ? summaryStats.totalRevenue / summaryStats.totalDealers
      : 0;

  const adminDashboardData = {
    stats: [
      {
        label: 'Total Users',
        value: formatNumber(userSummary.totalUsers),
        change: `Active: ${formatNumber(
          userSummary.statusCounts['Active'] || 0
        )}`,
        icon: 'bx-user',
        color: 'primary'
      },
      {
        label: 'Active Dealers',
        value: formatNumber(summaryStats.activeDealers),
        change: `Total: ${formatNumber(summaryStats.totalDealers)}`,
        icon: 'bx-store',
        color: 'secondary'
      },
      {
        label: 'System Revenue',
        value: formatCurrency(summaryStats.totalRevenue || 0),
        change: `Avg per dealer: ${formatCurrency(averageRevenue || 0)}`,
        icon: 'bx-dollar-circle',
        color: 'success'
      },
      {
        label: 'Total Dealers',
        value: formatNumber(summaryStats.totalDealers),
        change: `Pending orders: ${formatNumber(summaryStats.pendingOrders)}`,
        icon: 'bx-home-circle',
        color: 'accent'
      }
    ],
    roleDistribution,
    statusDistribution,
    dealerRevenue: dealerRevenueData,
    monthlyRevenue: summaryStats.monthlyRevenue || [],
    orderStatusSnapshot: Object.entries(systemStatus.orderStatusCounts || {})
      .map(([name, value]) => ({
        name: formatStatusLabel(name),
        value
      }))
      .sort((a, b) => b.value - a.value)
  };

  const getDataForRole = () => {
    if (isEVMManager) {
      return evmStaffData;
    }
    if (isDealerStaff) {
      return {
        ...dealerStaffData,
        stats: dealerStaffOverview.stats || dealerStaffData.stats,
        statusBreakdown: dealerStaffOverview.statusBreakdown || [],
        recentCustomers: dealerStaffOverview.recentCustomers || [],
        orderSummary:
          dealerStaffOverview.orderSummary || dealerStaffData.orderSummary,
        monthlyOrders: dealerStaffOverview.monthlyOrders || [],
        vehicleDistribution: dealerStaffOverview.vehicleDistribution || [],
        feedbackSummary:
          dealerStaffOverview.feedbackSummary || dealerStaffData.feedbackSummary
      };
    }
    if (isDealerManager) {
      return {
        ...dealerManagerDefaults,
        ...dealerManagerOverview,
        stats: dealerManagerOverview.stats || dealerManagerDefaults.stats,
        orderSummary:
          dealerManagerOverview.orderSummary || dealerManagerDefaults.orderSummary,
        revenueTrend: dealerManagerOverview.revenueTrend || [],
        orderStatus: dealerManagerOverview.orderStatus || [],
        feedbackList: dealerManagerOverview.feedbackList || [],
        recentCustomers: dealerManagerOverview.recentCustomers || [],
        staffMembers: dealerManagerOverview.staffMembers || dealerManagerDefaults.staffMembers
      };
    }
    if (isAdmin) {
      return adminDashboardData;
    }
    return dealerManagerDefaults;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing':
      case 'Pending':
        return 'var(--color-warning)';
      case 'Confirmed':
      case 'Approved':
        return 'var(--color-success)';
      case 'Delivered':
        return 'var(--color-success)';
      default:
        return 'var(--color-text-muted)';
    }
  };

  const data = getDataForRole();
  const orderSummary =
    data.orderSummary ||
    (isDealerManager
      ? dealerManagerDefaults.orderSummary
      : dealerStaffData.orderSummary);
  const monthlyOrders = data.monthlyOrders || [];
  const hasMonthlyOrders = monthlyOrders.some(
    (entry) => (entry.orders || 0) > 0 || (entry.uniqueCustomers || 0) > 0
  );
  const vehicleDistribution = data.vehicleDistribution || [];
  const hasVehicleDistribution = vehicleDistribution.some(
    (entry) => (entry.value || 0) > 0
  );
  const feedbackSummaryData = {
    totalFeedback: data.feedbackSummary?.totalFeedback || 0,
    resolvedFeedback: data.feedbackSummary?.resolvedFeedback || 0,
    pendingFeedback: data.feedbackSummary?.pendingFeedback || 0,
    feedbackByMonth: data.feedbackSummary?.feedbackByMonth || []
  };
  const hasFeedbackData = feedbackSummaryData.feedbackByMonth.some(
    (entry) => (entry.total || 0) > 0
  );
  const managerRevenueTrend = data.revenueTrend || [];
  const hasManagerRevenueData = managerRevenueTrend.some(
    (entry) => (entry.revenue || 0) > 0
  );
  const managerOrderStatus = data.orderStatus || [];
  const hasManagerOrderStatus = managerOrderStatus.some(
    (entry) => (entry.value || 0) > 0
  );
  const managerFeedbackList = data.feedbackList || [];
  const managerRecentCustomers = data.recentCustomers || [];
  const orderStatusChartData = [
    {
      name: 'Completed',
      value: orderSummary.completedOrders || 0,
      fill: '#22C55E'
    },
    {
      name: 'Pending',
      value: orderSummary.pendingOrders || 0,
      fill: '#F59E0B'
    },
    {
      name: 'Other',
      value: Math.max(
        (orderSummary.totalOrders || 0) -
          (orderSummary.completedOrders || 0) -
          (orderSummary.pendingOrders || 0),
        0
      ),
      fill: '#64748B'
    }
  ].filter((item) => item.value > 0);

  const renderEmptyChartState = (iconClass, message) => (
    <div
      style={{
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        padding: '36px 12px'
      }}
    >
      <i
        className={`bx ${iconClass}`}
        style={{ fontSize: '32px', marginBottom: '8px' }}
      ></i>
      <div>{message}</div>
    </div>
  );

  const renderMonthlyTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const { orders, uniqueCustomers, conversionRate } = payload[0].payload || {};
    return (
      <div
        style={{
          background: 'var(--color-bg)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)'
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '12px' }}>Orders: {formatNumber(orders)}</div>
        <div style={{ fontSize: '12px' }}>
          Customers: {formatNumber(uniqueCustomers)}
        </div>
        <div style={{ fontSize: '12px' }}>Conversion: {conversionRate}%</div>
      </div>
    );
  };

  const renderFeedbackTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const dataPoint = payload[0].payload || {};
    return (
      <div
        style={{
          background: 'var(--color-bg)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)'
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '12px' }}>
          Total: {formatNumber(dataPoint.total || 0)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-success)' }}>
          Resolved: {formatNumber(dataPoint.resolved || 0)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-warning)' }}>
          Pending: {formatNumber(dataPoint.pending || 0)}
        </div>
      </div>
    );
  };

  return (
    <div className="main">
      {/* Main Stats Cards */}
      <div className="cards-grid">
        {data.stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="card__header">
              <h3 className="card__title">{stat.label}</h3>
              <div className={`card__icon card__icon--${stat.color}`}>
                <i className={`bx ${stat.icon}`}></i>
              </div>
            </div>
            <div className="card__value">{stat.value}</div>
            <div className={`card__change card__change--positive`}>
              <i className="bx bx-trending-up"></i>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Role-specific content */}
      {isDealerStaff && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {dealerStaffLoading ? (
            <div
              className="chart-card"
              style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}
            >
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
              <div>Loading customer insights…</div>
            </div>
          ) : dealerStaffError ? (
            <div
              className="chart-card"
              style={{
                padding: '24px',
              color: '#FF6B6B',
                border: '1px solid rgba(255, 107, 107, 0.4)',
                background: 'rgba(255, 107, 107, 0.08)'
              }}
            >
              <h3 className="chart-card__title" style={{ marginBottom: '12px' }}>Unable to load overview</h3>
              <div>{dealerStaffError}</div>
            </div>
          ) : (
            <>
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-card__title">Monthly Order Activity</h3>
                  {hasMonthlyOrders ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={monthlyOrders}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="label" stroke="var(--color-text-muted)" />
                        <YAxis allowDecimals={false} stroke="var(--color-text-muted)" />
                        <Tooltip content={renderMonthlyTooltip} />
                        <Legend />
                        <Bar dataKey="orders" name="Orders" fill="#F97316" radius={[4, 4, 0, 0]} />
                        <Bar
                          dataKey="uniqueCustomers"
                          name="Customers"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    renderEmptyChartState('bx-bar-chart-alt-2', 'No order activity recorded for the selected period.')
                  )}
                </div>

                <div className="chart-card">
                  <h3 className="chart-card__title">Vehicle Distribution</h3>
                  {hasVehicleDistribution ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Tooltip formatter={(value) => formatNumber(value)} />
                        <Legend verticalAlign="bottom" height={36} />
                        <Pie
                          data={vehicleDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="45%"
                          outerRadius="80%"
                          paddingAngle={2}
                        >
                          {vehicleDistribution.map((entry, index) => (
                            <Cell
                              key={`vehicle-${entry.name}-${index}`}
                              fill={pieColors[index % pieColors.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    renderEmptyChartState('bx-car', 'Vehicle orders will appear here once customers start purchasing.')
                  )}
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-card__title">Customer Status Breakdown</h3>
                  {data.statusBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Tooltip formatter={(value) => formatNumber(value)} />
                        <Legend verticalAlign="bottom" height={36} />
                        <Pie
                          data={data.statusBreakdown}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="45%"
                          outerRadius="80%"
                          paddingAngle={2}
                        >
                          {data.statusBreakdown.map((entry, index) => (
                            <Cell
                              key={`status-${entry.name}-${index}`}
                              fill={pieColors[index % pieColors.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    renderEmptyChartState('bx-user', 'No customer status information available yet.')
                  )}
                </div>

                <div className="chart-card">
                  <h3 className="chart-card__title">Feedback Overview</h3>
                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      flexWrap: 'wrap',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ minWidth: '120px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {formatNumber(feedbackSummaryData.totalFeedback)}
                      </div>
                    </div>
                    <div style={{ minWidth: '120px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Resolved</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                        {formatNumber(feedbackSummaryData.resolvedFeedback)}
                      </div>
                    </div>
                    <div style={{ minWidth: '120px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Pending</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-warning)' }}>
                        {formatNumber(feedbackSummaryData.pendingFeedback)}
                      </div>
                    </div>
                  </div>
                  {hasFeedbackData ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={feedbackSummaryData.feedbackByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="label" stroke="var(--color-text-muted)" />
                        <YAxis allowDecimals={false} stroke="var(--color-text-muted)" />
                        <Tooltip content={renderFeedbackTooltip} />
                        <Legend />
                        <Bar
                          dataKey="resolved"
                          name="Resolved"
                          stackId="feedback"
                          fill="#22C55E"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="pending"
                          name="Pending"
                          stackId="feedback"
                          fill="#EF4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    renderEmptyChartState('bx-message-rounded-dots', 'Customer feedback will appear here once submitted.')
                  )}
                </div>
              </div>

              <div className="chart-card">
                <h3 className="chart-card__title">Order Summary</h3>
                {orderSummary.totalOrders ||
                orderSummary.completedOrders ||
                orderSummary.pendingOrders ? (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '12px',
                        marginBottom: '16px'
                      }}
                    >
                      <div
                        style={{
                          background: 'var(--color-bg)',
                          borderRadius: 'var(--radius)',
                          padding: '12px'
                        }}
                      >
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total Orders</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {formatNumber(orderSummary.totalOrders || 0)}
                        </div>
                      </div>
                      <div
                        style={{
                          background: 'var(--color-bg)',
                          borderRadius: 'var(--radius)',
                          padding: '12px'
                        }}
                      >
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Revenue</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          {formatCurrency(orderSummary.revenue || 0)}
                        </div>
                      </div>
                      <div
                        style={{
                          background: 'var(--color-bg)',
                          borderRadius: 'var(--radius)',
                          padding: '12px'
                        }}
                      >
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Customers</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {formatNumber(orderSummary.customersWithOrders || 0)}
                        </div>
                      </div>
                      <div
                        style={{
                          background: 'var(--color-bg)',
                          borderRadius: 'var(--radius)',
                          padding: '12px'
                        }}
                      >
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Avg. Order</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {formatCurrency(orderSummary.averageOrder || 0)}
                        </div>
                      </div>
                    </div>
                    {orderStatusChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={orderStatusChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                          <XAxis dataKey="name" stroke="var(--color-text-muted)" />
                          <YAxis allowDecimals={false} stroke="var(--color-text-muted)" />
                          <Tooltip formatter={(value) => formatNumber(value)} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {orderStatusChartData.map((entry, index) => (
                              <Cell
                                key={`order-status-${entry.name}-${index}`}
                                fill={entry.fill}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      renderEmptyChartState('bx-bar-chart-square', 'Add orders to see the status distribution.')
                    )}
                  </>
                ) : (
                  renderEmptyChartState('bx-basket', 'Start selling vehicles to populate your order summary.')
                )}
              </div>

              <div className="chart-card">
                <h3 className="chart-card__title">Recent Customers</h3>
                {data.recentCustomers.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            Name
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            Email
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            Phone
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            Status
                          </th>
                          <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentCustomers.map((customer, index) => (
                          <tr
                            key={customer.id || index}
                            style={{ borderBottom: '1px solid var(--color-border)' }}
                          >
                            <td style={{ padding: '12px', color: 'var(--color-text)' }}>{customer.name}</td>
                            <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{customer.email}</td>
                            <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{customer.phone}</td>
                            <td style={{ padding: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                              {customer.status}
                            </td>
                            <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{customer.joined}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '36px 12px' }}>
                    <i className="bx bx-user-circle" style={{ fontSize: '32px', marginBottom: '8px' }}></i>
                    <div>No recent customers to display</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {isDealerManager && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {dealerManagerLoading ? (
            <div
              className="chart-card"
              style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}
            >
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
              <div>Loading dealer performance…</div>
            </div>
          ) : dealerManagerError ? (
            <div
              className="chart-card"
              style={{
                padding: '24px',
                color: '#FF6B6B',
                border: '1px solid rgba(255, 107, 107, 0.4)',
                background: 'rgba(255, 107, 107, 0.08)'
              }}
            >
              <h3 className="chart-card__title" style={{ marginBottom: '12px' }}>Unable to load overview</h3>
              <div>{dealerManagerError}</div>
            </div>
          ) : (
            <>
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-card__title">Revenue Trend (Last 6 Months)</h3>
                  {hasManagerRevenueData ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={managerRevenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="label" stroke="var(--color-text-muted)" />
                        <YAxis stroke="var(--color-text-muted)" tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="revenue" name="Revenue" fill="#DC2626" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="orders" name="Orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    renderEmptyChartState(
                      'bx-line-chart',
                      'Revenue insights will appear after orders are recorded.'
                    )
                  )}
                </div>

                <div className="chart-card">
                  <h3 className="chart-card__title">Order Status Overview</h3>
                  {hasManagerOrderStatus ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Tooltip formatter={(value) => formatNumber(value)} />
                        <Legend />
                        <Pie
                          data={managerOrderStatus}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="45%"
                          outerRadius="80%"
                          paddingAngle={2}
                        >
                          {managerOrderStatus.map((entry, index) => (
                            <Cell
                              key={`manager-status-${entry.name}-${index}`}
                              fill={pieColors[index % pieColors.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    renderEmptyChartState('bx-pie-chart', 'No orders have been recorded for this dealer yet.')
                  )}
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-card__title">Customer Feedback</h3>
                  {managerFeedbackList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {managerFeedbackList.map((feedback) => (
                        <div
                          key={feedback.id}
                          style={{
                            padding: '12px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg)'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '12px'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{feedback.customer}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                {feedback.createdAtLabel}
                              </div>
                            </div>
                            {feedback.rating > 0 && (
                              <div style={{ color: 'var(--color-warning)', fontSize: '14px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <i
                                    key={star}
                                    className={`bx ${star <= Math.round(feedback.rating) ? 'bxs-star' : 'bx-star'}`}
                                  ></i>
                                ))}
                              </div>
                            )}
                          </div>
                          {feedback.message && (
                            <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                              {feedback.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    renderEmptyChartState('bx-message-rounded-dots', 'No feedback received from customers yet.')
                  )}
                </div>

                <div className="chart-card">
                  <h3 className="chart-card__title">Recent Customers</h3>
                  {managerRecentCustomers.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                              Name
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                              Email
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                              Phone
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                              Status
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                              Joined
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {managerRecentCustomers.map((customer, index) => (
                            <tr
                              key={customer.id || index}
                              style={{ borderBottom: '1px solid var(--color-border)' }}
                            >
                              <td style={{ padding: '12px', color: 'var(--color-text)' }}>{customer.name}</td>
                              <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{customer.email}</td>
                              <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{customer.phone}</td>
                              <td style={{ padding: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                {customer.status}
                              </td>
                              <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{customer.joined}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    renderEmptyChartState('bx-user-circle', 'No recent customers found for this dealer.')
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {isEVMManager && (
        <>
          {/* Date Range Picker */}
          <div className="chart-card" style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <h3 className="chart-card__title" style={{ margin: 0 }}>System Data Summary</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>From:</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>To:</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <button
                  onClick={fetchEVMData}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
                >
                  <i className="bx bx-refresh"></i> {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
            {error && (
              <div style={{
                padding: '12px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid #FF6B6B',
                borderRadius: 'var(--radius)',
                color: '#FF6B6B',
                marginBottom: '16px'
              }}>
                <i className="bx bx-error-circle"></i> {error}
              </div>
            )}
          </div>

          {/* Order Status Counts */}
          <div className="chart-card" style={{ marginBottom: '24px' }}>
            <h3 className="chart-card__title">Order Status Statistics</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                <div>Loading data...</div>
              </div>
            ) : Object.keys(systemStatus.orderStatusCounts || {}).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-info-circle" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                <div>No data available for this time period</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {Object.entries(systemStatus.orderStatusCounts || {}).map(([status, count]) => {
                  // Map status to colors
                  const getStatusColor = (statusName) => {
                    const upperStatus = statusName.toUpperCase();
                    if (upperStatus.includes('COMPLETED') || upperStatus.includes('DONE') || upperStatus.includes('DELIVERED')) {
                      return '#22C55E'; // Green
                    } else if (upperStatus.includes('PENDING') || upperStatus.includes('WAITING')) {
                      return '#F59E0B'; // Orange/Amber
                    } else if (upperStatus.includes('APPROVED') || upperStatus.includes('CONFIRMED')) {
                      return '#3B82F6'; // Blue
                    } else if (upperStatus.includes('CANCELLED') || upperStatus.includes('REJECTED')) {
                      return '#EF4444'; // Red
                    } else if (upperStatus.includes('PROCESSING') || upperStatus.includes('IN_PROGRESS')) {
                      return '#8B5CF6'; // Purple
                    } else {
                      return 'var(--color-primary)'; // Default red
                    }
                  };

                  return (
                    <div key={status} style={{
                      padding: '16px',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700', 
                        color: getStatusColor(status),
                        marginBottom: '8px'
                      }}>
                        {count?.toLocaleString() || 0}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: 'var(--color-text-muted)',
                        textTransform: 'capitalize'
                      }}>
                        {status.replace(/_/g, ' ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dealer Performance and Order Status Distribution - Side by Side */}
          <div className="charts-grid">
            {/* Dealer Performance */}
            <div className="chart-card">
              <h3 className="chart-card__title">Dealer Performance</h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                  <div>Loading data...</div>
                </div>
              ) : dealerPerformance.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  <i className="bx bx-info-circle" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                  <div>No dealer data available for this time period</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '600' }}>No</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '600' }}>Dealer Name</th>
                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: '600' }} title="Tổng tiền đã đặt tới EVM">Total Sales</th>
                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: '600' }} title="Số đơn hàng đã đặt tới EVM">Total Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dealerPerformance
                        .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
                        .map((dealer, index) => (
                          <tr key={dealer.dealerId || index} style={{ 
                            borderBottom: '1px solid var(--color-border)',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px', color: 'var(--color-text)', fontWeight: '600' }}>
                            {index + 1}
                          </td>
                            <td style={{ padding: '12px', color: 'var(--color-text)', fontWeight: '600' }}>
                              {dealer.dealerName || `Dealer #${dealer.dealerId}`}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-primary)', fontWeight: '600' }}>
                              {formatCurrency(dealer.totalSales || 0)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text)' }}>
                              {(dealer.totalOrders || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Order Status Distribution Chart */}
            {Object.keys(systemStatus.orderStatusCounts || {}).length > 0 && (
              <div className="chart-card">
                <h3 className="chart-card__title">Order Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(systemStatus.orderStatusCounts || {}).map(([name, value]) => ({
                      name: name.replace(/_/g, ' '),
                      value: value || 0
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(systemStatus.orderStatusCounts || {}).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        </>
      )}

      {isAdmin && (
        <>
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-card__title">Users by Role</h3>
              {data.roleDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={110}
                      dataKey="value"
                    >
                      {data.roleDistribution.map((entry, index) => (
                        <Cell
                          key={`role-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `${formatNumber(value)} users`,
                        'Users'
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <i className="bx bx-info-circle" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                  <div>No user role data available</div>
                </div>
              )}
            </div>

            <div className="chart-card">
              <h3 className="chart-card__title">User Status Overview</h3>
              {data.statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={110}
                      dataKey="value"
                    >
                      {data.statusDistribution.map((entry, index) => (
                        <Cell
                          key={`status-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `${formatNumber(value)} users`,
                        'Users'
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <i className="bx bx-info-circle" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                  <div>No user status data available</div>
                </div>
              )}
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-card__title">Top Dealer Revenue</h3>
            {data.dealerRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={data.dealerRevenue}
                  margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-text-muted)"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="var(--color-text-muted)"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar
                    dataKey="revenue"
                    fill="#DC2626"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-info-circle" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                <div>No dealer revenue data available</div>
              </div>
            )}
          </div>

        </>
      )}
    </div>
  );
};

export default Dashboard;
