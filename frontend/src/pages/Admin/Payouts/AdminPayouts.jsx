import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { adminAPI } from '../../../services/api.js';
import { useToast } from '../../../context/ToastContext.jsx';
import StatusBadge from '../../../components/Admin/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import ConfirmDialog from '../../../components/Admin/common/ConfirmDialog';
import Select from '../../../components/common/Select';

const AdminPayouts = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [payoutsError, setPayoutsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Fetch payouts with server-side search, filtering, and pagination
  const fetchPayouts = useCallback(async () => {
    try {
      setPayoutsLoading(true);
      setPayoutsError(null);
      
      const params = {
        page: currentPage,
        limit: pageSize,
      };

      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Add search parameter if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await adminAPI.getPayouts(params);
      if (response.success) {
        setPayouts(response.data || []);
        setTotalPayouts(response.total || 0);
        setTotalPages(response.pages || 1);
      } else {
        setPayoutsError(response.message || 'Failed to fetch payouts');
        setPayouts([]);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
      setPayoutsError(error.message || 'Failed to fetch payouts');
      setPayouts([]);
    } finally {
      setPayoutsLoading(false);
    }
  }, [statusFilter, searchQuery, currentPage, pageSize]);

  // Fetch payouts when filters, search, or pagination changes
  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchPayouts();
    }, searchQuery ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [fetchPayouts, searchQuery]);

  // Check for search query from navigation state
  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
      setCurrentPage(1);
      window.history.replaceState({ ...location.state, searchQuery: undefined }, '');
    }
  }, [location.state]);

  // Listen for search events from header
  useEffect(() => {
    const handleSearchEvent = (event) => {
      const query = event.detail?.searchQuery;
      if (query) {
        setSearchQuery(query);
        setCurrentPage(1);
      }
    };

    window.addEventListener('adminSearch', handleSearchEvent);
    return () => {
      window.removeEventListener('adminSearch', handleSearchEvent);
    };
  }, []);

  // Use payouts directly (already filtered and paginated by backend)
  const paginatedPayouts = payouts || [];

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleSelectPayout = (payoutId) => {
    setSelectedIds(prev => 
      prev.includes(payoutId)
        ? prev.filter(id => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedPayouts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedPayouts.map(p => p.id || p._id));
    }
  };

  const handleBulkProcess = () => {
    if (selectedIds.length === 0) return;
    setConfirmAction({ type: 'process', ids: selectedIds });
    setShowConfirmDialog(true);
  };

  const handleGeneratePayouts = async () => {
    try {
      setPayoutsLoading(true);
      const response = await adminAPI.generateMonthlyPayouts();
      if (response.success) {
        showToast(
          `Successfully generated ${response.data?.created || 0} payout(s)`,
          'success'
        );
        await fetchPayouts(); // Refresh the list
      } else {
        showToast(response.message || 'Failed to generate payouts', 'error');
      }
    } catch (error) {
      console.error('Error generating payouts:', error);
      showToast(error.message || 'Failed to generate payouts', 'error');
    } finally {
      setPayoutsLoading(false);
    }
  };

  const handleProcessAllPending = () => {
    // Use all payouts, not filtered, to process ALL pending payouts
    const pendingIds = payouts
      .filter(p => p.status === 'pending')
      .map(p => p.id || p._id);
    
    if (pendingIds.length === 0) {
      showToast('No pending payouts to process', 'info');
      return;
    }
    
    setConfirmAction({ type: 'process', ids: pendingIds });
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    
    try {
      if (confirmAction.type === 'process') {
        const response = await adminAPI.processPayouts(confirmAction.ids);
        if (response.success) {
          // Show success message from backend
          showToast(response.message || `Successfully processed ${confirmAction.ids.length} payout(s)`, 'success');
        } else {
          showToast(response.message || 'Failed to process payouts', 'error');
        }
      }
      
      setSelectedIds([]);
      setShowConfirmDialog(false);
      setConfirmAction(null);
      
      // Refresh payouts list
      await fetchPayouts();
    } catch (error) {
      console.error('Error processing payouts:', error);
      showToast(`Failed to process payouts: ${error.message}`, 'error');
    }
  };

  // Statistics - calculate from current page data
  // Note: For accurate stats across all payouts, we'd need a separate stats endpoint
  // For now, we calculate from the current page data
  const pendingCount = payouts.filter(p => p.status === 'pending').length;
  const processedCount = payouts.filter(p => p.status === 'processed' || p.status === 'completed').length;
  const totalPendingAmount = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalProcessedAmount = payouts
    .filter(p => p.status === 'processed' || p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Use total from backend for total payouts count - ensure it's always a number
  const displayTotalPayouts = (totalPayouts && totalPayouts > 0) ? totalPayouts : (payouts && payouts.length ? payouts.length : 0);

  // Show loading state
  if (payoutsLoading) {
    return (
      <div className="admin-payouts">
        <div className="admin-payouts__header">
          <div>
            <h1 className="admin-payouts__title">Monthly Payout Management</h1>
            <p className="admin-payouts__subtitle">
              Manage and process monthly payouts for investments
            </p>
          </div>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading payouts...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (payoutsError) {
    return (
      <div className="admin-payouts">
        <div className="admin-payouts__header">
          <div>
            <h1 className="admin-payouts__title">Monthly Payout Management</h1>
            <p className="admin-payouts__subtitle">
              Manage and process monthly payouts for investments
            </p>
          </div>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>Error: {payoutsError}</p>
          <button 
            onClick={fetchPayouts}
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
    <div className="admin-payouts">
      {/* Page Header */}
      <div className="admin-payouts__header">
        <div>
          <h1 className="admin-payouts__title">Monthly Payout Management</h1>
          <p className="admin-payouts__subtitle">
            Manage and process monthly payouts for investments
          </p>
        </div>
        <div className="admin-payouts__header-buttons">
          <button
            onClick={handleGeneratePayouts}
            className="admin-payouts__generate-btn"
            disabled={payoutsLoading}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: payoutsLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              opacity: payoutsLoading ? 0.6 : 1,
            }}
          >
            {payoutsLoading ? 'Generating...' : 'Generate Monthly Payouts'}
          </button>
          <button
            onClick={handleProcessAllPending}
            className="admin-payouts__process-all-btn"
            disabled={pendingCount === 0}
          >
            Process All Pending
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-payouts__stats">
        <div className="admin-payouts__stat">
          <div className="admin-payouts__stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="admin-payouts__stat-content">
            <span className="admin-payouts__stat-label">Total Payouts</span>
            <span className="admin-payouts__stat-value">{displayTotalPayouts}</span>
          </div>
        </div>
        <div className="admin-payouts__stat admin-payouts__stat--pending">
          <div className="admin-payouts__stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="admin-payouts__stat-content">
            <span className="admin-payouts__stat-label">Pending</span>
            <span className="admin-payouts__stat-value">{pendingCount}</span>
          </div>
        </div>
        <div className="admin-payouts__stat admin-payouts__stat--processed">
          <div className="admin-payouts__stat-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="admin-payouts__stat-content">
            <span className="admin-payouts__stat-label">Processed</span>
            <span className="admin-payouts__stat-value">{processedCount}</span>
          </div>
        </div>
        <div className="admin-payouts__stat admin-payouts__stat--amount">
          <div className="admin-payouts__stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="admin-payouts__stat-content">
            <span className="admin-payouts__stat-label">Pending Amount</span>
            <span className="admin-payouts__stat-value">
              {formatCurrency(totalPendingAmount)}
            </span>
          </div>
        </div>
        <div className="admin-payouts__stat admin-payouts__stat--amount">
          <div className="admin-payouts__stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="admin-payouts__stat-content">
            <span className="admin-payouts__stat-label">Processed Amount</span>
            <span className="admin-payouts__stat-value">
              {formatCurrency(totalProcessedAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Search, Filters and Table Container */}
      <div className="admin-payouts__data-container">
        {/* Search and Filters */}
        <div className="admin-payouts__filters">
          <div className="admin-payouts__search">
            <input
              type="text"
              placeholder="Search by user name, email, property, or payout ID..."
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
              className="admin-payouts__search-input"
            />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="admin-payouts__search-icon">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>

          <div className="admin-payouts__filter-group">
            <label className="admin-payouts__filter-label">Status</label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'processed', label: 'Processed' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
              ]}
              className="admin-payouts__filter-select"
            />
          </div>

          <button
            onClick={handleClearFilters}
            className="admin-payouts__clear-filters"
          >
            Clear Filters
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="admin-payouts__bulk-actions">
            <span className="admin-payouts__bulk-info">
              {selectedIds.length} payout{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="admin-payouts__bulk-buttons">
              <button
                className="admin-payouts__bulk-btn admin-payouts__bulk-btn--process"
                onClick={handleBulkProcess}
              >
                Process Selected
              </button>
              <button
                className="admin-payouts__bulk-btn admin-payouts__bulk-btn--clear"
                onClick={() => setSelectedIds([])}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Payouts Table */}
        <div className="admin-payouts__table-container">
        <table className="admin-payouts__table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedIds.length === paginatedPayouts.length && paginatedPayouts.length > 0}
                  onChange={handleSelectAll}
                  className="admin-payouts__checkbox"
                />
              </th>
              <th>User</th>
              <th>Property</th>
              <th>Amount</th>
              <th>Payout Date</th>
              <th>Next Payout Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPayouts.length === 0 ? (
              <tr>
                <td colSpan="8" className="admin-payouts__empty">
                  No payouts found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedPayouts.map((payout) => {
                const payoutId = payout.id || payout._id;
                return (
                  <tr key={payoutId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(payoutId)}
                        onChange={() => handleSelectPayout(payoutId)}
                        className="admin-payouts__checkbox"
                      />
                    </td>
                    <td>
                      <div className="admin-payouts__user-info">
                        <div className="admin-payouts__user-avatar">
                          {(payout.userName || 'U').split(' ').map(n => n[0] || 'U').join('').toUpperCase()}
                        </div>
                        <div className="admin-payouts__user-details">
                          <div className="admin-payouts__user-name">{payout.userName || 'Unknown User'}</div>
                          <div className="admin-payouts__user-email">{payout.userEmail || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-payouts__property">
                      {payout.propertyName || 'N/A'}
                    </td>
                    <td className="admin-payouts__amount">
                      {formatCurrency(payout.amount || 0)}
                    </td>
                    <td>{formatDate(payout.payoutDate || payout.createdAt)}</td>
                    <td>{formatDate(payout.nextPayoutDate)}</td>
                    <td>
                      <StatusBadge status={payout.status} />
                    </td>
                    <td>
                      {payout.status === 'pending' && (
                        <button 
                          className="admin-payouts__action-btn admin-payouts__action-btn--process"
                          onClick={async () => {
                            try {
                              const response = await adminAPI.processPayouts([payoutId]);
                              if (response.success) {
                                showToast(response.message || 'Payout processed successfully', 'success');
                              } else {
                                showToast(response.message || 'Failed to process payout', 'error');
                              }
                              await fetchPayouts();
                            } catch (error) {
                              showToast(`Failed to process payout: ${error.message}`, 'error');
                            }
                          }}
                          title="Process Payout"
                        >
                          Process
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPayouts > 0 && (
        <div className="admin-payouts__pagination">
          <div className="admin-payouts__pagination-info">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalPayouts)} of {totalPayouts} payouts
          </div>
          <div className="admin-payouts__pagination-controls">
            <Select
              value={pageSize.toString()}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              options={[
                { value: '10', label: '10 per page' },
                { value: '20', label: '20 per page' },
                { value: '50', label: '50 per page' },
                { value: '100', label: '100 per page' },
              ]}
              className="admin-payouts__page-size"
            />
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="admin-payouts__pagination-btn"
            >
              Previous
            </button>
            <span className="admin-payouts__pagination-page">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="admin-payouts__pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setConfirmAction(null);
        }}
        onConfirm={handleConfirmAction}
        title="Process Payouts"
        message={`Are you sure you want to process ${confirmAction?.ids.length} payout(s)? This will credit the amounts to user wallets.`}
        confirmText="Process"
        cancelText="Cancel"
        isDestructive={false}
      />
    </div>
  );
};

export default AdminPayouts;

