import StatusBadge from '../common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const UsersTable = ({ users, onUserClick }) => {
  if (!users || users.length === 0) {
    return (
      <div className="admin-table__empty">
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div className="admin-table">
      <table className="admin-table__table">
        <thead className="admin-table__head">
          <tr>
            <th className="admin-table__th">User</th>
            <th className="admin-table__th">Registration Date</th>
            <th className="admin-table__th">KYC Status</th>
            <th className="admin-table__th">Total Investments</th>
            <th className="admin-table__th">Wallet Balance</th>
            <th className="admin-table__th">Account Status</th>
            <th className="admin-table__th admin-table__th--actions">Actions</th>
          </tr>
        </thead>
        <tbody className="admin-table__body">
          {users.map((user) => (
            <tr 
              key={user.id} 
              className="admin-table__row"
              onClick={() => onUserClick && onUserClick(user)}
            >
              <td className="admin-table__td">
                <div className="admin-table__user-info">
                  <div className="admin-table__user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="admin-table__user-details">
                    <div className="admin-table__user-name">{user.name}</div>
                    <div className="admin-table__user-email">{user.email}</div>
                    <div className="admin-table__user-phone">{user.phone}</div>
                  </div>
                </div>
              </td>
              <td className="admin-table__td">
                {formatDate(user.registrationDate)}
              </td>
              <td className="admin-table__td">
                <StatusBadge status={user.kycStatus} />
              </td>
              <td className="admin-table__td admin-table__td--amount">
                {formatCurrency(user.totalInvestments)}
              </td>
              <td className="admin-table__td admin-table__td--amount">
                {formatCurrency(user.walletBalance)}
              </td>
              <td className="admin-table__td">
                <StatusBadge status={user.accountStatus} />
              </td>
              <td className="admin-table__td admin-table__td--actions">
                <div className="admin-table__actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="admin-table__action-button"
                    onClick={() => onUserClick && onUserClick(user)}
                    title="View Details"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;

