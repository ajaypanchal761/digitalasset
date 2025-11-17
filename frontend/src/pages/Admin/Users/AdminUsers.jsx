import { useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import StatusBadge from '../../../components/Admin/common/StatusBadge';
import UserDetail from '../../../components/Admin/UserDetail';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const AdminUsers = () => {
  const { users, selectedUser, setSelectedUser } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery);
      
      const matchesAccount = accountFilter === 'all' || user.accountStatus === accountFilter;
      
      return matchesSearch && matchesAccount;
    });
  }, [users, searchQuery, accountFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleClearFilters = () => {
    setSearchQuery('');
    setAccountFilter('all');
    setCurrentPage(1);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
  };

  const handleCloseUserDetail = () => {
    setSelectedUser(null);
  };

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
            <span className="admin-users__stat-value">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-users__filters">
        <div className="admin-users__search">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-users__search-input"
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="admin-users__search-icon">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        <div className="admin-users__filter-group">
          <label className="admin-users__filter-label">Account Status</label>
          <select
            value={accountFilter}
            onChange={(e) => {
              setAccountFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-users__filter-select"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
            <option value="suspended">Suspended</option>
          </select>
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
                <tr key={user.id}>
                  <td>
                    <div className="admin-users__user-name">
                      <div className="admin-users__user-avatar">
                        {user.name.charAt(0)}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-users__contact">
                      <div>{user.email}</div>
                      <div className="admin-users__phone">{user.phone}</div>
                    </div>
                  </td>
                  <td>{formatDate(user.registrationDate)}</td>
                  <td>{formatCurrency(user.wallet.totalInvestments)}</td>
                  <td>{formatCurrency(user.wallet.balance)}</td>
                  <td>
                    <StatusBadge status={user.accountStatus} />
                  </td>
                  <td>
                    <button 
                      className="admin-users__action-btn"
                      onClick={() => handleViewUser(user)}
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
      {filteredUsers.length > 0 && (
        <div className="admin-users__pagination">
          <div className="admin-users__pagination-info">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
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
