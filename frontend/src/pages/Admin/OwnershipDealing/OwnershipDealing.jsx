import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext.jsx';
import { adminAPI } from '../../../services/api.js';
import './OwnershipDealing.css';

const OwnershipDealing = () => {
  const { showToast } = useToast();
  const [transferRequests, setTransferRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('admin_pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchTransferRequests();
  }, [statusFilter]);

  const fetchTransferRequests = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await adminAPI.getTransferRequests(params);
      if (response.success) {
        setTransferRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching transfer requests:', error);
      showToast(error.message || 'Failed to load ownership dealings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getKYCStatusBadge = (status) => {
    const badges = {
      approved: { class: 'ownership-dealing__kyc-badge--approved', text: 'KYC Approved', icon: '✓' },
      pending: { class: 'ownership-dealing__kyc-badge--pending', text: 'KYC Pending', icon: '⏳' },
      rejected: { class: 'ownership-dealing__kyc-badge--rejected', text: 'KYC Rejected', icon: '✗' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`ownership-dealing__kyc-badge ${badge.class}`}>
        <span className="ownership-dealing__kyc-icon">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  const handleAgree = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this ownership transfer?')) {
      return;
    }

    try {
      setProcessing(requestId);
      const response = await adminAPI.approveTransferRequest(requestId, adminNotes);
      if (response.success) {
        showToast('Ownership transfer approved successfully', 'success');
        setShowDetail(false);
        setSelectedRequest(null);
        setAdminNotes('');
        fetchTransferRequests();
      } else {
        showToast(response.message || 'Failed to approve transfer', 'error');
      }
    } catch (error) {
      console.error('Error approving transfer:', error);
      showToast(error.message || 'Failed to approve transfer', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleDisagree = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this ownership transfer?')) {
      return;
    }

    try {
      setProcessing(requestId);
      const response = await adminAPI.rejectTransferRequest(requestId, adminNotes);
      if (response.success) {
        showToast('Ownership transfer rejected successfully', 'success');
        setShowDetail(false);
        setSelectedRequest(null);
        setAdminNotes('');
        fetchTransferRequests();
      } else {
        showToast(response.message || 'Failed to reject transfer', 'error');
      }
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      showToast(error.message || 'Failed to reject transfer', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'ownership-dealing__status-badge--pending', text: 'Pending' },
      accepted: { class: 'ownership-dealing__status-badge--accepted', text: 'Accepted' },
      rejected: { class: 'ownership-dealing__status-badge--rejected', text: 'Rejected' },
      admin_pending: { class: 'ownership-dealing__status-badge--admin-pending', text: 'Admin Review' },
      admin_approved: { class: 'ownership-dealing__status-badge--approved', text: 'Approved' },
      admin_rejected: { class: 'ownership-dealing__status-badge--rejected', text: 'Rejected' },
      completed: { class: 'ownership-dealing__status-badge--completed', text: 'Completed' },
      cancelled: { class: 'ownership-dealing__status-badge--cancelled', text: 'Cancelled' },
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`ownership-dealing__status-badge ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="ownership-dealing">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading ownership dealings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ownership-dealing">
      <div className="ownership-dealing__header">
        <h1 className="ownership-dealing__title">Ownership Dealing</h1>
        <div className="ownership-dealing__filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ownership-dealing__filter-select"
          >
            <option value="all">All Dealings</option>
            <option value="admin_pending">Pending Review</option>
            <option value="admin_approved">Approved</option>
            <option value="admin_rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending Buyer Response</option>
            <option value="accepted">Accepted by Buyer</option>
          </select>
        </div>
      </div>

      <div className="ownership-dealing__table-container">
        <table className="ownership-dealing__table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Seller KYC</th>
              <th>Buyer</th>
              <th>Buyer KYC</th>
              <th>Property</th>
              <th>Price</th>
              <th>Status</th>
              <th>Request Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transferRequests.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                  No ownership dealings found
                </td>
              </tr>
            ) : (
              transferRequests.map((request) => (
                <tr key={request._id || request.id}>
                  <td>
                    <div className="ownership-dealing__user-info">
                      <div className="ownership-dealing__user-avatar">
                        {request.sellerId?.avatarUrl ? (
                          <img src={request.sellerId.avatarUrl} alt={request.sellerId.name} />
                        ) : (
                          <div className="ownership-dealing__user-avatar-placeholder">
                            {request.sellerId?.name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="ownership-dealing__user-name">{request.sellerId?.name || 'N/A'}</div>
                        <div className="ownership-dealing__user-email">{request.sellerId?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {getKYCStatusBadge(request.sellerId?.kycStatus || 'pending')}
                  </td>
                  <td>
                    <div className="ownership-dealing__user-info">
                      <div className="ownership-dealing__user-avatar">
                        {request.buyerId?.avatarUrl ? (
                          <img src={request.buyerId.avatarUrl} alt={request.buyerId.name} />
                        ) : (
                          <div className="ownership-dealing__user-avatar-placeholder">
                            {request.buyerId?.name?.charAt(0).toUpperCase() || 'B'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="ownership-dealing__user-name">{request.buyerId?.name || 'N/A'}</div>
                        <div className="ownership-dealing__user-email">{request.buyerId?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {getKYCStatusBadge(request.buyerId?.kycStatus || 'pending')}
                  </td>
                  <td>{request.propertyId?.title || 'N/A'}</td>
                  <td className="ownership-dealing__price">{formatCurrency(request.salePrice)}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>
                    <div className="ownership-dealing__actions">
                      <button
                        className="ownership-dealing__btn ownership-dealing__btn--view"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetail(true);
                        }}
                      >
                        View
                      </button>
                      {request.status === 'admin_pending' && (
                        <>
                          <button
                            className="ownership-dealing__btn ownership-dealing__btn--agree"
                            onClick={() => handleAgree(request._id || request.id)}
                            disabled={processing === (request._id || request.id)}
                          >
                            {processing === (request._id || request.id) ? 'Processing...' : 'Agree'}
                          </button>
                          <button
                            className="ownership-dealing__btn ownership-dealing__btn--disagree"
                            onClick={() => handleDisagree(request._id || request.id)}
                            disabled={processing === (request._id || request.id)}
                          >
                            {processing === (request._id || request.id) ? 'Processing...' : 'Disagree'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedRequest && (
        <div className="ownership-dealing__modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="ownership-dealing__modal" onClick={(e) => e.stopPropagation()}>
            <div className="ownership-dealing__modal-header">
              <h2>Ownership Transfer Details</h2>
              <button
                className="ownership-dealing__modal-close"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedRequest(null);
                  setAdminNotes('');
                }}
              >
                ×
              </button>
            </div>
            <div className="ownership-dealing__modal-content">
              <div className="ownership-dealing__detail-section">
                <h3>Seller Information</h3>
                <p><strong>Name:</strong> {selectedRequest.sellerId?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedRequest.sellerId?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedRequest.sellerId?.phone || 'N/A'}</p>
                <p><strong>KYC Status:</strong> {getKYCStatusBadge(selectedRequest.sellerId?.kycStatus || 'pending')}</p>
              </div>
              <div className="ownership-dealing__detail-section">
                <h3>Buyer Information</h3>
                <p><strong>Name:</strong> {selectedRequest.buyerId?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedRequest.buyerId?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedRequest.buyerId?.phone || 'N/A'}</p>
                <p><strong>KYC Status:</strong> {getKYCStatusBadge(selectedRequest.buyerId?.kycStatus || 'pending')}</p>
              </div>
              <div className="ownership-dealing__detail-section">
                <h3>Property Details</h3>
                <p><strong>Property:</strong> {selectedRequest.propertyId?.title || 'N/A'}</p>
                <p><strong>Investment Amount:</strong> {formatCurrency(selectedRequest.holdingId?.amountInvested || 0)}</p>
                <p><strong>Sale Price:</strong> {formatCurrency(selectedRequest.salePrice)}</p>
              </div>
              <div className="ownership-dealing__detail-section">
                <h3>Transfer Information</h3>
                <p><strong>Status:</strong> {getStatusBadge(selectedRequest.status)}</p>
                <p><strong>Request Date:</strong> {formatDate(selectedRequest.createdAt)}</p>
                {selectedRequest.buyerResponseDate && (
                  <p><strong>Buyer Response Date:</strong> {formatDate(selectedRequest.buyerResponseDate)}</p>
                )}
                {selectedRequest.adminResponseDate && (
                  <p><strong>Admin Response Date:</strong> {formatDate(selectedRequest.adminResponseDate)}</p>
                )}
                {selectedRequest.adminNotes && (
                  <p><strong>Admin Notes:</strong> {selectedRequest.adminNotes}</p>
                )}
              </div>
              {selectedRequest.status === 'admin_pending' && (
                <div className="ownership-dealing__detail-section">
                  <h3>Admin Notes (Optional)</h3>
                  <textarea
                    className="ownership-dealing__notes-input"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this decision..."
                    rows={4}
                  />
                </div>
              )}
            </div>
            {selectedRequest.status === 'admin_pending' && (
              <div className="ownership-dealing__modal-actions">
                <button
                  className="ownership-dealing__modal-btn ownership-dealing__modal-btn--agree"
                  onClick={() => handleAgree(selectedRequest._id || selectedRequest.id)}
                  disabled={processing === (selectedRequest._id || selectedRequest.id)}
                >
                  {processing === (selectedRequest._id || selectedRequest.id) ? 'Processing...' : 'Agree'}
                </button>
                <button
                  className="ownership-dealing__modal-btn ownership-dealing__modal-btn--disagree"
                  onClick={() => handleDisagree(selectedRequest._id || selectedRequest.id)}
                  disabled={processing === (selectedRequest._id || selectedRequest.id)}
                >
                  {processing === (selectedRequest._id || selectedRequest.id) ? 'Processing...' : 'Disagree'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnershipDealing;


