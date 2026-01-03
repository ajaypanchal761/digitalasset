import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdmin } from '../../../context/AdminContext';
import StatusBadge from '../../../components/Admin/common/StatusBadge';
import UserDetail from '../../../components/Admin/UserDetail';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import Select from '../../../components/common/Select';

const AdminUsers = () => {
  const location = useLocation();
  const { 
    users, 
    usersLoading, 
    usersError,
    selectedUser, 
    setSelectedUser,
    fetchUsers,
    refreshUsers,
    fetchUserDetail
  } = useAdmin();
  const [searchQuery, setSearchQuery] = useState(''); // Input value (what user types)
  const [activeSearchQuery, setActiveSearchQuery] = useState(''); // Actual search term used for API calls
  const [accountFilter, setAccountFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Check for search query from navigation state (from header search)
  useEffect(() => {
    if (location.state?.searchQuery) {
      console.log('🔍 AdminUsers - Received search query from navigation:', {
        query: location.state.searchQuery,
        timestamp: new Date().toISOString()
      });
      setSearchQuery(location.state.searchQuery);
      setActiveSearchQuery(location.state.searchQuery); // Also set active search
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
        console.log('🔍 AdminUsers - Received search event from header:', {
          query,
          timestamp: new Date().toISOString()
        });
        setSearchQuery(query);
        setActiveSearchQuery(query); // Also set active search
        setCurrentPage(1);
      }
    };

    window.addEventListener('adminSearch', handleSearchEvent);
    return () => {
      window.removeEventListener('adminSearch', handleSearchEvent);
    };
  }, []);

  // Use users directly from API (backend handles filtering and pagination)
  const paginatedUsers = users;

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveSearchQuery(''); // Clear active search too
    setAccountFilter('all');
    setCurrentPage(1);
  };

  // Handler for search button click or Enter key
  const handleSearch = () => {
    setActiveSearchQuery(searchQuery); // Use current input value for search
    setCurrentPage(1); // Reset to first page
  };

  // Handle Enter key in search input
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Fetch users when filters change (only when activeSearchQuery changes, not on every keystroke)
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: pageSize,
    };
    
    if (activeSearchQuery.trim()) {
      params.search = activeSearchQuery.trim();
    }
    
    if (accountFilter !== 'all') {
      params.status = accountFilter;
    }
    
    console.log('📋 AdminUsers - Fetching users with params:', params);
    
    fetchUsers(params).then((response) => {
      // Update pagination info from API response
      if (response?.total !== undefined) {
        setTotalUsers(response.total);
      }
      if (response?.pages !== undefined) {
        setTotalPages(response.pages);
      }
    }).catch((error) => {
      console.error('❌ AdminUsers - Error fetching users:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, activeSearchQuery, accountFilter]); // Use activeSearchQuery instead of debouncedSearchQuery

  // Log component state changes
  useEffect(() => {
    console.log('📊 AdminUsers - Component state:', {
      usersCount: users.length,
      loading: usersLoading,
      error: usersError,
      hasUsers: users.length > 0,
      searchQuery,
      accountFilter,
      currentPage,
      pageSize,
      timestamp: new Date().toISOString()
    });
  }, [users, usersLoading, usersError, searchQuery, accountFilter, currentPage, pageSize]);

  const handleViewUser = async (user) => {
    console.log('👁️ AdminUsers - View user clicked:', {
      userId: user.id || user._id,
      userName: user.name,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Fetch full user detail with holdings and transactions
      await fetchUserDetail(user.id || user._id);
    } catch (error) {
      console.error('❌ AdminUsers - Error fetching user detail:', error);
      // Fallback to using existing user data
      setSelectedUser(user);
    }
  };

  const handleCloseUserDetail = () => {
    console.log('🔒 AdminUsers - Closing user detail');
    setSelectedUser(null);
  };

  // Show loading state
  if (usersLoading) {
    console.log('⏳ AdminUsers - Showing loading state');
    return (
      <div className="admin-users">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (usersError) {
    console.error('❌ AdminUsers - Showing error state:', {
      error: usersError,
      timestamp: new Date().toISOString()
    });
    return (
      <div className="admin-users">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>Error: {usersError}</p>
          <button 
            onClick={() => {
              console.log('🔄 AdminUsers - Retry button clicked');
              refreshUsers();
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
    <div className="admin-users">
      {/* Page Header */}
      <div className="admin-users__header">
        <div>
          <h1 className="admin-users__title">User Management</h1>
          <p className="admin-users__subtitle">
            Manage user accounts, view details, and perform administrative actions
          </p>
        </div>
        <div className="admin-users__stats">
          <div className="admin-users__stat">
            <span className="admin-users__stat-label">Total Users</span>
            <span className="admin-users__stat-value">{totalUsers}</span>
          </div>
        </div>
      </div>

      {/* Search, Filters and Table Container */}
      <div className="admin-users__data-container">
        {/* Search and Filters */}
        <div className="admin-users__filters">
          <div className="admin-users__search">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value); // Only update input, don't trigger search
              }}
              onKeyDown={handleSearchKeyDown}
              className="admin-users__search-input"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="admin-users__search-btn"
              aria-label="Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="admin-users__search-icon">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>

          <div className="admin-users__filter-group">
            <label className="admin-users__filter-label">Account Status</label>
            <Select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'locked', label: 'Locked' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              className="admin-users__filter-select"
            />
          </div>

          <button
            onClick={handleClearFilters}
            className="admin-users__clear-filters"
          >
            Clear Filters
          </button>
        </div>

        {/* Users Table */}
        <div className="admin-users__table-container">
        <table className="admin-users__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email / Phone</th>
              <th>Registration Date</th>
              <th>Total Investments</th>
              <th>Wallet Balance</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="admin-users__empty">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id || user._id}>
                  <td>
                    <div className="admin-users__user-name">
                      <div className="admin-users__user-avatar">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} />
                        ) : (
                          <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      <span>{user.name || 'Unknown User'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-users__contact">
                      <div>{user.email || '-'}</div>
                      <div className="admin-users__phone">{user.phone || '-'}</div>
                    </div>
                  </td>
                  <td>{formatDate(user.registrationDate || user.createdAt)}</td>
                  <td>{formatCurrency(user.wallet?.totalInvestments || 0)}</td>
                  <td>{formatCurrency(user.wallet?.balance || 0)}</td>
                  <td>
                    <StatusBadge status={user.accountStatus || 'active'} />
                  </td>
                  <td>
                    <button 
                      className="admin-users__action-btn"
                      onClick={() => handleViewUser(user)}
                      disabled={usersLoading}
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
      </div>

      {/* Pagination */}
      {paginatedUsers.length > 0 && (
        <div className="admin-users__pagination">
          <div className="admin-users__pagination-info">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
          </div>
          <div className="admin-users__pagination-controls">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="admin-users__page-size"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="admin-users__pagination-btn"
            >
              Previous
            </button>
            <span className="admin-users__pagination-page">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="admin-users__pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetail user={selectedUser} onClose={handleCloseUserDetail} />
      )}
    </div>
  );
};

export default AdminUsers;
