import React from 'react';
import 'boxicons/css/boxicons.min.css';

const DeleteCustomerModal = ({ customer, onConfirm, onCancel }) => {
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
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white'
            }}>
              <i className="bx bx-trash"></i>
            </div>
          </div>

          {/* Message */}
          <h4 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Delete Customer
          </h4>
          
          <p style={{
            margin: '0 0 32px 0',
            fontSize: '16px',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            Are you sure you want to delete <strong style={{ color: '#374151' }}>{customer?.fullName}</strong>? 
            This action cannot be undone and will permanently remove all customer data.
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button 
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#9ca3af';
                e.target.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.background = 'white';
              }}
            >
              Cancel
            </button>
            
            <button 
              onClick={onConfirm}
              style={{
                padding: '12px 24px',
                border: '2px solid #ef4444',
                borderRadius: '8px',
                background: '#ef4444',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#dc2626';
                e.target.style.borderColor = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ef4444';
                e.target.style.borderColor = '#ef4444';
              }}
            >
              Delete Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCustomerModal;
