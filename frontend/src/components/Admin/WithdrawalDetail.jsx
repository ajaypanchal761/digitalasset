import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import StatusBadge from './common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ConfirmDialog from './common/ConfirmDialog';

const WithdrawalDetail = ({ withdrawal, onClose }) => {
  const { updateWithdrawalStatus } = useAdmin();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!withdrawal) return null;

  const handleApprove = () => {
    updateWithdrawalStatus(withdrawal.id, 'processing');
    // Simulate processing delay
    setTimeout(() => {
      updateWithdrawalStatus(withdrawal.id, 'completed');
      setShowApproveDialog(false);
      onClose();
    }, 1000);
  };

  const handleReject = () => {
    updateWithdrawalStatus(withdrawal.id, 'rejected', rejectionReason || 'Rejected by admin');
    setShowRejectDialog(false);
    setRejectionReason('');
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const canApprove = withdrawal.status === 'pending';
  const canReject = withdrawal.status === 'pending' || withdrawal.status === 'processing';

  return (
    <>
      <div className="withdrawal-detail__overlay" onClick={onClose}>
        <div className="withdrawal-detail__modal" onClick={(e) => e.stopPropagation()}>
          <header className="withdrawal-detail__header">
            <div>
              <h2 className="withdrawal-detail__title">Withdrawal Details</h2>
              <p className="withdrawal-detail__id">ID: {withdrawal.id}</p>
            </div>
            <button className="withdrawal-detail__close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </header>

          <div className="withdrawal-detail__body">
            {/* Status Section */}
            <section className="withdrawal-detail__section">
              <h3 className="withdrawal-detail__section-title">Status</h3>
              <div className="withdrawal-detail__status-container">
                <StatusBadge status={withdrawal.status} />
                {withdrawal.processedDate && (
                  <p className="withdrawal-detail__processed-date">
                    Processed on: {formatDate(withdrawal.processedDate)}
                  </p>
                )}
                {withdrawal.transactionId && (
                  <p className="withdrawal-detail__transaction-id">
                    Transaction ID: {withdrawal.transactionId}
                  </p>
                )}
              </div>
            </section>

            {/* Amount Section */}
            <section className="withdrawal-detail__section">
              <h3 className="withdrawal-detail__section-title">Amount</h3>
              <div className="withdrawal-detail__amount-display">
                <span className="withdrawal-detail__amount-value">
                  {formatCurrency(withdrawal.amount)}
                </span>
              </div>
            </section>

            {/* User Information */}
            <section className="withdrawal-detail__section">
              <h3 className="withdrawal-detail__section-title">User Information</h3>
              <div className="withdrawal-detail__info-grid">
                <div className="withdrawal-detail__info-item">
                  <label className="withdrawal-detail__info-label">Name</label>
                  <p className="withdrawal-detail__info-value">{withdrawal.userName}</p>
                </div>
                <div className="withdrawal-detail__info-item">
                  <label className="withdrawal-detail__info-label">Email</label>
                  <p className="withdrawal-detail__info-value">{withdrawal.userEmail}</p>
                </div>
                <div className="withdrawal-detail__info-item">
                  <label className="withdrawal-detail__info-label">User ID</label>
                  <p className="withdrawal-detail__info-value">{withdrawal.userId}</p>
                </div>
              </div>
            </section>

            {/* Bank Details */}
            <section className="withdrawal-detail__section">
              <h3 className="withdrawal-detail__section-title">Bank Details</h3>
              <div className="withdrawal-detail__info-grid">
                <div className="withdrawal-detail__info-item">
                  <label className="withdrawal-detail__info-label">Account Holder Name</label>
                  <p className="withdrawal-detail__info-value">
                    {withdrawal.bankDetails.accountHolderName}
                  </p>
                </div>
                <div className="withdrawal-detail__info-item">
                  <label className="withdrawal-detail__info-label">Account Number</label>
                  <p className="withdrawal-detail__info-value">
                    {withdrawal.bankDetails.accountNumber}
                  </p>
                </div>
                <div className="withdrawal-detail__info-item">
                  <label className="withdrawal-detail__info-label">IFSC Code</label>
                  <p className="withdrawal-detail__info-value">
                    {withdrawal.bankDetails.ifscCode}
                  </p>
                </div>
              </div>
            </section>

            {/* Request Details */}
            <section className="withdrawal-detail__section">
              <h3 className="withdrawal-detail__section-title">Request Details</h3>
              <div className="withdrawal-detail__info-grid">
                <div className="withdrawal-detail__info-item">
                  <label className="withdrawal-detail__info-label">Request Date</label>
                  <p className="withdrawal-detail__info-value">
                    {formatDate(withdrawal.requestDate)}
                  </p>
                </div>
                {withdrawal.processedDate && (
                  <div className="withdrawal-detail__info-item">
                    <label className="withdrawal-detail__info-label">Processed Date</label>
                    <p className="withdrawal-detail__info-value">
                      {formatDate(withdrawal.processedDate)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Rejection Reason */}
            {withdrawal.status === 'rejected' && withdrawal.rejectionReason && (
              <section className="withdrawal-detail__section">
                <h3 className="withdrawal-detail__section-title">Rejection Reason</h3>
                <div className="withdrawal-detail__rejection-reason">
                  <p>{withdrawal.rejectionReason}</p>
                </div>
              </section>
            )}

            {/* Actions */}
            {(canApprove || canReject) && (
              <section className="withdrawal-detail__section">
                <h3 className="withdrawal-detail__section-title">Actions</h3>
                <div className="withdrawal-detail__actions">
                  {canApprove && (
                    <button
                      className="withdrawal-detail__action-btn withdrawal-detail__action-btn--approve"
                      onClick={() => setShowApproveDialog(true)}
                    >
                      Approve Withdrawal
                    </button>
                  )}
                  {canReject && (
                    <button
                      className="withdrawal-detail__action-btn withdrawal-detail__action-btn--reject"
                      onClick={() => setShowRejectDialog(true)}
                    >
                      Reject Withdrawal
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleApprove}
        title="Approve Withdrawal"
        message={`Are you sure you want to approve this withdrawal of ${formatCurrency(withdrawal.amount)}? This action will process the payment to the user's bank account.`}
        confirmText="Approve"
        cancelText="Cancel"
      />

      {/* Reject Confirmation Dialog */}
      {showRejectDialog && (
        <div className="withdrawal-detail__reject-dialog-overlay" onClick={() => setShowRejectDialog(false)}>
          <div className="withdrawal-detail__reject-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="withdrawal-detail__reject-dialog-title">Reject Withdrawal</h3>
            <p className="withdrawal-detail__reject-dialog-message">
              Are you sure you want to reject this withdrawal? Please provide a reason.
            </p>
            <div className="withdrawal-detail__reject-reason-field">
              <label className="withdrawal-detail__reject-reason-label">
                Rejection Reason <span className="withdrawal-detail__required">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="withdrawal-detail__reject-reason-input"
                placeholder="Enter reason for rejection..."
                rows="4"
              />
            </div>
            <div className="withdrawal-detail__reject-dialog-actions">
              <button
                className="withdrawal-detail__reject-dialog-btn withdrawal-detail__reject-dialog-btn--cancel"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="withdrawal-detail__reject-dialog-btn withdrawal-detail__reject-dialog-btn--confirm"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WithdrawalDetail;

