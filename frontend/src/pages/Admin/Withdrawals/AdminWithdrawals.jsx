import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdmin } from '../../../context/AdminContext';
import { useToast } from '../../../context/ToastContext.jsx';
import StatusBadge from '../../../components/Admin/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import WithdrawalDetail from '../../../components/Admin/WithdrawalDetail';
import ConfirmDialog from '../../../components/Admin/common/ConfirmDialog';

const AdminWithdrawals = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const { 
    withdrawals, 
    withdrawalsLoading,
    withdrawalsError,
    selectedWithdrawal, 
    setSelectedWithdrawal,
    fetchWithdrawals,
    refreshWithdrawals,
    updateWithdrawalStatus,
    bulkUpdateWithdrawals
  } = useAdmin();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showWithdrawalDetail, setShowWithdrawalDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Check for search query from navigation state (from header search)
  useEffect(() => {
    if (location.state?.searchQuery) {
      console.log('🔍 AdminWithdrawals - Received search query from navigation:', {
        query: location.state.searchQuery,
        timestamp: new Date().toISOString()
      });
      setSearchQuery(location.state.searchQuery);
      setCurrentPage(1); // Reset to first page
      // Clear the state to prevent re-applying on re-renders
      window.history.replaceState({ ...location.state, searchQuery: undefined }, '');
    }
  }, [location.state]);

  // Listen for search events from header (when already on this page)
  useEffect(() => {
    const handleSearchEvent = (event) => {
      const query = event.detail?.searchQuery;
      if (query) {
        console.log('🔍 AdminWithdrawals - Received search event from header:', {
          query,
          timestamp: new Date().toISOString()
        });
        setSearchQuery(query);
        setCurrentPage(1);
      }
    };

    window.addEventListener('adminSearch', handleSearchEvent);
    return () => {
      window.removeEventListener('adminSearch', handleSearchEvent);
    };
  }, []);

  // Fetch withdrawals with server-side search, filtering, and pagination
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      const params = {
        page: currentPage,
        limit: pageSize,
      };

      // Add search parameter if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        // Map frontend status to backend status
        if (statusFilter === 'completed') {
          params.status = 'approved'; // Backend uses 'approved' for completed
        } else {
          params.status = statusFilter;
        }
      }

      try {
        const response = await fetchWithdrawals(params);
        if (isMounted && response.success) {
          setTotalWithdrawals(response.total || 0);
          setTotalPages(response.pages || 1);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching withdrawals:', error);
        }
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchData();
    }, searchQuery ? 500 : 0); // 500ms delay for search, immediate for other changes

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, statusFilter, currentPage, pageSize, fetchWithdrawals]);

  // Note: Re-fetch after approve/reject is handled by AdminContext's updateWithdrawalStatus
  // which calls fetchWithdrawals() and updates the withdrawals state
  // The main useEffect above will handle re-fetching with current filters when needed

  // Note: Statistics are calculated from current withdrawals data
  // For accurate stats across all withdrawals, a separate stats endpoint would be needed

  // Use withdrawals directly (already filtered and paginated by backend)
  const paginatedWithdrawals = withdrawals || [];

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
    setSelectedIds([]);
    // Fetch will be triggered by useEffect
  };

  const handleViewWithdrawal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowWithdrawalDetail(true);
  };

  const handleSelectWithdrawal = (withdrawalId) => {
    setSelectedIds(prev => 
      prev.includes(withdrawalId)
        ? prev.filter(id => id !== withdrawalId)
        : [...prev, withdrawalId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedWithdrawals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedWithdrawals.map(w => w.id || w._id));
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    setConfirmAction({ type: 'approve', ids: selectedIds });
    setShowConfirmDialog(true);
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    setConfirmAction({ type: 'reject', ids: selectedIds });
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    
    try {
      if (confirmAction.type === 'approve') {
        // Approve withdrawals (backend uses 'approved' status)
        await bulkUpdateWithdrawals(confirmAction.ids, 'approved');
      } else if (confirmAction.type === 'reject') {
        await bulkUpdateWithdrawals(confirmAction.ids, 'rejected', 'Bulk rejection by admin');
      }
      
      setSelectedIds([]);
      setShowConfirmDialog(false);
      setConfirmAction(null);
      
      // Refresh withdrawals list with current filters
      await fetchWithdrawalsWithFilters();
    } catch (error) {
      console.error('❌ AdminWithdrawals - Error in bulk action:', error);
      showToast(`Failed to ${confirmAction.type} withdrawals: ${error.message}`, 'error');
    }
  };

  // Statistics - calculate from all withdrawals for stats
  // Use current withdrawals for stats calculation
  const statsData = withdrawals;
  const pendingCount = statsData.filter(w => w.status === 'pending').length;
  const processingCount = statsData.filter(w => w.status === 'processing' || w.status === 'approved' || w.status === 'completed').length;
  const totalPendingAmount = statsData
    .filter(w => w.status === 'pending' || w.status === 'processing' || w.status === 'approved' || w.status === 'completed')
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  
  // Use total from backend for total withdrawals count
  const displayTotalWithdrawals = totalWithdrawals || statsData.length;

  // Show loading state
  if (withdrawalsLoading) {
    return (
      <div className="admin-withdrawals">
        <div className="admin-withdrawals__header">
          <div>
            <h1 className="admin-withdrawals__title">Withdrawal Management</h1>
            <p className="admin-withdrawals__subtitle">
              Review and manage withdrawal requests from users
            </p>
          </div>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (withdrawalsError) {
    return (
      <div className="admin-withdrawals">
        <div className="admin-withdrawals__header">
          <div>
            <h1 className="admin-withdrawals__title">Withdrawal Management</h1>
            <p className="admin-withdrawals__subtitle">
              Review and manage withdrawal requests from users
            </p>
          </div>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>Error: {withdrawalsError}</p>
          <button 
            onClick={() => {
              console.log('🔄 AdminWithdrawals - Retry button clicked');
              refreshWithdrawals();
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-withdrawals">
      {/* Page Header */}
      <div className="admin-withdrawals__header">
        <div>
          <h1 className="admin-withdrawals__title">Withdrawal Management</h1>
          <p className="admin-withdrawals__subtitle">
            Review and manage withdrawal requests from users
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-withdrawals__stats">
        <div className="admin-withdrawals__stat">
          <span className="admin-withdrawals__stat-label">Total Withdrawals</span>
          <span className="admin-withdrawals__stat-value">{displayTotalWithdrawals}</span>
        </div>
        <div className="admin-withdrawals__stat admin-withdrawals__stat--pending">
          <span className="admin-withdrawals__stat-label">Pending</span>
          <span className="admin-withdrawals__stat-value">{pendingCount}</span>
        </div>
        <div className="admin-withdrawals__stat admin-withdrawals__stat--processing">
          <span className="admin-withdrawals__stat-label">Processing</span>
          <span className="admin-withdrawals__stat-value">{processingCount}</span>
        </div>
        <div className="admin-withdrawals__stat admin-withdrawals__stat--amount">
          <span className="admin-withdrawals__stat-label">Pending Amount</span>
          <span className="admin-withdrawals__stat-value">
            {formatCurrency(totalPendingAmount)}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-withdrawals__filters">
        <div className="admin-withdrawals__search">
          <input
            type="text"
            placeholder="Search by user name, email, or withdrawal ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            onKeyDown={(e) => {
              // Trigger search on Enter key
              if (e.key === 'Enter') {
                setCurrentPage(1);
              }
            }}
            className="admin-withdrawals__search-input"
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="admin-withdrawals__search-icon">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        <div className="admin-withdrawals__filter-group">
          <label className="admin-withdrawals__filter-label">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            className="admin-withdrawals__filter-select"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button
          onClick={handleClearFilters}
          className="admin-withdrawals__clear-filters"
        >
          Clear Filters
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="admin-withdrawals__bulk-actions">
          <span className="admin-withdrawals__bulk-info">
            {selectedIds.length} withdrawal{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="admin-withdrawals__bulk-buttons">
            <button
              className="admin-withdrawals__bulk-btn admin-withdrawals__bulk-btn--approve"
              onClick={handleBulkApprove}
            >
              Approve Selected
            </button>
            <button
              className="admin-withdrawals__bulk-btn admin-withdrawals__bulk-btn--reject"
              onClick={handleBulkReject}
            >
              Reject Selected
            </button>
            <button
              className="admin-withdrawals__bulk-btn admin-withdrawals__bulk-btn--clear"
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Withdrawals Table */}
      <div className="admin-withdrawals__table-container">
        <table className="admin-withdrawals__table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedIds.length === paginatedWithdrawals.length && paginatedWithdrawals.length > 0}
                  onChange={handleSelectAll}
                  className="admin-withdrawals__checkbox"
                />
              </th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Bank Details</th>
              <th>Request Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedWithdrawals.length === 0 ? (
              <tr>
                <td colSpan="8" className="admin-withdrawals__empty">
                  No withdrawals found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedWithdrawals.map((withdrawal) => {
                const withdrawalId = withdrawal.id || withdrawal._id;
                return (
                  <tr key={withdrawalId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(withdrawalId)}
                        onChange={() => handleSelectWithdrawal(withdrawalId)}
                        className="admin-withdrawals__checkbox"
                      />
                    </td>
                    <td>
                      <div className="admin-withdrawals__user-info">
                        <div className="admin-withdrawals__user-avatar">
                          {(withdrawal.userName || 'U').split(' ').map(n => n[0] || 'U').join('').toUpperCase()}
                        </div>
                        <div className="admin-withdrawals__user-details">
                          <div className="admin-withdrawals__user-name">{withdrawal.userName || 'Unknown User'}</div>
                          <div className="admin-withdrawals__user-email">{withdrawal.userEmail || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-withdrawals__type-badge admin-withdrawals__type-badge--${withdrawal.type || 'unknown'}`}>
                        {withdrawal.type === 'investment'
                          ? 'Investment'
                          : withdrawal.type === 'earnings'
                          ? 'Earnings'
                          : (withdrawal.type || 'Other')}
                      </span>
                    </td>
                    <td className="admin-withdrawals__amount">
                      {formatCurrency(withdrawal.amount || 0)}
                    </td>
                    <td>
                      <div className="admin-withdrawals__bank-info">
                        <div className="admin-withdrawals__bank-name">
                          {withdrawal.bankDetails?.accountHolderName || 'N/A'}
                        </div>
                        <div className="admin-withdrawals__bank-details">
                          {withdrawal.bankDetails?.accountNumber || 'N/A'} • {withdrawal.bankDetails?.ifscCode || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(withdrawal.requestDate || withdrawal.createdAt)}</td>
                    <td>
                      <StatusBadge status={withdrawal.status} />
                    </td>
                    <td>
                      <button 
                        className="admin-withdrawals__action-btn admin-withdrawals__action-btn--view"
                        onClick={() => handleViewWithdrawal(withdrawal)}
                        title="View Details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalWithdrawals > 0 && (
        <div className="admin-withdrawals__pagination">
          <div className="admin-withdrawals__pagination-info">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalWithdrawals)} of {totalWithdrawals} withdrawals
          </div>
          <div className="admin-withdrawals__pagination-controls">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="admin-withdrawals__page-size"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="admin-withdrawals__pagination-btn"
            >
              Previous
            </button>
            <span className="admin-withdrawals__pagination-page">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="admin-withdrawals__pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Withdrawal Detail Modal */}
      {showWithdrawalDetail && selectedWithdrawal && (
        <WithdrawalDetail
          withdrawal={selectedWithdrawal}
          onClose={() => {
            setShowWithdrawalDetail(false);
            setSelectedWithdrawal(null);
          }}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setConfirmAction(null);
        }}
        onConfirm={handleConfirmAction}
        title={confirmAction?.type === 'approve' ? 'Approve Withdrawals' : 'Reject Withdrawals'}
        message={
          confirmAction?.type === 'approve'
            ? `Are you sure you want to approve ${confirmAction?.ids.length} withdrawal(s)? This action cannot be undone.`
            : `Are you sure you want to reject ${confirmAction?.ids.length} withdrawal(s)? This action cannot be undone.`
        }
        confirmText={confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        isDestructive={confirmAction?.type === 'reject'}
      />
    </div>
  );
};

export default AdminWithdrawals;
