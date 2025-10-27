import React from 'react';
import 'boxicons/css/boxicons.min.css';

const DeleteUserModal = ({ user, onConfirm, onCancel }) => {
  return (
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
        zIndex: 1000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '700px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red Header */}
        <div style={{
          background: '#ef4444',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            Confirm Deletion
          </h3>
          
          {/* Close Button */}
          <button 
            onClick={onCancel}
            style={{ 
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              padding: '4px',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s ease',
              width: '32px',
              height: '32px'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1';
            }}
          >
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '40px 30px',
          textAlign: 'center',
          background: 'white'
        }}>
          {/* Warning Icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="bx bxs-error-circle" style={{
                fontSize: '48px',
                color: 'white'
              }}></i>
            </div>
          </div>

          {/* Confirmation Text */}
          <p style={{ 
            fontSize: '16px',
            color: '#374151',
            margin: '0 0 12px 0',
            fontWeight: '500'
          }}>
            Are you sure you want to delete <strong style={{ color: '#1f2937' }}>{user?.fullName || user?.username || 'this user'}</strong>?
          </p>

          <p style={{ 
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            This action cannot be undone.
          </p>
        </div>

        {/* Footer with Buttons */}
        <div style={{ 
          padding: '20px 30px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end',
          background: 'white'
        }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#e5e7eb',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#e5e7eb';
            }}
          >
            <i className="bx bx-x" style={{ fontSize: '18px' }}></i>
            Cancel
          </button>
          
          <button 
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#ef4444',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ef4444';
            }}
          >
            <i className="bx bx-trash" style={{ fontSize: '18px' }}></i>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;

