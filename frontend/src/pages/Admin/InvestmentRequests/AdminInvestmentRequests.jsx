import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import StatusBadge from '../../../components/Admin/common/StatusBadge';
import ConfirmDialog from '../../../components/Admin/common/ConfirmDialog';
import './AdminInvestmentRequests.css';

const AdminInvestmentRequests = () => {
  const { showToast } = useToast();
  const [investmentRequests, setInvestmentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState(null);

  useEffect(() => {
    fetchInvestmentRequests();
  }, []);

  const fetchInvestmentRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getInvestmentRequests();
      if (response.success) {
        setInvestmentRequests(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch investment requests');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch investment requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = investmentRequests.filter(request => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (request.userId?.name?.toLowerCase() || '').includes(searchLower) ||
      (request.userId?.email?.toLowerCase() || '').includes(searchLower) ||
      (request.propertyId?.title?.toLowerCase() || '').includes(searchLower) ||
      (request._id?.toLowerCase() || '').includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = investmentRequests.filter(r => r.status === 'pending').length;
  const approvedCount = investmentRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = investmentRequests.filter(r => r.status === 'rejected').length;
  const totalPendingAmount = investmentRequests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (r.amountInvested || 0), 0);

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
    setShowDetail(true);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setConfirmAction({ type: 'approve', request });
    setShowConfirmDialog(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setConfirmAction({ type: 'reject', request });
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !selectedRequest) return;

    try {
      if (confirmAction.type === 'approve') {
        const response = await adminAPI.approveInvestmentRequest(
          selectedRequest._id,
          adminNotes || undefined
        );
        if (response.success) {
          showToast('Investment request approved successfully', 'success');
          fetchInvestmentRequests();
        } else {
          showToast(response.message || 'Failed to approve investment request', 'error');
        }
      } else if (confirmAction.type === 'reject') {
        if (!adminNotes.trim()) {
          showToast('Please provide a rejection reason', 'error');
          return;
        }
        const response = await adminAPI.rejectInvestmentRequest(
          selectedRequest._id,
          adminNotes
        );
        if (response.success) {
          showToast('Investment request rejected', 'success');
          fetchInvestmentRequests();
        } else {
          showToast(response.message || 'Failed to reject investment request', 'error');
        }
      }
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setSelectedRequest(null);
      setAdminNotes('');
      setShowDetail(false);
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="admin-investment-requests">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading investment requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-investment-requests">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>Error: {error}</p>
          <button onClick={fetchInvestmentRequests} className="admin-investment-requests__retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-investment-requests">
      {/* Page Header */}
      <div className="admin-investment-requests__header">
        <div>
          <h1 className="admin-investment-requests__title">Investment Request Management</h1>
          <p className="admin-investment-requests__subtitle">
            Review and verify investment requests from users
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-investment-requests__stats">
        <div className="admin-investment-requests__stat">
          <span className="admin-investment-requests__stat-label">Total Requests</span>
          <span className="admin-investment-requests__stat-value">{investmentRequests.length}</span>
        </div>
        <div className="admin-investment-requests__stat admin-investment-requests__stat--pending">
          <span className="admin-investment-requests__stat-label">Pending</span>
          <span className="admin-investment-requests__stat-value">{pendingCount}</span>
        </div>
        <div className="admin-investment-requests__stat admin-investment-requests__stat--approved">
          <span className="admin-investment-requests__stat-label">Approved</span>
          <span className="admin-investment-requests__stat-value">{approvedCount}</span>
        </div>
        <div className="admin-investment-requests__stat admin-investment-requests__stat--rejected">
          <span className="admin-investment-requests__stat-label">Rejected</span>
          <span className="admin-investment-requests__stat-value">{rejectedCount}</span>
        </div>
        <div className="admin-investment-requests__stat admin-investment-requests__stat--amount">
          <span className="admin-investment-requests__stat-label">Pending Amount</span>
          <span className="admin-investment-requests__stat-value">
            {formatCurrency(totalPendingAmount)}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-investment-requests__filters">
        <div className="admin-investment-requests__search">
          <input
            type="text"
            placeholder="Search by user name, email, property, or request ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-investment-requests__search-input"
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="admin-investment-requests__search-icon">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        <div className="admin-investment-requests__filter-group">
          <label className="admin-investment-requests__filter-label">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-investment-requests__filter-select"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button
          onClick={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
          className="admin-investment-requests__clear-filters"
        >
          Clear Filters
        </button>
      </div>

      {/* Requests Table */}
      <div className="admin-investment-requests__table-container">
        <table className="admin-investment-requests__table">
          <thead>
            <tr>
              <th>User</th>
              <th>Property</th>
              <th>Amount</th>
              <th>Period</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No investment requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request._id}>
                  <td>
                    <div className="admin-investment-requests__user-info">
                      <div className="admin-investment-requests__user-avatar">
                        {request.userId?.avatarUrl ? (
                          <img src={request.userId.avatarUrl} alt={request.userId.name} />
                        ) : (
                          <span>{request.userId?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      <div>
                        <div className="admin-investment-requests__user-name">
                          {request.userId?.name || 'Unknown User'}
                        </div>
                        <div className="admin-investment-requests__user-email">
                          {request.userId?.email || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-investment-requests__property-name">
                      {request.propertyId?.title || 'Unknown Property'}
                    </div>
                  </td>
                  <td>
                    <div className="admin-investment-requests__amount">
                      {formatCurrency(request.amountInvested)}
                    </div>
                  </td>
                  <td>
                    <div className="admin-investment-requests__period">
                      {request.timePeriod} months
                    </div>
                  </td>
                  <td>
                    <div className="admin-investment-requests__date">
                      {formatDate(request.createdAt)}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={request.status} />
                  </td>
                  <td>
                    <div className="admin-investment-requests__actions">
                      <button
                        onClick={() => handleViewDetail(request)}
                        className="admin-investment-requests__action-btn admin-investment-requests__action-btn--view"
                      >
                        View
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request)}
                            className="admin-investment-requests__action-btn admin-investment-requests__action-btn--approve"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            className="admin-investment-requests__action-btn admin-investment-requests__action-btn--reject"
                          >
                            Reject
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
        <div className="admin-investment-requests__modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="admin-investment-requests__modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-investment-requests__modal-header">
              <h2>Investment Request Details</h2>
              <button onClick={() => setShowDetail(false)} className="admin-investment-requests__modal-close">
                ×
              </button>
            </div>
            <div className="admin-investment-requests__modal-content">
              <div className="admin-investment-requests__detail-section">
                <h3>User Information</h3>
                <p><strong>Name:</strong> {selectedRequest.userId?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedRequest.userId?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedRequest.userId?.phone || 'N/A'}</p>
              </div>
              <div className="admin-investment-requests__detail-section">
                <h3>Property Information</h3>
                <p><strong>Property:</strong> {selectedRequest.propertyId?.title || 'N/A'}</p>
              </div>
              <div className="admin-investment-requests__detail-section">
                <h3>Investment Details</h3>
                <p><strong>Amount:</strong> {formatCurrency(selectedRequest.amountInvested)}</p>
                <p><strong>Period:</strong> {selectedRequest.timePeriod} months</p>
                <p><strong>Status:</strong> <StatusBadge status={selectedRequest.status} /></p>
                <p><strong>Date:</strong> {formatDate(selectedRequest.createdAt)}</p>
                {selectedRequest.notes && (
                  <p><strong>Notes:</strong> {selectedRequest.notes}</p>
                )}
              </div>
              <div className="admin-investment-requests__detail-section">
                <h3>Transaction Proof</h3>
                {selectedRequest.transactionProof ? (
                  <div className="admin-investment-requests__proof-container">
                    <img
                      src={selectedRequest.transactionProof}
                      alt="Transaction proof"
                      className="admin-investment-requests__proof-image"
                    />
                    <button
                      onClick={() => {
                        setFullScreenImageUrl(selectedRequest.transactionProof);
                        setShowFullScreenImage(true);
                      }}
                      className="admin-investment-requests__view-fullscreen-btn"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                      </svg>
                      View Full Screen
                    </button>
                  </div>
                ) : (
                  <p>No transaction proof uploaded</p>
                )}
              </div>
              {selectedRequest.status === 'pending' && (
                <div className="admin-investment-requests__modal-actions">
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    className="admin-investment-requests__modal-btn admin-investment-requests__modal-btn--approve"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    className="admin-investment-requests__modal-btn admin-investment-requests__modal-btn--reject"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          title={confirmAction?.type === 'approve' ? 'Approve Investment Request' : 'Reject Investment Request'}
          message={
            confirmAction?.type === 'approve'
              ? `Are you sure you want to approve this investment request of ${formatCurrency(selectedRequest?.amountInvested || 0)}?`
              : 'Please provide a reason for rejection:'
          }
          onConfirm={handleConfirmAction}
          onCancel={() => {
            setShowConfirmDialog(false);
            setConfirmAction(null);
            setAdminNotes('');
          }}
          showInput={confirmAction?.type === 'reject'}
          inputValue={adminNotes}
          onInputChange={setAdminNotes}
          inputPlaceholder="Rejection reason (required)"
          confirmText={confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
          confirmButtonClass={confirmAction?.type === 'approve' ? 'confirm-dialog__btn--approve' : 'confirm-dialog__btn--reject'}
        />
      )}

      {/* Full Screen Image Viewer */}
      {showFullScreenImage && fullScreenImageUrl && (
        <div className="admin-investment-requests__fullscreen-overlay" onClick={() => setShowFullScreenImage(false)}>
          <div className="admin-investment-requests__fullscreen-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-investment-requests__fullscreen-header">
              <h3>Transaction Proof</h3>
              <button
                onClick={() => setShowFullScreenImage(false)}
                className="admin-investment-requests__fullscreen-close"
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="admin-investment-requests__fullscreen-content">
              <img
                src={fullScreenImageUrl}
                alt="Transaction proof - Full screen"
                className="admin-investment-requests__fullscreen-image"
              />
            </div>
            <div className="admin-investment-requests__fullscreen-footer">
              <button
                onClick={() => setShowFullScreenImage(false)}
                className="admin-investment-requests__fullscreen-back-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvestmentRequests;

