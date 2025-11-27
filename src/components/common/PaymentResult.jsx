import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentsAPI } from '../../utils/api/paymentsAPI';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        setLoading(true);

        // Get all parameters from URL
        const params = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        console.log('Payment result params:', params);

        // Backend redirects with: status=success/fail, transactionId, orderId, errorCode
        if (params.status) {
          const isSuccess = params.status === 'success';
          
          // Get error message for specific error codes
          let errorMessage = 'Payment failed';
          if (!isSuccess && params.errorCode) {
            const errorMessages = {
              '07': 'Transaction is suspected (fraud / abnormal activity)',
              '09': 'Card/Account has not registered for Internet Banking',
              '10': 'Incorrect verification information more than 3 times',
              '11': 'Payment window expired. Please try again.',
              '12': 'Card/Account is locked',
              '13': 'Incorrect OTP password',
              '24': 'Transaction cancelled',
              '51': 'Insufficient balance',
              '65': 'Exceeded daily transaction limit',
              '75': 'Issuing bank is under maintenance',
              '79': 'Too many incorrect payment passwords',
              'INVALID_SIGNATURE': 'Invalid signature - unsafe transaction',
              'PROCESSING_ERROR': 'Processing error - please contact support'
            };
            errorMessage = errorMessages[params.errorCode] || `Payment failed (Error code: ${params.errorCode})`;
          }
          
          setResult({
            success: isSuccess,
            message: isSuccess ? 'Payment successful!' : errorMessage,
            orderId: params.orderId,
            transactionId: params.transactionId,
            errorCode: params.errorCode,
            responseCode: params.errorCode
          });
          
          if (isSuccess) {
            showSuccessToast('Payment successful!');
            setTimeout(() => {
              if (params.orderId) {
                window.dispatchEvent(
                  new CustomEvent('openPaymentsTab', {
                    detail: { orderId: params.orderId, fromPaymentResult: true }
                  })
                );
              }
              navigate('/dashboard', {
                state: {
                  activeItem: 'payments',
                  fromPaymentResult: true,
                  orderId: params.orderId || null
                }
              });
            }, 1500);
          } else {
            showErrorToast(errorMessage);
          }
          
          setLoading(false);
          return;
        }

        // Fallback: No valid params
        setResult({
          success: false,
          message: 'Invalid payment information'
        });
        showErrorToast('Invalid payment information');
        
      } catch (error) {
        console.error('Error processing payment result:', error);
        setResult({
          success: false,
          message: 'An error occurred while processing the payment result'
        });
        showErrorToast('An error occurred while processing the payment result');
      } finally {
        setLoading(false);
      }
    };

    processPaymentResult();
  }, [searchParams]);

  const handleBackToPayments = () => {
    window.dispatchEvent(
      new CustomEvent('openPaymentsTab', { detail: { fromPaymentResult: true } })
    );
    navigate('/dashboard', { state: { activeItem: 'payments', fromPaymentResult: true } });
  };

  const handleBackToHome = () => {
    navigate('/dashboard', { state: { fromPaymentResult: true } });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg, #f5f5f5)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '48px', color: 'var(--color-primary, #6C63FF)' }}></i>
          <div style={{ marginTop: '16px', color: 'var(--color-text-muted, #666)' }}>Processing payment result...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg, #f5f5f5)',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--color-surface, #fff)',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        {result?.success ? (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '48px',
              color: 'white'
            }}>
              <i className="bx bx-check"></i>
            </div>
            <h2 style={{ 
              marginBottom: '16px', 
              color: 'var(--color-text, #333)',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Payment successful!
            </h2>
            <p style={{ 
              marginBottom: '24px', 
              color: 'var(--color-text-muted, #666)',
              fontSize: '16px'
            }}>
              {result.message}
            </p>
            
            {result.orderId && (
              <div style={{
                background: 'var(--color-bg, #f5f5f5)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '8px' }}>
                <strong>Order ID:</strong> #{result.orderId}
                </div>
                {(result.transactionNo || result.transactionId) && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Transaction ID:</strong> {result.transactionNo || result.transactionId}
                  </div>
                )}
                {result.amount && (
                  <div>
                    <strong>Amount:</strong> ${Number(result.amount).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleBackToPayments}
                style={{
                  padding: '12px 24px',
                  background: 'var(--color-primary, #6C63FF)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <i className="bx bx-credit-card" style={{ marginRight: '8px' }}></i>
                View payment details
              </button>
              <button
                onClick={handleBackToHome}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: 'var(--color-text, #333)',
                  border: '1px solid var(--color-border, #ddd)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg, #f5f5f5)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Back to Dashboard
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '48px',
              color: 'white'
            }}>
              <i className="bx bx-x"></i>
            </div>
            <h2 style={{ 
              marginBottom: '16px', 
              color: 'var(--color-text, #333)',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Payment failed
            </h2>
            <p style={{ 
              marginBottom: '24px', 
              color: 'var(--color-text-muted, #666)',
              fontSize: '16px'
            }}>
              {result?.message || 'The transaction was not successful. Please try again.'}
            </p>

            {result?.responseCode && (
              <div style={{
                background: 'var(--color-bg, #f5f5f5)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                fontSize: '14px',
                color: 'var(--color-text-muted, #666)'
              }}>
                <strong>Error code:</strong> {result.responseCode}
                {result.responseCode === '07' && ' - Transaction is suspected (fraud / abnormal activity)'}
                {result.responseCode === '09' && ' - Card/Account has not registered for Internet Banking'}
                {result.responseCode === '10' && ' - Incorrect verification information more than 3 times'}
                {result.responseCode === '11' && ' - Payment window expired. Please try again.'}
                {result.responseCode === '12' && ' - Card/Account is locked'}
                {result.responseCode === '51' && ' - Insufficient balance'}
                {result.responseCode === '65' && ' - Exceeded daily transaction limit'}
                {result.responseCode === '75' && ' - Issuing bank is under maintenance'}
                {result.responseCode === '79' && ' - Too many incorrect payment passwords'}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleBackToPayments}
                style={{
                  padding: '12px 24px',
                  background: 'var(--color-primary, #6C63FF)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <i className="bx bx-refresh" style={{ marginRight: '8px' }}></i>
                Try payment again
              </button>
              <button
                onClick={handleBackToHome}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: 'var(--color-text, #333)',
                  border: '1px solid var(--color-border, #ddd)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg, #f5f5f5)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;


