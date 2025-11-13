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
          let errorMessage = 'Thanh toán thất bại';
          if (!isSuccess && params.errorCode) {
            const errorMessages = {
              '07': 'Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
              '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
              '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
              '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch',
              '12': 'Thẻ/Tài khoản bị khóa',
              '13': 'Bạn nhập sai mật khẩu xác thực giao dịch (OTP)',
              '24': 'Giao dịch bị hủy',
              '51': 'Tài khoản không đủ số dư để thực hiện giao dịch',
              '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
              '75': 'Ngân hàng thanh toán đang bảo trì',
              '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
              'INVALID_SIGNATURE': 'Chữ ký không hợp lệ - giao dịch không an toàn',
              'PROCESSING_ERROR': 'Lỗi xử lý giao dịch - vui lòng liên hệ hỗ trợ'
            };
            errorMessage = errorMessages[params.errorCode] || `Thanh toán thất bại (Mã lỗi: ${params.errorCode})`;
          }
          
          setResult({
            success: isSuccess,
            message: isSuccess ? 'Thanh toán thành công!' : errorMessage,
            orderId: params.orderId,
            transactionId: params.transactionId,
            errorCode: params.errorCode,
            responseCode: params.errorCode
          });
          
          if (isSuccess) {
            showSuccessToast('Thanh toán thành công!');
          } else {
            showErrorToast(errorMessage);
          }
          
          setLoading(false);
          return;
        }

        // Fallback: No valid params
        setResult({
          success: false,
          message: 'Thông tin thanh toán không hợp lệ'
        });
        showErrorToast('Thông tin thanh toán không hợp lệ');
        
      } catch (error) {
        console.error('Error processing payment result:', error);
        setResult({
          success: false,
          message: 'Có lỗi xảy ra khi xử lý kết quả thanh toán'
        });
        showErrorToast('Có lỗi xảy ra khi xử lý kết quả thanh toán');
      } finally {
        setLoading(false);
      }
    };

    processPaymentResult();
  }, [searchParams]);

  const handleBackToPayments = () => {
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
          <div style={{ marginTop: '16px', color: 'var(--color-text-muted, #666)' }}>Đang xử lý kết quả thanh toán...</div>
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
              Thanh toán thành công!
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
                  <strong>Mã đơn hàng:</strong> #{result.orderId}
                </div>
                {(result.transactionNo || result.transactionId) && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Mã giao dịch:</strong> {result.transactionNo || result.transactionId}
                  </div>
                )}
                {result.amount && (
                  <div>
                    <strong>Số tiền:</strong> ${Number(result.amount).toLocaleString()}
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
                Xem lịch sử thanh toán
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
                Về trang chủ
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
              Thanh toán thất bại
            </h2>
            <p style={{ 
              marginBottom: '24px', 
              color: 'var(--color-text-muted, #666)',
              fontSize: '16px'
            }}>
              {result?.message || 'Giao dịch không thành công. Vui lòng thử lại.'}
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
                <strong>Mã lỗi:</strong> {result.responseCode}
                {result.responseCode === '07' && ' - Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)'}
                {result.responseCode === '09' && ' - Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking'}
                {result.responseCode === '10' && ' - Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần'}
                {result.responseCode === '11' && ' - Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch'}
                {result.responseCode === '12' && ' - Thẻ/Tài khoản bị khóa'}
                {result.responseCode === '51' && ' - Tài khoản không đủ số dư để thực hiện giao dịch'}
                {result.responseCode === '65' && ' - Tài khoản đã vượt quá hạn mức giao dịch trong ngày'}
                {result.responseCode === '75' && ' - Ngân hàng thanh toán đang bảo trì'}
                {result.responseCode === '79' && ' - Nhập sai mật khẩu thanh toán quá số lần quy định'}
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
                Thử lại thanh toán
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
                Về trang chủ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;


