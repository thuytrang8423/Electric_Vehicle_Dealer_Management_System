import React, { useMemo, useState } from 'react';
import { installmentsAPI } from '../../utils/api/installmentsAPI';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { handleAPIError } from '../../utils/apiConfig';
import 'boxicons/css/boxicons.min.css';

const InstallmentManagement = ({ user }) => {
  const [previewForm, setPreviewForm] = useState({
    paymentId: '',
    totalAmount: '',
    months: 12,
    annualInterestRate: 0,
    firstDueDate: '',
  });
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateOrderId, setGenerateOrderId] = useState('');

  const [scheduleOrderId, setScheduleOrderId] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [payingScheduleId, setPayingScheduleId] = useState(null);

  const canManage = useMemo(() => {
    const role = (user?.role || '').toUpperCase();
    return role === 'DEALER_MANAGER' || role === 'ADMIN';
  }, [user]);

  const handleInputChange = (field, value) => {
    setPreviewForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const buildPayload = () => ({
    paymentId: previewForm.paymentId ? Number(previewForm.paymentId) : null,
    totalAmount: previewForm.totalAmount ? Number(previewForm.totalAmount) : 0,
    months: previewForm.months ? Number(previewForm.months) : 0,
    annualInterestRate: previewForm.annualInterestRate ? Number(previewForm.annualInterestRate) : 0,
    firstDueDate: previewForm.firstDueDate || null,
  });

  const handlePreview = async (event) => {
    event.preventDefault();
    if (!previewForm.totalAmount || !previewForm.months || !previewForm.firstDueDate) {
      showErrorToast('Please enter Total Amount, Months, and First Due Date.');
      return;
    }

    try {
      setPreviewLoading(true);
      const payload = buildPayload();
      const result = await installmentsAPI.preview(payload);
      setPreviewResult(result);
      showSuccessToast('Installment preview created successfully.');
    } catch (error) {
      console.error('Error previewing installment plan:', error);
      showErrorToast(handleAPIError(error));
      setPreviewResult(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generateOrderId) {
      showErrorToast('Please enter the Order ID that needs an installment plan.');
      return;
    }
    if (!previewForm.totalAmount || !previewForm.months || !previewForm.firstDueDate) {
      showErrorToast('Please complete the plan information before generating.');
      return;
    }

    try {
      setGenerateLoading(true);
      const payload = buildPayload();
      await installmentsAPI.generate(Number(generateOrderId), payload);
      showSuccessToast(`Installment schedule for Order #${generateOrderId} created successfully.`);
      if (scheduleOrderId === generateOrderId) {
        await handleFetchSchedule();
      }
    } catch (error) {
      console.error('Error generating installment plan:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleFetchSchedule = async (event) => {
    if (event) {
      event.preventDefault();
    }
    if (!scheduleOrderId) {
      showErrorToast('Please enter an Order ID to fetch the schedule.');
      return;
    }

    try {
      setScheduleLoading(true);
      const data = await installmentsAPI.getScheduleByOrder(Number(scheduleOrderId));
      setSchedule(Array.isArray(data) ? data : []);
      showSuccessToast(`Loaded installment schedule for Order #${scheduleOrderId}.`);
    } catch (error) {
      console.error('Error fetching installment schedule:', error);
      showErrorToast(handleAPIError(error));
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handlePaySchedule = async (item) => {
    if (!item?.id && !item?.scheduleId) {
      showErrorToast('Unable to detect installment information.');
      return;
    }

    const scheduleId = item.id || item.scheduleId;
    try {
      setPayingScheduleId(scheduleId);
      await installmentsAPI.paySchedule(scheduleId);
      showSuccessToast(`Installment #${item.installmentNumber} marked as PAID.`);
      await handleFetchSchedule();
    } catch (error) {
      console.error('Error paying installment schedule:', error);
      showErrorToast(handleAPIError(error));
    } finally {
      setPayingScheduleId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="main">
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <i className="bx bx-error" style={{ fontSize: '48px', color: 'var(--color-warning)' }}></i>
          <h3 style={{ marginTop: '16px' }}>You don’t have permission to access this feature.</h3>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Only Dealer Managers or Administrators can manage installment plans.
          </p>
        </div>
      </div>
    );
  }

  const previewSchedule = previewResult?.schedule || [];
  const hasPreviewSchedule = previewSchedule.length > 0;
  const hasSchedule = schedule.length > 0;

  return (
    <div className="main">
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>Installment Management</h2>

        <form onSubmit={handlePreview} style={sectionStyle}>
          <h3 style={sectionTitleStyle}>1. Preview Installment Plan</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Payment ID (optional)</label>
              <input
                type="number"
                value={previewForm.paymentId}
                onChange={(e) => handleInputChange('paymentId', e.target.value)}
                style={inputStyle}
                min="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Total amount *</label>
              <input
                type="number"
                min="0"
                required
                value={previewForm.totalAmount}
                onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Months *</label>
              <input
                type="number"
                min="1"
                required
                value={previewForm.months}
                onChange={(e) => handleInputChange('months', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Annual interest (%)</label>
              <input
                type="number"
                min="0"
                value={previewForm.annualInterestRate}
                onChange={(e) => handleInputChange('annualInterestRate', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>First due date *</label>
              <input
                type="date"
                required
                value={previewForm.firstDueDate}
                onChange={(e) => handleInputChange('firstDueDate', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={previewLoading}>
              {previewLoading ? (
                <>
                  <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                  Calculating...
                </>
              ) : (
                <>
                  <i className="bx bx-show" style={{ marginRight: '6px' }}></i>
                  Preview plan
                </>
              )}
            </button>
          </div>
        </form>

        {previewResult && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Preview result</h3>
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '16px' }}>
              <InfoCard label="Principal total" value={previewResult.totalAmount} prefix="$" />
              <InfoCard label="VAT" value={previewResult.vatAmount} prefix="$" />
              <InfoCard label="Interest" value={previewResult.interestAmount} prefix="$" />
              <InfoCard label="Total payable" value={previewResult.totalPayable} prefix="$" highlight />
              <InfoCard label="Months" value={previewResult.months} />
              <InfoCard label="Monthly payment" value={previewResult.monthlyPayment} prefix="$" />
            </div>

            {hasPreviewSchedule ? (
              <ScheduleTable
                data={previewSchedule}
                actionColumn={false}
                caption="Schedule details (preview)"
              />
            ) : (
              <div style={emptyStateStyle}>No installment schedule was generated for this preview.</div>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>2. Generate official installment schedule</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label style={labelStyle}>Order ID *</label>
            <input
              type="number"
              min="1"
              value={generateOrderId}
              onChange={(e) => setGenerateOrderId(e.target.value)}
              style={inputStyle}
              placeholder="Enter Order ID"
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleGenerate}
              disabled={generateLoading}
            >
              {generateLoading ? (
                <>
                  <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="bx bx-layer" style={{ marginRight: '6px' }}></i>
                  Generate schedule
                </>
              )}
            </button>
          </div>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '0' }}>
          Use the same information as the preview section above to create the official plan.
        </p>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <form onSubmit={handleFetchSchedule}>
          <h3 style={{ marginBottom: '16px' }}>3. Lookup schedule by Order ID</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', minWidth: '200px' }}>
              <label style={labelStyle}>Order ID *</label>
              <input
                type="number"
                min="1"
                value={scheduleOrderId}
                onChange={(e) => setScheduleOrderId(e.target.value)}
                style={inputStyle}
                placeholder="Enter Order ID"
              />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={scheduleLoading}>
                {scheduleLoading ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="bx bx-search" style={{ marginRight: '6px' }}></i>
                    View installment schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <div style={{ marginTop: '24px' }}>
          {scheduleLoading ? (
            <div style={emptyStateStyle}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '28px' }}></i>
              <div style={{ marginTop: '8px' }}>Loading installment schedule...</div>
            </div>
          ) : hasSchedule ? (
            <ScheduleTable
              data={schedule}
              caption={`Installment schedule for Order #${scheduleOrderId}`}
              actionColumn
              onPaySchedule={handlePaySchedule}
              payingScheduleId={payingScheduleId}
            />
          ) : (
            <div style={emptyStateStyle}>
              No installment data found. Enter an order ID and choose “View installment schedule” to load it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value, prefix = '', highlight = false }) => (
  <div
    style={{
      padding: '16px',
      borderRadius: 'var(--radius)',
      border: highlight ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
      background: 'var(--color-bg)',
    }}
  >
    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>{label}</div>
    <div style={{ fontSize: '18px', fontWeight: 700, color: highlight ? 'var(--color-success)' : 'var(--color-primary)' }}>
      {prefix}
      {typeof value === 'number' ? value.toLocaleString() : value || 'N/A'}
    </div>
  </div>
);

const ScheduleTable = ({ data, caption, actionColumn, onPaySchedule, payingScheduleId }) => (
  <div style={{ overflowX: 'auto' }}>
    {caption && <h4 style={{ marginBottom: '12px' }}>{caption}</h4>}
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
          <th style={tableHeaderStyle}>#</th>
          <th style={tableHeaderStyle}>Due date</th>
          <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Amount</th>
          <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Status</th>
          {actionColumn && <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => {
          const status = (item.status || '').toUpperCase();
          const scheduleId = item.id || item.scheduleId;
          return (
            <tr key={`${scheduleId}-${item.installmentNumber}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
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
                  {status || 'UNKNOWN'}
                </span>
              </td>
              {actionColumn && (
                <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                  {status === 'PAID' ? (
                    <span style={{ fontSize: '12px', color: 'var(--color-success)' }}>Paid</span>
                  ) : (
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '12px' }}
                      onClick={() => onPaySchedule(item)}
                      disabled={payingScheduleId === scheduleId}
                    >
                      {payingScheduleId === scheduleId ? (
                        <>
                          <i className="bx bx-loader-alt bx-spin"></i> Updating...
                        </>
                      ) : (
                        <>
                          <i className="bx bx-check"></i> Mark as paid
                        </>
                      )}
                    </button>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const sectionStyle = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  padding: '16px',
  background: 'var(--color-bg)',
  marginBottom: '24px',
};

const sectionTitleStyle = {
  marginBottom: '12px',
  fontSize: '16px',
  fontWeight: 700,
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '16px',
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

const emptyStateStyle = {
  textAlign: 'center',
  padding: '24px',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text-muted)',
};

export default InstallmentManagement;

