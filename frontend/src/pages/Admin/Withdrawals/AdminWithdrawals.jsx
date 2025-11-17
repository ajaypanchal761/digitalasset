import { useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import StatusBadge from '../../../components/Admin/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import WithdrawalDetail from '../../../components/Admin/WithdrawalDetail';
import ConfirmDialog from '../../../components/Admin/common/ConfirmDialog';

const AdminWithdrawals = () => {
  const { 
    withdrawals, 
    selectedWithdrawal, 
    setSelectedWithdrawal,
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

  // Filter withdrawals
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(withdrawal => {
      const matchesSearch = 
        withdrawal.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        withdrawal.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        withdrawal.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [withdrawals, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredWithdrawals.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedWithdrawals = filteredWithdrawals.slice(startIndex, endIndex);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
    setSelectedIds([]);
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
      setSelectedIds(paginatedWithdrawals.map(w => w.id));
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

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'approve') {
      bulkUpdateWithdrawals(confirmAction.ids, 'processing');
      setTimeout(() => {
        bulkUpdateWithdrawals(confirmAction.ids, 'completed');
      }, 1000);
    } else if (confirmAction.type === 'reject') {
      bulkUpdateWithdrawals(confirmAction.ids, 'rejected', 'Bulk rejection by admin');
    }
    
    setSelectedIds([]);
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const processingCount = withdrawals.filter(w => w.status === 'processing').length;
  const totalPendingAmount = withdrawals
    .filter(w => w.status === 'pending' || w.status === 'processing')
    .reduce((sum, w) => sum + w.amount, 0);

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
          <span className="admin-withdrawals__stat-value">{withdrawals.length}</span>
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
              setCurrentPage(1);
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
              setCurrentPage(1);
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
                <td colSpan="7" className="admin-withdrawals__empty">
                  No withdrawals found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(withdrawal.id)}
                      onChange={() => handleSelectWithdrawal(withdrawal.id)}
                      className="admin-withdrawals__checkbox"
                    />
                  </td>
                  <td>
                    <div className="admin-withdrawals__user-info">
                      <div className="admin-withdrawals__user-avatar">
                        {withdrawal.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="admin-withdrawals__user-details">
                        <div className="admin-withdrawals__user-name">{withdrawal.userName}</div>
                        <div className="admin-withdrawals__user-email">{withdrawal.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="admin-withdrawals__amount">
                    {formatCurrency(withdrawal.amount)}
                  </td>
                  <td>
                    <div className="admin-withdrawals__bank-info">
                      <div className="admin-withdrawals__bank-name">
                        {withdrawal.bankDetails.accountHolderName}
                      </div>
                      <div className="admin-withdrawals__bank-details">
                        {withdrawal.bankDetails.accountNumber} • {withdrawal.bankDetails.ifscCode}
                      </div>
                    </div>
                  </td>
                  <td>{formatDate(withdrawal.requestDate)}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredWithdrawals.length > 0 && (
        <div className="admin-withdrawals__pagination">
          <div className="admin-withdrawals__pagination-info">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredWithdrawals.length)} of {filteredWithdrawals.length} withdrawals
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
