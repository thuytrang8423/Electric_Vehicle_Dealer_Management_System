import React, { useMemo, useState } from 'react';
import { installmentsAPI, paymentsAPI } from '../../utils/api';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const InstallmentManagement = ({ user }) => {
  const [searchOrderId, setSearchOrderId] = useState('');
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [installments, setInstallments] = useState([]);
  const [planForm, setPlanForm] = useState({
    totalAmount: '',
    months: 12,
    annualInterestRate: 0,
    firstDueDate: '',
  });
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [payingInstallmentId, setPayingInstallmentId] = useState(null);

  const handleFetchPayments = async () => {
    if (!searchOrderId) {
      showErrorToast('Please enter an Order ID');
      return;
    }

    try {
      setLoadingPayments(true);
      let paymentList = [];
      try {
        const workflowPayments = await paymentsAPI.getDealerWorkflowPayments(searchOrderId);
        if (Array.isArray(workflowPayments)) {
          paymentList = workflowPayments;
        } else if (Array.isArray(workflowPayments?.payments)) {
          paymentList = workflowPayments.payments;
        }
      } catch {
        const fallback = await paymentsAPI.getByOrder(searchOrderId);
        paymentList = Array.isArray(fallback) ? fallback : [];
      }

      setPayments(
        paymentList.map((payment) => ({
          ...payment,
          paymentId: payment.paymentId || payment.id,
        }))
      );
      setSelectedPayment(null);
      setInstallments([]);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showErrorToast(handleAPIError(error));
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleSelectPayment = async (payment) => {
    if (!payment?.paymentId) {
      showErrorToast('Payment information is missing');
      return;
    }

    setSelectedPayment(payment);
    setPlanForm((prev) => ({
      ...prev,
      totalAmount: payment.amount || payment.totalAmount || 0,
      firstDueDate: '',
    }));

    try {
      setLoadingInstallments(true);
      const schedules = await installmentsAPI.getByPayment(payment.paymentId);
      setInstallments(Array.isArray(schedules) ? schedules : []);
    } catch (error) {
      console.error('Error loading installments:', error);
      showErrorToast(handleAPIError(error));
      setInstallments([]);
    } finally {
      setLoadingInstallments(false);
    }
  };

  const handleCreatePlan = async (event) => {
    event.preventDefault();
    if (!selectedPayment?.paymentId) {
      showErrorToast('Select a payment before creating installment plan');
      return;
    }
    if (!planForm.totalAmount || !planForm.months || !planForm.firstDueDate) {
      showErrorToast('Please fill out total amount, months, and first due date');
      return;
    }

    const payload = {
      paymentId: Number(selectedPayment.paymentId),
      totalAmount: Number(planForm.totalAmount),
      months: Number(planForm.months),
      annualInterestRate: Number(planForm.annualInterestRate) || 0,
      firstDueDate: planForm.firstDueDate,
    };

    try {
      setCreatingPlan(true);
      await installmentsAPI.createPlan(payload);
      showSuccessToast('Installment plan created successfully');
      handleSelectPayment(selectedPayment);
    } catch (error) {
      console.error('Error creating installment plan:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setCreatingPlan(false);
    }
  };

  const handlePayInstallment = async (installment) => {
    if (!installment?.transactionId) {
      showErrorToast('Installment information missing');
      return;
    }

    try {
      setPayingInstallmentId(installment.transactionId);
      await installmentsAPI.payInstallment(installment.transactionId);
      showSuccessToast(`Installment #${installment.installmentNumber} marked as paid`);
      handleSelectPayment(selectedPayment);
    } catch (error) {
      console.error('Error paying installment:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setPayingInstallmentId(null);
    }
  };

  const hasInstallments = useMemo(() => installments.length > 0, [installments]);

  return (
    <div className="main">
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>Installment Management</h2>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
            <i
              className="bx bx-search"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            ></i>
            <input
              type="text"
              placeholder="Enter Order ID to find payments..."
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFetchPayments();
                }
              }}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '14px',
              }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleFetchPayments}>
            {loadingPayments ? (
              <>
                <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                Loading...
              </>
            ) : (
              <>
                <i className="bx bx-search" style={{ marginRight: '6px' }}></i>
                Find Payments
              </>
            )}
          </button>
        </div>

        {/* Payments List */}
        <div>
          <h3 style={{ marginBottom: '12px' }}>Payments</h3>
          {loadingPayments ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px',
                color: 'var(--color-text-muted)',
              }}
            >
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '36px' }}></i>
              <div style={{ marginTop: '12px' }}>Loading payments...</div>
            </div>
          ) : payments.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: 'var(--color-text-muted)',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius)',
              }}
            >
              No payments found. Search by Order ID to see available payments.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {payments.map((payment) => {
                const paymentId = payment.paymentId || payment.id;
                const isSelected = selectedPayment?.paymentId === paymentId;
                const status = (payment.status || payment.paymentStatus || 'UNKNOWN').toUpperCase();
                return (
                  <div
                    key={paymentId}
                    style={{
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius)',
                      padding: '16px',
                      background: isSelected ? 'rgba(108, 99, 255, 0.08)' : 'var(--color-bg)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSelectPayment(payment)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Payment ID</div>
                        <strong>{paymentId}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Amount</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                          ${Number(payment.amount || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Status</div>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: 'var(--radius)',
                            background: 'var(--color-bg)',
                            color:
                              status === 'COMPLETED'
                                ? 'var(--color-success)'
                                : status === 'PENDING'
                                ? 'var(--color-warning)'
                                : 'var(--color-text-muted)',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Plan Creation & Installments */}
      {selectedPayment && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3>
              Installments for Payment #{selectedPayment.paymentId || selectedPayment.id}
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Amount: ${Number(selectedPayment.amount || 0).toLocaleString()} | Status:{' '}
              {(selectedPayment.status || selectedPayment.paymentStatus || 'UNKNOWN').toUpperCase()}
            </div>
          </div>

          <form onSubmit={handleCreatePlan} style={{ marginBottom: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '16px', background: 'var(--color-bg)' }}>
            <h4 style={{ marginBottom: '12px' }}>Create Installment Plan</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Total Amount *</label>
                <input
                  type="number"
                  value={planForm.totalAmount}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, totalAmount: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Months *</label>
                <input
                  type="number"
                  min="1"
                  value={planForm.months}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, months: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Annual Interest Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  value={planForm.annualInterestRate}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, annualInterestRate: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>First Due Date *</label>
                <input
                  type="date"
                  value={planForm.firstDueDate}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, firstDueDate: e.target.value }))
                  }
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creatingPlan}
              >
                {creatingPlan ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bx bx-layer" style={{ marginRight: '6px' }}></i>
                    Create Plan
                  </>
                )}
              </button>
            </div>
          </form>

          <h4 style={{ marginBottom: '12px' }}>Installment Schedule</h4>
          {loadingInstallments ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '28px' }}></i>
            </div>
          ) : hasInstallments ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={tableHeaderStyle}>#</th>
                    <th style={tableHeaderStyle}>Due Date</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Amount</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Status</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((item) => {
                    const status = (item.status || '').toUpperCase();
                    return (
                      <tr key={item.transactionId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={tableCellStyle}>{item.installmentNumber}</td>
                        <td style={tableCellStyle}>
                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                          ${Number(item.amount || 0).toLocaleString()}
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: 'var(--radius)',
                              background: 'var(--color-bg)',
                              color:
                                status === 'PAID'
                                  ? 'var(--color-success)'
                                  : status === 'PENDING'
                                  ? 'var(--color-warning)'
                                  : 'var(--color-text-muted)',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            {status}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                          {status !== 'PAID' && (
                            <button
                              className="btn btn-outline"
                              style={{ fontSize: '12px' }}
                              onClick={() => handlePayInstallment(item)}
                              disabled={payingInstallmentId === item.transactionId}
                            >
                              {payingInstallmentId === item.transactionId ? (
                                <>
                                  <i className="bx bx-loader-alt bx-spin"></i> Paying...
                                </>
                              ) : (
                                <>
                                  <i className="bx bx-check"></i> Mark Paid
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
              No installment schedule found for this payment.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontSize: '14px',
};

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
};

const tableCellStyle = {
  padding: '12px',
  fontSize: '14px',
  color: 'var(--color-text)',
};

export default InstallmentManagement;

