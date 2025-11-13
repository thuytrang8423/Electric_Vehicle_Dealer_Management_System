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
    time: '', // Giờ xác nhận không còn được sử dụng trong modal nhưng vẫn giữ trong state cho các logic khác
    note: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

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

    // Xử lý date: ưu tiên date, nếu không có thì parse từ requestTime
    let dateValue = schedule?.date ?? schedule?.confirmedDate ?? schedule?.preferredDate ?? schedule?.requestedDate ?? '';
    if (!dateValue && schedule?.requestTime) {
      try {
        const dateObj = new Date(schedule.requestTime);
        dateValue = dateObj.toISOString().split('T')[0];
      } catch (e) {
        console.warn('Failed to parse requestTime:', e);
      }
    }

    // Xử lý time: ưu tiên requestTime, parse để lấy time
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
      customer: schedule?.customerName ?? schedule?.name ?? 'Khách hàng',
      vehicle: schedule?.carModel ?? schedule?.vehicle ?? schedule?.vehicleModel ?? 'Chưa cập nhật',
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
      setRequestsError('Không xác định được đại lý hiện tại.');
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
      setRequestsError('Không thể tải danh sách yêu cầu thử xe.');
      showErrorToast('Tải danh sách yêu cầu thử xe thất bại.');
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

    // Xử lý date: ưu tiên date, nếu không có thì parse từ requestTime
    let dateValue = request?.date ?? request?.confirmedDate ?? request?.preferredDate ?? '';
    if (!dateValue && request?.requestTime) {
      try {
        const dateObj = new Date(request.requestTime);
        // Lấy date theo local timezone để tránh timezone issues
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        dateValue = `${year}-${month}-${day}`;
        console.log('Parsed date from requestTime:', dateValue);
      } catch (e) {
        console.warn('Failed to parse requestTime for date:', e, request.requestTime);
      }
    }

    // Xử lý time: ưu tiên requestTime, parse để lấy time (Giữ lại logic này cho việc set confirmationData.time)
    let timeValue = '';
    if (request?.requestTime) {
      try {
        const dateObj = new Date(request.requestTime);
        // Lấy time theo local timezone
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
        // Nếu time có format HH:MM:SS, chỉ lấy HH:MM
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
      time: timeValue, // Vẫn set time để có thể dùng cho payload nếu cần
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
      showErrorToast('Thiếu mã định danh yêu cầu. Không thể xử lý.');
      return;
    }

    // Chỉ kiểm tra date, loại bỏ kiểm tra time theo yêu cầu
    if (action === 'approve' && !confirmationData.date) {
      showErrorToast('Vui lòng chọn ngày xác nhận.');
      return;
    }

    // Giả định: Khi CONFIRM, chỉ gửi date và note.
    // Nếu API backend yêu cầu time, chúng ta có thể sử dụng confirmationData.time hoặc mặc định một giá trị (ví dụ: '09:00:00').
    const timeValue = confirmationData.time; // Sử dụng time đã được parse/fallback hoặc để trống

    const confirmPayload = {
      ...(confirmationData.date ? { date: confirmationData.date } : {}),
      // KHÔNG BAO GỒM time vào payload nếu API cho phép xác nhận mà không cần giờ
      ...(timeValue ? { time: timeValue + ':00' } : {}), // Thêm time vào payload nếu có giá trị và format lại
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
      setPendingRequests((prev) =>
        prev.map((request) => {
          const requestId = getRequestIdentifier(request);
          if (requestId === scheduleId) {
            const nextStatus = updatedRequest?.status ?? fallbackStatus;
            const mergedRequest = {
              ...request,
              ...(updatedRequest ?? {}),
              status: nextStatus,
              id: scheduleId,
            };
            // Cập nhật date và requestTime nếu approve
            if (action === 'approve' && confirmationData.date && timeValue) {
              try {
                // Giả định timeValue là HH:MM, cần thêm :00 để tạo ISO string nếu cần
                const finalTime = timeValue.length === 5 ? `${timeValue}:00` : timeValue;
                const [hours, minutes] = finalTime.split(':');
                const dateTime = new Date(`${confirmationData.date}T${hours}:${minutes}:00`);
                mergedRequest.date = confirmationData.date;
                mergedRequest.requestTime = dateTime.toISOString();
                mergedRequest.time = timeValue; // Cập nhật lại time cho hiển thị
              } catch (e) {
                console.warn('Failed to update requestTime:', e);
              }
            }
            return mergedRequest;
          }
          return request;
        })
      );
      const nextStatus = updatedRequest?.status ?? fallbackStatus;
      const mergedRequest = {
        ...selectedRequest,
        ...(updatedRequest ?? {}),
        status: nextStatus,
        id: scheduleId,
      };
      // Cập nhật date và requestTime nếu approve
      if (action === 'approve' && confirmationData.date && timeValue) {
        try {
          const finalTime = timeValue.length === 5 ? `${timeValue}:00` : timeValue;
          const [hours, minutes] = finalTime.split(':');
          const dateTime = new Date(`${confirmationData.date}T${hours}:${minutes}:00`);
          mergedRequest.date = confirmationData.date;
          mergedRequest.requestTime = dateTime.toISOString();
          mergedRequest.time = timeValue; // Cập nhật lại time cho hiển thị
        } catch (e) {
          console.warn('Failed to update requestTime:', e);
        }
      }
      const mappedDrive = mapScheduleToTestDrive(mergedRequest);
      setTestDrives((prev) => {
        const exists = prev.some((drive) => drive.id === mappedDrive.id);
        if (exists) {
          return prev.map((drive) => (drive.id === mappedDrive.id ? mappedDrive : drive));
        }
        // Thêm vào danh sách nếu là confirm
        if (action === 'approve') {
          return [...prev, mappedDrive];
        }
        return prev;
      });
      showSuccessToast(
        action === 'approve' ? 'Đã xác nhận lịch thử xe.' : 'Đã từ chối yêu cầu thử xe.'
      );
      handleCloseConfirmation();
    } catch (error) {
      console.error('Failed to update test drive request:', error);
      showErrorToast('Không thể cập nhật yêu cầu. Vui lòng thử lại.');
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
  const dayNames = ['Sun', 'Sat', 'Fri', 'Thu', 'Wed', 'Tue', 'Mon'].reverse(); // Đảo ngược để khớp với hình ảnh (Wed, Thu, Fri, Sat, Sun, Mon, Tue)
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

  // Logic để căn chỉnh ngày trong tuần bắt đầu từ 'Wed' (Thứ Tư)
  // Trong JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Nếu muốn bắt đầu từ T2-CN (Mon-Sun): firstDayOfMonth là 1-7 (Mon=1, Sun=7)
  // Nếu muốn bắt đầu từ W-S (Wed-Sat): cần tính lại offset
  // Giả định lịch chuẩn: Mon-Sun (vì hình ảnh có Wed, Thu, Fri, Sat, Sun, Mon, Tue) => DayNames phải là Mon, Tue, Wed, Thu, Fri, Sat, Sun.
  // Tuy nhiên, hình ảnh có vẻ là: Wed, Thu, Fri, Sat, 1 (Sun), 2 (Mon)...
  // Dựa trên hình ảnh, thứ tự đầu tiên có vẻ là: Wed, Thu, Fri, Sat, Sun, Mon, Tue.
  const customDayNames = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];

  // Tính toán offset để ngày 1 rơi vào cột 'Wed'
  // JS getDay() trả về: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Custom header order index: 0=Wed, 1=Thu, 2=Fri, 3=Sat, 4=Sun, 5=Mon, 6=Tue
  const dayIndexMap = {
    0: 4, // Sun -> Index 4
    1: 5, // Mon -> Index 5
    2: 6, // Tue -> Index 6
    3: 0, // Wed -> Index 0
    4: 1, // Thu -> Index 1
    5: 2, // Fri -> Index 2
    6: 3, // Sat -> Index 3
  };
  const startDayOffset = dayIndexMap[firstDayOfMonth];

  // Add empty cells for days before first day of month (dựa trên thứ tự Wed-Tue)
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

  // Giữ lại hàm này nhưng sẽ không được gọi từ UI (đã xóa nút Edit/Delete)
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

  // Giữ lại hàm này nhưng sẽ không được gọi từ UI (đã xóa nút Edit/Delete)
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
                    {/* XÓA NÚT EDIT VÀ DELETE THEO YÊU CẦU */}
                    {/* <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1, fontSize: '12px' }}
                      onClick={() => handleEditTestDrive(drive)}
                    >
                      <i className="bx bx-edit"></i>
                      Edit
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1, fontSize: '12px', color: 'var(--color-error)' }}
                      onClick={() => handleDeleteTestDrive(drive.id)}
                    >
                      <i className="bx bx-trash"></i>
                      Delete
                    </button>
                    </div> */}
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
                Yêu cầu chờ xác nhận
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
                {loadingRequests ? 'Đang tải' : 'Làm mới'}
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
                    Đang tải yêu cầu...
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
                    Không có yêu cầu chờ xác nhận
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingRequestsForDealer.map((request) => {
                  const requestId = getRequestIdentifier(request);

                  // Xử lý date: ưu tiên date, nếu không có thì parse từ requestTime
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

                  // Xử lý time: ưu tiên requestTime, parse để lấy time
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
                            {request?.customerName ?? request?.name ?? 'Khách hàng'}
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
                              'Chưa cập nhật'}
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
                          Xử lý
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
                        {preferredDate || 'Chưa chọn ngày'}
                        {preferredTime && `• ${preferredTime}`}
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

      {/* Add/Edit Modal (Không thay đổi) */}
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
              borderRadius: 'var(--radius)',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h3>{editingTestDrive ? 'Edit Test Drive' : 'Schedule New Test Drive'}</h3>
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
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                    }}
                  >
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                    }}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                    }}
                  >
                    Vehicle *
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                    }}
                    placeholder="Tesla Model 3"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Time *
                    </label>
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                      }}
                      placeholder="+1-234-567-8901"
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px',
                      }}
                      placeholder="john.doe@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                    }}
                  >
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
                      fontSize: '14px',
                    }}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                    }}
                  >
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical',
                    }}
                    placeholder="Additional notes about the test drive..."
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
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTestDrive ? 'Update Test Drive' : 'Schedule Test Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal (ĐÃ CHỈNH SỬA) */}
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
              <h3 style={{ margin: 0 }}>Xác nhận yêu cầu thử xe</h3>
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
                  {selectedRequest?.customerName ?? selectedRequest?.name ?? 'Khách hàng'}
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
                    'Chưa cập nhật'}
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
                      Ghi chú khách hàng:
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
                  Ngày xác nhận *
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
                    Vui lòng chọn ngày xác nhận
                  </div>
                )}
              </div>

              {/* ĐÃ LOẠI BỎ TRƯỜNG 'Giờ xác nhận *' THEO YÊU CẦU */}
              {/* <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                  Giờ xác nhận *
                </label>
                <input
                  type="time"
                  value={confirmationData.time || ''}
                  onChange={(e) => {
                    console.log('Time changed:', e.target.value);
                    setConfirmationData((prev) => ({ ...prev, time: e.target.value }));
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
                />
                {!confirmationData.time && (
                  <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>
                    Vui lòng chọn giờ xác nhận
                  </div>
                )}
              </div> */}

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
                  Ghi chú nội bộ
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
                  placeholder="Ghi chú cho đội ngũ hoặc khách hàng..."
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
                    Đang xử lý
                  </>
                ) : (
                  <>
                    <i className="bx bx-x-circle"></i>
                    Từ chối
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
                    Đang xử lý
                  </>
                ) : (
                  <>
                    <i className="bx bx-check-circle"></i>
                    Đồng ý
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