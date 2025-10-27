import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import 'boxicons/css/boxicons.min.css';

const CustomerFeedback = ({ user }) => {
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 'FB-001',
      customer: 'John Smith',
      email: 'john@email.com',
      phone: '+1 234 567 8900',
      type: 'complaint',
      category: 'delivery',
      subject: 'Late delivery of Tesla Model 3',
      message: 'My vehicle was supposed to be delivered on January 25th but it\'s now January 28th and I still haven\'t received it. This is very disappointing.',
      priority: 'high',
      status: 'open',
      assignedTo: 'Sarah Johnson',
      createdDate: '2024-01-28',
      resolvedDate: null,
      resolution: null,
      rating: 2,
      orderId: 'ORD-001'
    },
    {
      id: 'FB-002',
      customer: 'Jane Doe',
      email: 'jane@email.com',
      phone: '+1 234 567 8901',
      type: 'feedback',
      category: 'service',
      subject: 'Excellent customer service',
      message: 'The staff at Metro Auto Group was very helpful and professional. They answered all my questions and made the buying process smooth.',
      priority: 'low',
      status: 'resolved',
      assignedTo: 'Mike Chen',
      createdDate: '2024-01-25',
      resolvedDate: '2024-01-26',
      resolution: 'Thank you for your positive feedback. We appreciate your business.',
      rating: 5,
      orderId: 'ORD-002'
    },
    {
      id: 'FB-003',
      customer: 'Mike Wilson',
      email: 'mike@email.com',
      phone: '+1 234 567 8902',
      type: 'complaint',
      category: 'vehicle',
      subject: 'Vehicle quality issue',
      message: 'The BMW i3 I purchased has a strange noise coming from the engine. I\'ve only had it for a week.',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'David Brown',
      createdDate: '2024-01-27',
      resolvedDate: null,
      resolution: null,
      rating: 1,
      orderId: 'ORD-003'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customer: '',
    email: '',
    phone: '',
    type: 'feedback',
    category: 'service',
    subject: '',
    message: '',
    priority: 'normal',
    assignedTo: '',
    orderId: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'var(--color-warning)';
      case 'in_progress': return 'var(--color-info)';
      case 'resolved': return 'var(--color-success)';
      case 'closed': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'var(--color-success)';
      case 'normal': return 'var(--color-info)';
      case 'high': return 'var(--color-warning)';
      case 'urgent': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'feedback': return 'var(--color-success)';
      case 'complaint': return 'var(--color-error)';
      case 'suggestion': return 'var(--color-info)';
      case 'inquiry': return 'var(--color-primary)';
      default: return 'var(--color-text-muted)';
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    const matchesType = filterType === 'all' || feedback.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddFeedback = () => {
    setEditingFeedback(null);
    setFormData({
      customer: '',
      email: '',
      phone: '',
      type: 'feedback',
      category: 'service',
      subject: '',
      message: '',
      priority: 'normal',
      assignedTo: '',
      orderId: ''
    });
    setShowModal(true);
  };

  const handleEditFeedback = (feedback) => {
    setEditingFeedback(feedback);
    setFormData({
      customer: feedback.customer,
      email: feedback.email,
      phone: feedback.phone,
      type: feedback.type,
      category: feedback.category,
      subject: feedback.subject,
      message: feedback.message,
      priority: feedback.priority,
      assignedTo: feedback.assignedTo,
      orderId: feedback.orderId
    });
    setShowModal(true);
  };

  const handleStatusChange = (feedbackId, newStatus) => {
    const updatedFeedbacks = feedbacks.map(f => {
      if (f.id === feedbackId) {
        const updatedFeedback = { ...f, status: newStatus };
        
        if (newStatus === 'resolved' && !f.resolvedDate) {
          updatedFeedback.resolvedDate = new Date().toISOString().split('T')[0];
        }
        
        return updatedFeedback;
      }
      return f;
    });
    
    setFeedbacks(updatedFeedbacks);
    showSuccessToast(`Feedback status updated to ${newStatus.replace('_', ' ')}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.customer || !formData.subject || !formData.message) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    const feedbackData = {
      customer: formData.customer,
      email: formData.email,
      phone: formData.phone,
      type: formData.type,
      category: formData.category,
      subject: formData.subject,
      message: formData.message,
      priority: formData.priority,
      assignedTo: formData.assignedTo,
      orderId: formData.orderId,
      createdDate: new Date().toISOString().split('T')[0]
    };

    if (editingFeedback) {
      setFeedbacks(feedbacks.map(f => 
        f.id === editingFeedback.id 
          ? { ...f, ...feedbackData }
          : f
      ));
      showSuccessToast('Feedback updated successfully');
    } else {
      const newFeedback = {
        id: `FB-${String(Math.max(...feedbacks.map(f => parseInt(f.id.split('-')[1]))) + 1).padStart(3, '0')}`,
        ...feedbackData,
        status: 'open',
        resolvedDate: null,
        resolution: null,
        rating: 0
      };
      setFeedbacks([...feedbacks, newFeedback]);
      showSuccessToast('Feedback created successfully');
    }

    setShowModal(false);
  };

  const totalFeedbacks = feedbacks.length;
  const openFeedbacks = feedbacks.filter(f => f.status === 'open').length;
  const resolvedFeedbacks = feedbacks.filter(f => f.status === 'resolved').length;
  const averageRating = feedbacks.filter(f => f.rating > 0).reduce((sum, f) => sum + f.rating, 0) / feedbacks.filter(f => f.rating > 0).length;

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Customer Feedback & Complaints</h2>
          <button className="btn btn-primary" onClick={handleAddFeedback}>
            <i className="bx bx-plus"></i>
            Add Feedback
          </button>
        </div>

        {/* Feedback Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Feedbacks', value: totalFeedbacks, icon: 'bx-message', color: 'var(--color-primary)' },
            { label: 'Open Issues', value: openFeedbacks, icon: 'bx-time', color: 'var(--color-warning)' },
            { label: 'Resolved', value: resolvedFeedbacks, icon: 'bx-check-circle', color: 'var(--color-success)' },
            { label: 'Avg Rating', value: averageRating ? averageRating.toFixed(1) : 'N/A', icon: 'bx-star', color: 'var(--color-info)' }
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

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}></i>
              <input
                type="text"
                placeholder="Search feedbacks..."
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
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'feedback', 'complaint', 'suggestion', 'inquiry'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`btn ${filterType === type ? 'btn-secondary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Feedbacks Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Subject</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Priority</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Assigned To</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Rating</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((feedback) => (
                <tr key={feedback.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', fontWeight: '600' }}>{feedback.id}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{feedback.customer}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{feedback.email}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>
                    <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {feedback.subject}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getTypeColor(feedback.type),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {feedback.type}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getPriorityColor(feedback.priority),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {feedback.priority}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: getStatusColor(feedback.status),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {feedback.status.replace('_', ' ')}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)' }}>{feedback.assignedTo || 'Unassigned'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {feedback.rating > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <i 
                            key={i} 
                            className={`bx ${i < feedback.rating ? 'bxs-star' : 'bx-star'}`}
                            style={{ 
                              color: i < feedback.rating ? 'var(--color-warning)' : 'var(--color-text-muted)',
                              fontSize: '14px'
                            }}
                          ></i>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>No rating</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', fontSize: '14px' }}
                        onClick={() => handleEditFeedback(feedback)}
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                      {feedback.status === 'open' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(feedback.id, 'in_progress')}
                        >
                          <i className="bx bx-play"></i>
                        </button>
                      )}
                      {feedback.status === 'in_progress' && (
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '6px', fontSize: '14px' }}
                          onClick={() => handleStatusChange(feedback.id, 'resolved')}
                        >
                          <i className="bx bx-check"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFeedbacks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <i className="bx bx-message" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <div>No feedback found</div>
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
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>{editingFeedback ? 'Edit Feedback' : 'Add New Feedback'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                      required
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
                    />
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
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Order ID
                    </label>
                    <input
                      type="text"
                      value={formData.orderId}
                      onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
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
                      <option value="feedback">Feedback</option>
                      <option value="complaint">Complaint</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="inquiry">Inquiry</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
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
                      <option value="service">Service</option>
                      <option value="delivery">Delivery</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="payment">Payment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
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
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
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
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      minHeight: '120px',
                      resize: 'vertical'
                    }}
                    placeholder="Please describe your feedback, complaint, or inquiry in detail..."
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    Assign To
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
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
                    <option value="">Select Staff Member</option>
                    <option value="Sarah Johnson">Sarah Johnson</option>
                    <option value="Mike Chen">Mike Chen</option>
                    <option value="David Brown">David Brown</option>
                    <option value="Lisa Garcia">Lisa Garcia</option>
                  </select>
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
                  {editingFeedback ? 'Update Feedback' : 'Add Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerFeedback;

