import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext.jsx';
import { adminAPI } from '../../../services/api.js';
import Select from '../../../components/common/Select';
import './AdminTransferRequests.css';

const AdminTransferRequests = () => {
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
      showToast(error.message || 'Failed to load transfer requests', 'error');
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

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this transfer request?')) {
      return;
    }

    try {
      setProcessing(requestId);
      const response = await adminAPI.approveTransferRequest(requestId, adminNotes);
      if (response.success) {
        showToast('Transfer request approved successfully', 'success');
        setShowDetail(false);
        setSelectedRequest(null);
        setAdminNotes('');
        fetchTransferRequests();
      } else {
        showToast(response.message || 'Failed to approve request', 'error');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      showToast(error.message || 'Failed to approve request', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this transfer request?')) {
      return;
    }

    try {
      setProcessing(requestId);
      const response = await adminAPI.rejectTransferRequest(requestId, adminNotes);
      if (response.success) {
        showToast('Transfer request rejected successfully', 'success');
        setShowDetail(false);
        setSelectedRequest(null);
        setAdminNotes('');
        fetchTransferRequests();
      } else {
        showToast(response.message || 'Failed to reject request', 'error');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast(error.message || 'Failed to reject request', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'admin-transfer-requests__badge--pending', text: 'Pending' },
      accepted: { class: 'admin-transfer-requests__badge--accepted', text: 'Accepted' },
      rejected: { class: 'admin-transfer-requests__badge--rejected', text: 'Rejected' },
      admin_pending: { class: 'admin-transfer-requests__badge--admin-pending', text: 'Admin Review' },
      admin_approved: { class: 'admin-transfer-requests__badge--approved', text: 'Approved' },
      admin_rejected: { class: 'admin-transfer-requests__badge--rejected', text: 'Rejected' },
      completed: { class: 'admin-transfer-requests__badge--completed', text: 'Completed' },
      cancelled: { class: 'admin-transfer-requests__badge--cancelled', text: 'Cancelled' },
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`admin-transfer-requests__badge ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="admin-transfer-requests">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading transfer requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-transfer-requests">
      <div className="admin-transfer-requests__header">
        <h1 className="admin-transfer-requests__title">Transfer Requests</h1>
        <div className="admin-transfer-requests__filters">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-transfer-requests__filter-select"
            options={[
              { value: 'all', label: 'All Requests' },
              { value: 'admin_pending', label: 'Pending Review' },
              { value: 'admin_approved', label: 'Approved' },
              { value: 'admin_rejected', label: 'Rejected' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending Buyer Response' },
              { value: 'accepted', label: 'Accepted by Buyer' },
            ]}
          />
        </div>
      </div>

      <div className="admin-transfer-requests__table-container">
        <table className="admin-transfer-requests__table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Buyer</th>
              <th>Property</th>
              <th>Sale Price</th>
              <th>Status</th>
              <th>Request Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transferRequests.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No transfer requests found
                </td>
              </tr>
            ) : (
              transferRequests.map((request) => (
                <tr key={request._id || request.id}>
                  <td>
                    <div className="admin-transfer-requests__user-info">
                      <div className="admin-transfer-requests__user-avatar">
                        {request.sellerId?.avatarUrl ? (
                          <img src={request.sellerId.avatarUrl} alt={request.sellerId.name} />
                        ) : (
                          <div className="admin-transfer-requests__user-avatar-placeholder">
                            {request.sellerId?.name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="admin-transfer-requests__user-name">{request.sellerId?.name || 'N/A'}</div>
                        <div className="admin-transfer-requests__user-email">{request.sellerId?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-transfer-requests__user-info">
                      <div className="admin-transfer-requests__user-avatar">
                        {request.buyerId?.avatarUrl ? (
                          <img src={request.buyerId.avatarUrl} alt={request.buyerId.name} />
                        ) : (
                          <div className="admin-transfer-requests__user-avatar-placeholder">
                            {request.buyerId?.name?.charAt(0).toUpperCase() || 'B'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="admin-transfer-requests__user-name">{request.buyerId?.name || 'N/A'}</div>
                        <div className="admin-transfer-requests__user-email">{request.buyerId?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{request.propertyId?.title || 'Shaan Estate'}</td>
                  <td className="admin-transfer-requests__price">{formatCurrency(request.salePrice)}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>
                    <div className="admin-transfer-requests__actions">
                      <button
                        className="admin-transfer-requests__btn admin-transfer-requests__btn--view"
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
                            className="admin-transfer-requests__btn admin-transfer-requests__btn--approve"
                            onClick={() => handleApprove(request._id || request.id)}
                            disabled={processing === (request._id || request.id)}
                          >
                            {processing === (request._id || request.id) ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            className="admin-transfer-requests__btn admin-transfer-requests__btn--reject"
                            onClick={() => handleReject(request._id || request.id)}
                            disabled={processing === (request._id || request.id)}
                          >
                            {processing === (request._id || request.id) ? 'Processing...' : 'Reject'}
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
        <div className="admin-transfer-requests__modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="admin-transfer-requests__modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-transfer-requests__modal-header">
              <h2>Transfer Request Details</h2>
              <button
                className="admin-transfer-requests__modal-close"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedRequest(null);
                  setAdminNotes('');
                }}
              >
                ×
              </button>
            </div>
            <div className="admin-transfer-requests__modal-content">
              <div className="admin-transfer-requests__detail-section">
                <h3>Seller Information</h3>
                <p><strong>Name:</strong> {selectedRequest.sellerId?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedRequest.sellerId?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedRequest.sellerId?.phone || 'N/A'}</p>
              </div>
              <div className="admin-transfer-requests__detail-section">
                <h3>Buyer Information</h3>
                <p><strong>Name:</strong> {selectedRequest.buyerId?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedRequest.buyerId?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedRequest.buyerId?.phone || 'N/A'}</p>
              </div>
              <div className="admin-transfer-requests__detail-section">
                <h3>Property Details</h3>
                <p><strong>Property:</strong> {selectedRequest.propertyId?.title || 'N/A'}</p>
                <p><strong>Investment Amount:</strong> {formatCurrency(selectedRequest.holdingId?.amountInvested || 0)}</p>
                <p><strong>Sale Price:</strong> {formatCurrency(selectedRequest.salePrice)}</p>
              </div>
              <div className="admin-transfer-requests__detail-section">
                <h3>Request Information</h3>
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
                <div className="admin-transfer-requests__detail-section">
                  <h3>Admin Notes (Optional)</h3>
                  <textarea
                    className="admin-transfer-requests__notes-input"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this decision..."
                    rows={4}
                  />
                </div>
              )}
            </div>
            {selectedRequest.status === 'admin_pending' && (
              <div className="admin-transfer-requests__modal-actions">
                <button
                  className="admin-transfer-requests__modal-btn admin-transfer-requests__modal-btn--approve"
                  onClick={() => handleApprove(selectedRequest._id || selectedRequest.id)}
                  disabled={processing === (selectedRequest._id || selectedRequest.id)}
                >
                  {processing === (selectedRequest._id || selectedRequest.id) ? 'Processing...' : 'Approve'}
                </button>
                <button
                  className="admin-transfer-requests__modal-btn admin-transfer-requests__modal-btn--reject"
                  onClick={() => handleReject(selectedRequest._id || selectedRequest.id)}
                  disabled={processing === (selectedRequest._id || selectedRequest.id)}
                >
                  {processing === (selectedRequest._id || selectedRequest.id) ? 'Processing...' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransferRequests;

