import React, { useState } from 'react';
import { showSuccessToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

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
    status: 'scheduled'
  });
  const [testDrives, setTestDrives] = useState([
    { id: 1, customer: 'John Doe', vehicle: 'Tesla Model 3', date: '2025-10-12', time: '10:00 AM', status: 'scheduled', notes: '', phone: '+1-234-567-8901', email: 'john.doe@email.com' },
    { id: 2, customer: 'Jane Smith', vehicle: 'BMW i3', date: '2025-10-12', time: '2:00 PM', status: 'completed', notes: 'Customer showed high interest', phone: '+1-234-567-8902', email: 'jane.smith@email.com' },
    { id: 3, customer: 'Mike Chen', vehicle: 'Nissan Leaf', date: '2025-10-10', time: '11:00 AM', status: 'scheduled', notes: '', phone: '+1-234-567-8903', email: 'mike.chen@email.com' },
    { id: 4, customer: 'Lisa Brown', vehicle: 'Chevrolet Bolt', date: '2025-10-11', time: '3:00 PM', status: 'scheduled', notes: '', phone: '+1-234-567-8904', email: 'lisa.brown@email.com' },
    { id: 5, customer: 'Tom Wilson', vehicle: 'Tesla Model Y', date: '2025-10-14', time: '10:00 AM', status: 'scheduled', notes: '', phone: '+1-234-567-8905', email: 'tom.wilson@email.com' },
    { id: 6, customer: 'Sarah Johnson', vehicle: 'Audi e-tron', date: '2025-10-08', time: '9:00 AM', status: 'scheduled', notes: 'First time buyer', phone: '+1-234-567-8906', email: 'sarah.j@email.com' },
    { id: 7, customer: 'David Lee', vehicle: 'Tesla Model 3', date: '2025-10-08', time: '3:00 PM', status: 'completed', notes: 'Very satisfied with the drive', phone: '+1-234-567-8907', email: 'david.lee@email.com' },
    { id: 8, customer: 'Emily Davis', vehicle: 'BMW i3', date: '2025-10-09', time: '11:00 AM', status: 'scheduled', notes: 'Follow up call needed', phone: '+1-234-567-8908', email: 'emily.davis@email.com' },
    { id: 9, customer: 'Robert Martinez', vehicle: 'Ford Mustang Mach-E', date: '2025-10-09', time: '2:00 PM', status: 'scheduled', notes: '', phone: '+1-234-567-8909', email: 'robert.m@email.com' },
    { id: 10, customer: 'Olivia Garcia', vehicle: 'Hyundai IONIQ 5', date: '2025-10-11', time: '10:00 AM', status: 'cancelled', notes: 'Customer had to reschedule', phone: '+1-234-567-8910', email: 'olivia.g@email.com' },
    { id: 11, customer: 'James Anderson', vehicle: 'Tesla Model 3', date: '2025-10-13', time: '1:00 PM', status: 'scheduled', notes: '', phone: '+1-234-567-8911', email: 'james.a@email.com' },
    { id: 12, customer: 'Sophia Taylor', vehicle: 'Nissan Leaf', date: '2025-10-13', time: '4:00 PM', status: 'scheduled', notes: 'Family test drive', phone: '+1-234-567-8912', email: 'sophia.t@email.com' },
    { id: 13, customer: 'Michael White', vehicle: 'Chevrolet Bolt', date: '2025-10-15', time: '9:00 AM', status: 'scheduled', notes: '', phone: '+1-234-567-8913', email: 'michael.w@email.com' },
    { id: 14, customer: 'Jessica Moore', vehicle: 'Tesla Model Y', date: '2025-10-15', time: '11:00 AM', status: 'scheduled', notes: 'Trade-in evaluation needed', phone: '+1-234-567-8914', email: 'jessica.m@email.com' },
    { id: 15, customer: 'Christopher Harris', vehicle: 'Audi e-tron', date: '2025-10-16', time: '2:00 PM', status: 'scheduled', notes: '', phone: '+1-234-567-8915', email: 'christopher.h@email.com' }
  ]);

  // Get current month and year
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Get first day of month and days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create calendar grid
  const calendarDays = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add actual days of month
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const drivesOnDay = testDrives.filter(drive => drive.date === dateStr);
    calendarDays.push({
      day: i,
      date: dateStr,
      count: drivesOnDay.length,
      drives: drivesOnDay
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
  const selectedDayData = calendarDays.find(day => day && day.day === selectedDate.getDate());
  const drivesForSelectedDate = selectedDayData ? selectedDayData.drives : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'var(--color-info)';
      case 'completed': return 'var(--color-success)';
      case 'cancelled': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'scheduled': return 'rgba(59, 130, 246, 0.1)';
      case 'completed': return 'rgba(34, 197, 94, 0.1)';
      case 'cancelled': return 'rgba(239, 68, 68, 0.1)';
      default: return 'var(--color-bg)';
    }
  };

  // Check if date is today
  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
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
      status: 'scheduled'
    });
    setShowModal(true);
  };

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
      status: testDrive.status
    });
    setShowModal(true);
  };

  const handleDeleteTestDrive = (testDriveId) => {
    if (window.confirm('Are you sure you want to delete this test drive?')) {
      setTestDrives(testDrives.filter(td => td.id !== testDriveId));
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
      status: formData.status
    };

    if (editingTestDrive) {
      // Update existing test drive
      setTestDrives(testDrives.map(td => 
        td.id === editingTestDrive.id 
          ? { ...td, ...testDriveData }
          : td
      ));
      showSuccessToast('Test drive updated successfully');
    } else {
      // Add new test drive
      const newTestDrive = {
        id: Math.max(...testDrives.map(td => td.id)) + 1,
        ...testDriveData
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
      status: 'scheduled'
    });
  };

  return (
    <div className="main">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Calendar Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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
          <div style={{ textAlign: 'center', marginBottom: '24px', fontSize: '20px', fontWeight: '700', color: 'var(--color-text)' }}>
            {monthNames[currentMonth]} {currentYear}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {/* Day names */}
            {dayNames.map(day => (
              <div key={day} style={{ 
                textAlign: 'center', 
                padding: '12px', 
                fontWeight: '600', 
                fontSize: '14px',
                color: 'var(--color-text-muted)' 
              }}>
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
                    background: isSelected ? 'var(--color-primary)' : isCurrentDate ? 'var(--color-bg)' : 'var(--color-surface)',
                    border: isCurrentDate ? '2px solid var(--color-primary)' : `1px solid var(--color-border)`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: isSelected ? 'white' : 'var(--color-text)',
                    marginBottom: '4px'
                  }}>
                    {day.day}
                  </div>
                  {day.count > 0 && (
                    <div style={{
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
                      fontWeight: '700'
                    }}>
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
                        fontWeight: '500'
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>{drive.customer}</div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          <i className="bx bx-car" style={{ marginRight: '4px' }}></i>
                          {drive.vehicle}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          <i className="bx bx-phone" style={{ marginRight: '4px' }}></i>
                          {drive.phone}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          <i className="bx bx-envelope" style={{ marginRight: '4px' }}></i>
                          {drive.email}
                        </div>
                      </div>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        background: getStatusBg(drive.status),
                        color: getStatusColor(drive.status),
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap'
                      }}>
                        {drive.status}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: 'var(--color-primary)', 
                      fontWeight: '600', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="bx bx-time"></i> 
                      {drive.time}
                    </div>
                    {drive.notes && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: 'var(--color-text-muted)', 
                        fontStyle: 'italic', 
                        marginTop: '8px', 
                        padding: '8px',
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius)',
                        borderLeft: '3px solid var(--color-primary)'
                      }}>
                        <i className="bx bx-note" style={{ marginRight: '4px' }}></i>
                        {drive.notes}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <i className="bx bx-calendar-x" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <div>No test drives scheduled for this date</div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAddTestDrive}>
                  <i className="bx bx-plus"></i>
                  Schedule Now
                </button>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Quick Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Total Scheduled', value: testDrives.filter(d => d.status === 'scheduled').length, icon: 'bx-calendar', color: 'var(--color-info)' },
                { label: 'This Month', value: testDrives.filter(d => {
                  const driveDate = new Date(d.date);
                  return driveDate.getMonth() === currentMonth && driveDate.getFullYear() === currentYear;
                }).length, icon: 'bx-calendar-alt', color: 'var(--color-primary)' },
                { label: 'Completed', value: testDrives.filter(d => d.status === 'completed').length, icon: 'bx-check-circle', color: 'var(--color-success)' }
              ].map((stat, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px'
                    }}>
                      <i className={`bx ${stat.icon}`}></i>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text)' }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
              <h3>{editingTestDrive ? 'Edit Test Drive' : 'Schedule New Test Drive'}</h3>
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
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Vehicle *
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px'
                    }}
                    placeholder="Tesla Model 3"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
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
                      Time *
                    </label>
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
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
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="+1-234-567-8901"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                      placeholder="john.doe@email.com"
                    />
                  </div>
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
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
                    placeholder="Additional notes about the test drive..."
                  />
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
                  {editingTestDrive ? 'Update Test Drive' : 'Schedule Test Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDriveManagement;
