import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';
import { testDriveAPI } from '../../utils/api/testDriveAPI';

const TestDriveManagement = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingTestDrive, setEditingTestDrive] = useState(null);
  const [formData, setFormData] = useState({
    customer: '',
    vehicle: '',
    date: '',
    time: '',
    phone: '',
    email: '',
    notes: '',
    status: 'scheduled',
  });
  const [testDrives, setTestDrives] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmationData, setConfirmationData] = useState({
    date: '',
    time: '', // Confirmation time is no longer used in the modal but stays for other logic
    note: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const accentColor = '#ff4d4f';
  const labelStyles = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.05em',
    color: 'var(--color-text)',
    textTransform: 'uppercase',
  };
  const labelContentStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };
  const modalInputStyles = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: '14px',
    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.35)',
    transition: 'border 0.2s ease, box-shadow 0.2s ease',
  };

  const dealerId =
    user?.dealerId ??
    user?.dealerID ??
    user?.dealer?.dealerId ??
    user?.dealer?.id ??
    null;

  const normaliseTimeInput = (value) => {
    if (!value) return '';
    const parts = value.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return value;
  };

  const normaliseStatusForCalendar = (status) => {
    const value = (status || '').toString().toUpperCase();
    switch (value) {
      case 'SCHEDULED':
      case 'CONFIRMED':
      case 'APPROVED':
        return 'scheduled';
      case 'COMPLETED':
      case 'DONE':
        return 'completed';
      case 'CANCELLED':
      case 'CANCELED':
      case 'REJECTED':
      case 'DECLINED':
        return 'cancelled';
      default:
        return value.toLowerCase() || 'pending';
    }
  };

  const mapScheduleToTestDrive = (schedule) => {
    const scheduleId = getRequestIdentifier(schedule);

    // Handle date: prefer provided date, otherwise parse from requestTime
    let dateValue = schedule?.date ?? schedule?.confirmedDate ?? schedule?.preferredDate ?? schedule?.requestedDate ?? '';
    if (!dateValue && schedule?.requestTime) {
      try {
        const dateObj = new Date(schedule.requestTime);
        dateValue = dateObj.toISOString().split('T')[0];
      } catch (e) {
        console.warn('Failed to parse requestTime:', e);
      }
    }

    // Handle time: prefer requestTime, otherwise parse fallback fields
    let timeValue = '';
    if (schedule?.requestTime) {
      try {
        const dateObj = new Date(schedule.requestTime);
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        timeValue = `${hours}:${minutes}`;
      } catch (e) {
        console.warn('Failed to parse requestTime:', e);
      }
    }
    // Fallback to other time fields
    if (!timeValue) {
      timeValue = normaliseTimeInput(
        schedule?.confirmedTime ?? schedule?.time ?? schedule?.preferredTime ?? ''
      );
    }

    return {
      id: scheduleId ?? `schedule-${Math.random().toString(36).slice(2)}`,
      customer: schedule?.customerName ?? schedule?.name ?? 'Customer',
      vehicle: schedule?.carModel ?? schedule?.vehicle ?? schedule?.vehicleModel ?? 'Not provided',
      date: dateValue,
      time: timeValue,
      phone: schedule?.phoneNumber ?? schedule?.phone ?? '',
      email: schedule?.customerEmail ?? schedule?.email ?? '',
      notes: schedule?.note ?? schedule?.customerNote ?? '',
      status: normaliseStatusForCalendar(schedule?.status ?? schedule?.requestStatus),
    };
  };

  const getRequestIdentifier = (request) =>
    request?.id ?? request?.scheduleId ?? request?.requestId ?? request?.bookingId ?? null;

  const isPendingStatus = (status) => {
    const value = (status || '').toString().toLowerCase();
    return (
      !value ||
      value === 'pending' ||
      value === 'awaiting' ||
      value === 'awaiting_confirmation' ||
      value === 'awaiting_approval' ||
      value === 'submitted' ||
      value === 'new'
    );
  };

  const loadPendingRequests = useCallback(async () => {
    if (!dealerId) {
      setPendingRequests([]);
      setRequestsError('Unable to determine the current dealer.');
      return;
    }

    setLoadingRequests(true);
    setRequestsError('');
    try {
      const data = await testDriveAPI.getScheduleList(dealerId);
      const schedules = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];
      setPendingRequests(schedules);
      setTestDrives(
        schedules
          .map(mapScheduleToTestDrive)
          .filter((drive) => drive.date && drive.time)
      );
    } catch (error) {
      console.error('Failed to load test drive requests:', error);
      setRequestsError('Unable to load test drive requests.');
      showErrorToast('Failed to load test drive requests.');
    } finally {
      setLoadingRequests(false);
    }
  }, [dealerId]);

  useEffect(() => {
    loadPendingRequests();
  }, [loadPendingRequests]);

  const pendingRequestsForDealer = useMemo(() => {
    return pendingRequests.filter((request) => {
      const requestDealerId =
        request?.dealerId ??
        request?.dealerID ??
        request?.dealer?.dealerId ??
        request?.dealer?.id ??
        request?.dealer_id ??
        null;
      const matchDealer = !dealerId || (requestDealerId !== null && String(requestDealerId) === String(dealerId));
      const status = request?.status ?? request?.requestStatus ?? request?.bookingStatus;
      return matchDealer && isPendingStatus(status);
    });
  }, [pendingRequests, dealerId]);

  const handleOpenConfirmation = (request) => {
    console.log('Opening confirmation for request:', request);
    setSelectedRequest(request);

    // Handle date: prefer provided value, otherwise parse from requestTime
    let dateValue = request?.date ?? request?.confirmedDate ?? request?.preferredDate ?? '';
    if (!dateValue && request?.requestTime) {
      try {
        const dateObj = new Date(request.requestTime);
        // Get date in local timezone to avoid offsets
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        dateValue = `${year}-${month}-${day}`;
        console.log('Parsed date from requestTime:', dateValue);
      } catch (e) {
        console.warn('Failed to parse requestTime for date:', e, request.requestTime);
      }
    }

    // Handle time: prefer requestTime parsing to keep confirmationData.time in sync
    let timeValue = '';
    if (request?.requestTime) {
      try {
        const dateObj = new Date(request.requestTime);
        // Convert to local timezone for display
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        timeValue = `${hours}:${minutes}`;
        console.log('Parsed time from requestTime:', timeValue);
      } catch (e) {
        console.warn('Failed to parse requestTime for time:', e, request.requestTime);
      }
    }
    // Fallback to other time fields
    if (!timeValue) {
      const fallbackTime = request?.confirmedTime ?? request?.time ?? request?.preferredTime ?? '';
      if (fallbackTime) {
        timeValue = normaliseTimeInput(fallbackTime);
        // If time is HH:MM:SS, keep only HH:MM
        if (timeValue.includes(':')) {
          const parts = timeValue.split(':');
          if (parts.length >= 2) {
            timeValue = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          }
        }
        console.log('Using fallback time:', timeValue);
      }
    }

    console.log('Setting confirmation data:', { date: dateValue, time: timeValue });
    setConfirmationData({
      date: dateValue,
      time: timeValue, // Still store time for payload usage when needed
      note: request?.note ?? '',
    });
    setShowConfirmationModal(true);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmationModal(false);
    setSelectedRequest(null);
    setConfirmationData({
      date: '',
      time: '',
      note: '',
    });
  };

  const handleRequestAction = async (action) => {
    if (!selectedRequest) return;

    const scheduleId = getRequestIdentifier(selectedRequest);
    if (!scheduleId) {
      showErrorToast('Missing request identifier. Cannot process.');
      return;
    }

    // Only validate the date; time is optional per requirements
    if (action === 'approve' && !confirmationData.date) {
      showErrorToast('Please select a confirmation date.');
      return;
    }

    // Assumption: confirm requests only require date and note.
    // If the backend needs time, reuse confirmationData.time or a default (e.g., '09:00:00').
    const timeValue = confirmationData.time; // Use parsed/fallback time if available

    const confirmPayload = {
      ...(confirmationData.date ? { date: confirmationData.date } : {}),
      // Skip time unless available or explicitly required
      ...(timeValue ? { time: timeValue + ':00' } : {}),
      ...(confirmationData.note ? { note: confirmationData.note } : {}),
    };

    const rejectPayload = confirmationData.note ? { note: confirmationData.note } : {};

    try {
      setActionLoading(true);
      const updatedRequest =
        action === 'approve'
          ? await testDriveAPI.confirmRequest(scheduleId, confirmPayload)
          : await testDriveAPI.rejectRequest(scheduleId, rejectPayload);
      const fallbackStatus = action === 'approve' ? 'CONFIRMED' : 'REJECTED';
      const mergeWithApiResponse = (request) => {
        const merged = {
          ...request,
          ...(updatedRequest ?? {}),
          status: updatedRequest?.status ?? fallbackStatus,
          id: scheduleId,
        };
        if (action === 'approve' && confirmationData.date && timeValue) {
          try {
            const finalTime = timeValue.length === 5 ? `${timeValue}:00` : timeValue;
            const [hours, minutes] = finalTime.split(':');
            const dateTime = new Date(`${confirmationData.date}T${hours}:${minutes}:00`);
            merged.date = confirmationData.date;
            merged.requestTime = dateTime.toISOString();
            merged.time = timeValue;
          } catch (e) {
            console.warn('Failed to update requestTime:', e);
          }
        }
        return merged;
      };

      setPendingRequests((prev) =>
        prev.map((request) =>
          getRequestIdentifier(request) === scheduleId ? mergeWithApiResponse(request) : request
        )
      );

      const mergedRequest = mergeWithApiResponse(selectedRequest);
      const mappedDrive = mapScheduleToTestDrive(mergedRequest);
      setTestDrives((prev) => {
        const exists = prev.some((drive) => drive.id === mappedDrive.id);
        if (exists) {
          return prev.map((drive) => (drive.id === mappedDrive.id ? mappedDrive : drive));
        }
        // Append to list only when approval succeeds
        if (action === 'approve') {
          return [...prev, mappedDrive];
        }
        return prev;
      });
      showSuccessToast(
        action === 'approve' ? 'Test drive confirmed.' : 'Test drive request rejected.'
      );
      handleCloseConfirmation();
    } catch (error) {
      console.error('Failed to update test drive request:', error);
      showErrorToast('Unable to update the request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Get current month and year
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Get first day of month and days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create calendar grid
  const calendarDays = [];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Align the week to run Sunday through Saturday
  // JS getDay(): 0=Sun ... 6=Sat, so we can use the value directly
  const customDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const startDayOffset = firstDayOfMonth;

  // Add empty cells so that the 1st lands under the correct weekday
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push(null);
  }

  // Add actual days of month
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
      i
    ).padStart(2, '0')}`;
    const drivesOnDay = testDrives.filter((drive) => drive.date === dateStr);
    calendarDays.push({
      day: i,
      date: dateStr,
      count: drivesOnDay.length,
      drives: drivesOnDay,
    });
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Get drives for selected date
  const selectedDayData = calendarDays.find((day) => day && day.day === selectedDate.getDate());
  const drivesForSelectedDate = selectedDayData ? selectedDayData.drives : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'var(--color-info)';
      case 'completed':
        return 'var(--color-success)';
      case 'cancelled':
        return 'var(--color-error)';
      default:
        return 'var(--color-text-muted)';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'scheduled':
        return 'rgba(59, 130, 246, 0.1)';
      case 'completed':
        return 'rgba(34, 197, 94, 0.1)';
      case 'cancelled':
        return 'rgba(239, 68, 68, 0.1)';
      default:
        return 'var(--color-bg)';
    }
  };

  // Check if date is today
  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const handleAddTestDrive = () => {
    setEditingTestDrive(null);
    setFormData({
      customer: '',
      vehicle: '',
      date: selectedDate.toISOString().split('T')[0],
      time: '',
      phone: '',
      email: '',
      notes: '',
      status: 'scheduled',
    });
    setShowModal(true);
  };

  // Keep this handler even though the Edit/Delete buttons were removed from the UI
  const handleEditTestDrive = (testDrive) => {
    setEditingTestDrive(testDrive);
    setFormData({
      customer: testDrive.customer,
      vehicle: testDrive.vehicle,
      date: testDrive.date,
      time: testDrive.time,
      phone: testDrive.phone,
      email: testDrive.email,
      notes: testDrive.notes,
      status: testDrive.status,
    });
    setShowModal(true);
  };

  // Keep this handler even though the Edit/Delete buttons were removed from the UI
  const handleDeleteTestDrive = (testDriveId) => {
    if (window.confirm('Are you sure you want to delete this test drive?')) {
      setTestDrives(testDrives.filter((td) => td.id !== testDriveId));
      showSuccessToast('Test drive deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.customer || !formData.vehicle || !formData.date || !formData.time) {
      showSuccessToast('Please fill in all required fields');
      return;
    }

    const testDriveData = {
      customer: formData.customer,
      vehicle: formData.vehicle,
      date: formData.date,
      time: formData.time,
      phone: formData.phone,
      email: formData.email,
      notes: formData.notes,
      status: formData.status,
    };

    if (editingTestDrive) {
      // Update existing test drive
      setTestDrives(
        testDrives.map((td) =>
          td.id === editingTestDrive.id
            ? { ...td, ...testDriveData }
            : td
        )
      );
      showSuccessToast('Test drive updated successfully');
    } else {
      // Add new test drive
      const newTestDrive = {
        id: `local-${Date.now()}`,
        ...testDriveData,
      };
      setTestDrives([...testDrives, newTestDrive]);
      showSuccessToast('Test drive scheduled successfully');
    }

    setShowModal(false);
    setFormData({
      customer: '',
      vehicle: '',
      date: '',
      time: '',
      phone: '',
      email: '',
      notes: '',
      status: 'scheduled',
    });
  };

  return (
    <div className="main">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Calendar Section */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <h2>Test Drive Calendar</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" onClick={goToPreviousMonth}>
                <i className="bx bx-chevron-left"></i>
              </button>
              <button className="btn btn-outline" onClick={goToToday}>
                Today
              </button>
              <button className="btn btn-outline" onClick={goToNextMonth}>
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </div>

          {/* Month/Year Header */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '24px',
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--color-text)',
            }}
          >
            {monthNames[currentMonth]} {currentYear}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {/* Day names (Custom order: Wed, Thu, Fri, Sat, Sun, Mon, Tue) */}
            {customDayNames.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--color-text-muted)',
                }}
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={index}></div>;
              }

              const isSelected = day.day === selectedDate.getDate();
              const isCurrentDate = isToday(day.day);

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day.day))}
                  style={{
                    minHeight: '80px',
                    padding: '8px',
                    background: isSelected
                      ? 'var(--color-primary)'
                      : isCurrentDate
                      ? 'var(--color-bg)'
                      : 'var(--color-surface)',
                    border: isCurrentDate
                      ? '2px solid var(--color-primary)'
                      : `1px solid var(--color-border)`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isSelected ? 'white' : 'var(--color-text)',
                      marginBottom: '4px',
                    }}
                  >
                    {day.day}
                  </div>
                  {day.count > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isSelected ? 'white' : 'var(--color-primary)',
                        color: isSelected ? 'var(--color-primary)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}
                    >
                      {day.count}
                    </div>
                  )}
                  {day.drives.map((drive, idx) => (
                    <div
                      key={drive.id}
                      style={{
                        fontSize: '11px',
                        padding: '2px 4px',
                        background: getStatusBg(drive.status),
                        color: getStatusColor(drive.status),
                        borderRadius: '2px',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: '500',
                      }}
                      title={drive.customer}
                    >
                      {drive.time}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3>Test Drives on {selectedDate.toLocaleDateString()}</h3>
              <button className="btn btn-primary" onClick={handleAddTestDrive}>
                <i className="bx bx-plus"></i>
                Schedule
              </button>
            </div>

            {drivesForSelectedDate.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {drivesForSelectedDate.map((drive) => (
                  <div
                    key={drive.id}
                    style={{
                      padding: '16px',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--color-text)',
                            marginBottom: '4px',
                          }}
                        >
                          {drive.customer}
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            color: 'var(--color-text-muted)',
                            marginBottom: '6px',
                          }}
                        >
                          <i className="bx bx-car" style={{ marginRight: '4px' }}></i>
                          {drive.vehicle}
                        </div>
                        <div
                          style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}
                        >
                          <i className="bx bx-phone" style={{ marginRight: '4px' }}></i>
                          {drive.phone}
                        </div>
                        <div
                          style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}
                        >
                          <i className="bx bx-envelope" style={{ marginRight: '4px' }}></i>
                          {drive.email}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius)',
                          background: getStatusBg(drive.status),
                          color: getStatusColor(drive.status),
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {drive.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--color-primary)',
                        fontWeight: '600',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className="bx bx-time"></i>
                      {drive.time}
                    </div>
                    {drive.notes && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-text-muted)',
                          fontStyle: 'italic',
                          marginTop: '8px',
                          padding: '8px',
                          background: 'var(--color-surface)',
                          borderRadius: 'var(--radius)',
                          borderLeft: '3px solid var(--color-primary)',
                        }}
                      >
                        <i className="bx bx-note" style={{ marginRight: '4px' }}></i>
                        {drive.notes}
                      </div>
                    )}
                    {/* Edit/Delete buttons intentionally removed */}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--color-text-muted)',
                }}
              >
                <i
                  className="bx bx-calendar-x"
                  style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}
                ></i>
                <div>No test drives scheduled for this date</div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '16px' }}
                  onClick={handleAddTestDrive}
                >
                  <i className="bx bx-plus"></i>
                  Schedule Now
                </button>
              </div>
            )}
          </div>

          {/* Pending Requests */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '12px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              Requests awaiting confirmation
              </h3>
              <button
                className="btn btn-outline"
                style={{
                  fontSize: '12px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={loadPendingRequests}
                disabled={loadingRequests}
              >
                <i
                  className={`bx ${
                    loadingRequests ? 'bx-loader-alt bx-spin' : 'bx-refresh'
                  }`}
                ></i>
                {loadingRequests ? 'Loading' : 'Refresh'}
              </button>
            </div>

            {requestsError ? (
              <div style={{ color: 'var(--color-error)', fontSize: '13px' }}>
                {requestsError}
              </div>
            ) : pendingRequestsForDealer.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: 'var(--color-text-muted)',
                }}
              >
                {loadingRequests ? (
                  <>
                    <i
                      className="bx bx-loader-alt bx-spin"
                      style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}
                    ></i>
                    Loading requests...
                  </>
                ) : (
                  <>
                    <i
                      className="bx bx-inbox"
                      style={{
                        fontSize: '36px',
                        display: 'block',
                        marginBottom: '12px',
                        opacity: 0.6,
                      }}
                    ></i>
                    No pending requests awaiting confirmation
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingRequestsForDealer.map((request) => {
                  const requestId = getRequestIdentifier(request);

                  // Handle date: prefer the explicit date, otherwise parse requestTime
                  let preferredDate =
                    request?.date ??
                    request?.confirmedDate ??
                    request?.preferredDate ??
                    request?.requestedDate ??
                    '';
                  if (!preferredDate && request?.requestTime) {
                    try {
                      const dateObj = new Date(request.requestTime);
                      preferredDate = dateObj.toISOString().split('T')[0];
                    } catch (e) {
                      console.warn('Failed to parse requestTime:', e);
                    }
                  }

                  // Handle time: prefer requestTime parsing
                  let preferredTime = '';
                  if (request?.requestTime) {
                    try {
                      const dateObj = new Date(request.requestTime);
                      const hours = String(dateObj.getHours()).padStart(2, '0');
                      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                      preferredTime = `${hours}:${minutes}`;
                    } catch (e) {
                      console.warn('Failed to parse requestTime:', e);
                    }
                  }
                  // Fallback to other time fields
                  if (!preferredTime) {
                    preferredTime = normaliseTimeInput(
                      request?.confirmedTime ?? request?.time ?? request?.preferredTime ?? ''
                    );
                  }

                  return (
                    <div
                      key={requestId || JSON.stringify(request)}
                      style={{
                        padding: '16px',
                        background: 'var(--color-bg)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: 'var(--color-text)',
                              marginBottom: '4px',
                            }}
                          >
                            {request?.customerName ?? request?.name ?? 'Customer'}
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              color: 'var(--color-text-muted)',
                              marginBottom: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <i className="bx bx-car"></i>
                            {request?.carModel ??
                              request?.vehicle ??
                              request?.vehicleModel ??
                              'Not provided'}
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              color: 'var(--color-text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <i className="bx bx-envelope"></i>
                            {request?.customerEmail ?? request?.email ?? 'N/A'}
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              color: 'var(--color-text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '2px',
                            }}
                          >
                            <i className="bx bx-phone"></i>
                            {request?.phoneNumber ?? request?.phone ?? 'N/A'}
                          </div>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                          onClick={() => handleOpenConfirmation(request)}
                        >
                          <i className="bx bx-check-circle"></i>
                          Review
                        </button>
                      </div>
                      <div
                        style={{
                          marginTop: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: 'var(--color-primary)',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        <i className="bx bx-time"></i>
                        {preferredDate || 'No date selected'}
                        {preferredTime && ` - ${preferredTime}`}
                      </div>
                      {request?.note && (
                        <div
                          style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: 'var(--color-text-muted)',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius)',
                            padding: '8px',
                            borderLeft: '3px solid var(--color-primary)',
                          }}
                        >
                          {request.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '24px',
              padding: '32px',
              width: '96%',
              maxWidth: '740px',
              maxHeight: '92vh',
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 35px 80px rgba(0, 0, 0, 0.55)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: 'rgba(255, 77, 79, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: accentColor,
                    fontSize: '24px',
                  }}
                >
                  <i className="bx bx-calendar-event"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '22px' }}>
                    {editingTestDrive ? 'Edit Test Drive' : 'Schedule New Test Drive'}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Fill out the information below to create a polished booking.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={labelStyles}>
                    <span style={labelContentStyles}>
                      <i className="bx bx-user" style={{ color: accentColor, fontSize: '16px' }}></i>
                      Customer Name *
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    style={modalInputStyles}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label style={labelStyles}>
                    <span style={labelContentStyles}>
                      <i className="bx bx-car" style={{ color: accentColor, fontSize: '16px' }}></i>
                      Vehicle *
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    style={modalInputStyles}
                    placeholder="Tesla Model 3"
                    required
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label style={labelStyles}>
                      <span style={labelContentStyles}>
                        <i className="bx bx-calendar" style={{ color: accentColor, fontSize: '16px' }}></i>
                        Date *
                      </span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      style={modalInputStyles}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyles}>
                      <span style={labelContentStyles}>
                        <i className="bx bx-time-five" style={{ color: accentColor, fontSize: '16px' }}></i>
                        Time *
                      </span>
                    </label>
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      style={modalInputStyles}
                      required
                    >
                      <option value="">Select Time</option>
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="1:00 PM">1:00 PM</option>
                      <option value="2:00 PM">2:00 PM</option>
                      <option value="3:00 PM">3:00 PM</option>
                      <option value="4:00 PM">4:00 PM</option>
                      <option value="5:00 PM">5:00 PM</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label style={labelStyles}>
                      <span style={labelContentStyles}>
                        <i className="bx bx-phone" style={{ color: accentColor, fontSize: '16px' }}></i>
                        Phone
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={modalInputStyles}
                      placeholder="+1-234-567-8901"
                    />
                  </div>

                  <div>
                    <label style={labelStyles}>
                      <span style={labelContentStyles}>
                        <i className="bx bx-envelope" style={{ color: accentColor, fontSize: '16px' }}></i>
                        Email
                      </span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={modalInputStyles}
                      placeholder="john.doe@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyles}>
                    <span style={labelContentStyles}>
                      <i className="bx bx-flag" style={{ color: accentColor, fontSize: '16px' }}></i>
                      Status
                    </span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={modalInputStyles}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyles}>
                    <span style={labelContentStyles}>
                      <i className="bx bx-note" style={{ color: accentColor, fontSize: '16px' }}></i>
                      Notes
                    </span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ ...modalInputStyles, minHeight: '110px', resize: 'vertical' }}
                    placeholder="Additional notes about the test drive..."
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '28px',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                  style={{
                    borderColor: accentColor,
                    color: accentColor,
                    minWidth: '130px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: accentColor,
                    borderColor: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '180px',
                    justifyContent: 'center',
                  }}
                >
                  <i className="bx bx-send"></i>
                  {editingTestDrive ? 'Update Test Drive' : 'Schedule Test Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal (updated) */}
      {showConfirmationModal && selectedRequest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              width: '90%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ margin: 0 }}>Confirm test drive request</h3>
              <button
                onClick={handleCloseConfirmation}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div
                style={{
                  background: 'var(--color-bg)',
                  padding: '16px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '8px',
                  }}
                >
                  {selectedRequest?.customerName ?? selectedRequest?.name ?? 'Customer'}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-muted)',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="bx bx-car"></i>
                  {selectedRequest?.carModel ??
                    selectedRequest?.vehicle ??
                    selectedRequest?.vehicleModel ??
                    'Not provided'}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="bx bx-envelope"></i>
                  {selectedRequest?.customerEmail ?? selectedRequest?.email ?? 'N/A'}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px',
                  }}
                >
                  <i className="bx bx-phone"></i>
                  {selectedRequest?.phoneNumber ?? selectedRequest?.phone ?? 'N/A'}
                </div>
                {selectedRequest?.note && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                      marginTop: '12px',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: 'var(--color-text)' }}>
                      Customer note:
                    </strong>{' '}
                    {selectedRequest.note}
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                  }}
                >
                  Confirmation date *
                </label>
                <input
                  type="date"
                  value={confirmationData.date || ''}
                  onChange={(e) => {
                    console.log('Date changed:', e.target.value);
                    setConfirmationData((prev) => ({ ...prev, date: e.target.value }));
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                  }}
                  required
                />
                {!confirmationData.date && (
                  <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>
                    Please select a confirmation date
                  </div>
                )}
              </div>

              {/* Time input removed per requirement */}

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                  }}
                >
                  Internal note
                </label>
                <textarea
                  value={confirmationData.note}
                  onChange={(e) => setConfirmationData((prev) => ({ ...prev, note: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    minHeight: '90px',
                    resize: 'vertical',
                  }}
                  placeholder="Notes for the team or customer..."
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleRequestAction('reject')}
                disabled={actionLoading}
                style={{ color: 'var(--color-error)' }}
              >
                {actionLoading ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin"></i>
                    Processing
                  </>
                ) : (
                  <>
                    <i className="bx bx-x-circle"></i>
                    Reject
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleRequestAction('approve')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin"></i>
                    Processing
                  </>
                ) : (
                  <>
                    <i className="bx bx-check-circle"></i>
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDriveManagement;   