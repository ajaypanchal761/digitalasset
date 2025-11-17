import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import StatusBadge from './common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

const UserDetail = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');

  if (!user) return null;

  const tabs = [
    { id: 'info', label: 'User Info', icon: '👤' },
    { id: 'investments', label: 'Investments', icon: '💼' },
    { id: 'wallet', label: 'Wallet', icon: '💰' },
    { id: 'actions', label: 'Actions', icon: '⚙️' },
  ];

  return (
    <div className="user-detail__overlay" onClick={onClose}>
      <div className="user-detail" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="user-detail__header">
          <div className="user-detail__header-left">
            <div className="user-detail__avatar">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="user-detail__name">{user.name}</h2>
              <p className="user-detail__email">{user.email}</p>
            </div>
          </div>
          <button className="user-detail__close" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="user-detail__quick-stats">
          <div className="user-detail__stat">
            <span className="user-detail__stat-label">Account Status</span>
            <StatusBadge status={user.accountStatus} />
          </div>
          <div className="user-detail__stat">
            <span className="user-detail__stat-label">Total Investments</span>
            <span className="user-detail__stat-value">{formatCurrency(user.wallet.totalInvestments)}</span>
          </div>
          <div className="user-detail__stat">
            <span className="user-detail__stat-label">Wallet Balance</span>
            <span className="user-detail__stat-value">{formatCurrency(user.wallet.balance)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="user-detail__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`user-detail__tab ${activeTab === tab.id ? 'user-detail__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="user-detail__tab-icon">{tab.icon}</span>
              <span className="user-detail__tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="user-detail__content">
          {activeTab === 'info' && <UserInfoTab user={user} />}
          {activeTab === 'investments' && <InvestmentsTab user={user} />}
          {activeTab === 'wallet' && <WalletTab user={user} />}
          {activeTab === 'actions' && <ActionsTab user={user} />}
        </div>
      </div>
    </div>
  );
};

// User Info Tab Component
const UserInfoTab = ({ user }) => {
  return (
    <div className="user-detail-tab">
      <h3 className="user-detail-tab__title">Personal Information</h3>
      <div className="user-detail-tab__section">
        <div className="user-detail-tab__field">
          <label>Full Name</label>
          <p>{user.name}</p>
        </div>
        <div className="user-detail-tab__field">
          <label>Email</label>
          <p>{user.email}</p>
        </div>
        <div className="user-detail-tab__field">
          <label>Phone</label>
          <p>{user.phone}</p>
        </div>
        <div className="user-detail-tab__field">
          <label>Registration Date</label>
          <p>{formatDate(user.registrationDate)}</p>
        </div>
      </div>

      <h3 className="user-detail-tab__title">Bank Details</h3>
      <div className="user-detail-tab__section">
        {user.bankDetails ? (
          <>
            <div className="user-detail-tab__field">
              <label>Account Holder Name</label>
              <p>{user.bankDetails.accountHolderName || '-'}</p>
            </div>
            <div className="user-detail-tab__field">
              <label>Account Number</label>
              <p>{user.bankDetails.accountNumber || '-'}</p>
            </div>
            <div className="user-detail-tab__field">
              <label>IFSC Code</label>
              <p>{user.bankDetails.ifscCode || '-'}</p>
            </div>
          </>
        ) : (
          <p className="user-detail-tab__empty">No bank details available</p>
        )}
      </div>
    </div>
  );
};

// Investments Tab Component
const InvestmentsTab = ({ user }) => {
  const investments = user.investments || [];

  return (
    <div className="user-detail-tab">
      <div className="user-detail-tab__header">
        <h3 className="user-detail-tab__title">Investment History</h3>
        <div className="user-detail-tab__summary">
          <span>Total Investments: <strong>{formatCurrency(user.wallet.totalInvestments)}</strong></span>
          <span>Active: <strong>{investments.filter(inv => inv.status === 'lock-in').length}</strong></span>
          <span>Matured: <strong>{investments.filter(inv => inv.status === 'matured').length}</strong></span>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="user-detail-tab__empty-state">
          <p>No investments found</p>
        </div>
      ) : (
        <div className="user-detail-tab__table-container">
          <table className="user-detail-tab__table">
            <thead>
              <tr>
                <th>Property Name</th>
                <th>Amount Invested</th>
                <th>Purchase Date</th>
                <th>Maturity Date</th>
                <th>Status</th>
                <th>Monthly Earning</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((investment) => (
                <tr key={investment.id}>
                  <td>{investment.propertyName}</td>
                  <td>{formatCurrency(investment.amountInvested)}</td>
                  <td>{formatDate(investment.purchaseDate)}</td>
                  <td>{formatDate(investment.maturityDate)}</td>
                  <td>
                    <StatusBadge status={investment.status} />
                    {investment.daysRemaining > 0 && (
                      <span className="user-detail-tab__days-remaining">
                        ({investment.daysRemaining} days left)
                      </span>
                    )}
                  </td>
                  <td>{formatCurrency(investment.monthlyEarning)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Wallet Tab Component
const WalletTab = ({ user }) => {
  const { updateWallet } = useAdmin();
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [showDebitForm, setShowDebitForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleCredit = (e) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      updateWallet(user.id, 'credit', parseFloat(amount), reason);
      setAmount('');
      setReason('');
      setShowCreditForm(false);
    }
  };

  const handleDebit = (e) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0 && parseFloat(amount) <= user.wallet.balance) {
      updateWallet(user.id, 'debit', parseFloat(amount), reason);
      setAmount('');
      setReason('');
      setShowDebitForm(false);
    }
  };

  return (
    <div className="user-detail-tab">
      <h3 className="user-detail-tab__title">Wallet Overview</h3>
      <div className="user-detail-tab__wallet-cards">
        <div className="user-detail-tab__wallet-card">
          <span className="user-detail-tab__wallet-label">Current Balance</span>
          <span className="user-detail-tab__wallet-value">{formatCurrency(user.wallet.balance)}</span>
        </div>
        <div className="user-detail-tab__wallet-card">
          <span className="user-detail-tab__wallet-label">Total Investments</span>
          <span className="user-detail-tab__wallet-value">{formatCurrency(user.wallet.totalInvestments)}</span>
        </div>
        <div className="user-detail-tab__wallet-card">
          <span className="user-detail-tab__wallet-label">Earnings Received</span>
          <span className="user-detail-tab__wallet-value">{formatCurrency(user.wallet.earningsReceived)}</span>
        </div>
        <div className="user-detail-tab__wallet-card">
          <span className="user-detail-tab__wallet-label">Withdrawable Balance</span>
          <span className="user-detail-tab__wallet-value">{formatCurrency(user.wallet.withdrawableBalance)}</span>
        </div>
      </div>

      <div className="user-detail-tab__wallet-actions">
        <button
          className="user-detail-tab__wallet-btn user-detail-tab__wallet-btn--credit"
          onClick={() => {
            setShowCreditForm(true);
            setShowDebitForm(false);
          }}
        >
          Credit Wallet
        </button>
        <button
          className="user-detail-tab__wallet-btn user-detail-tab__wallet-btn--debit"
          onClick={() => {
            setShowDebitForm(true);
            setShowCreditForm(false);
          }}
        >
          Debit Wallet
        </button>
      </div>

      {/* Credit Form */}
      {showCreditForm && (
        <form className="user-detail-tab__form" onSubmit={handleCredit}>
          <h4>Credit Wallet</h4>
          <div className="user-detail-tab__form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
              min="1"
            />
          </div>
          <div className="user-detail-tab__form-group">
            <label>Reason/Notes</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for credit"
              rows="3"
            />
          </div>
          <div className="user-detail-tab__form-actions">
            <button type="button" onClick={() => setShowCreditForm(false)}>Cancel</button>
            <button type="submit">Credit</button>
          </div>
        </form>
      )}

      {/* Debit Form */}
      {showDebitForm && (
        <form className="user-detail-tab__form" onSubmit={handleDebit}>
          <h4>Debit Wallet</h4>
          <div className="user-detail-tab__form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
              min="1"
              max={user.wallet.balance}
            />
            <small>Available: {formatCurrency(user.wallet.balance)}</small>
          </div>
          <div className="user-detail-tab__form-group">
            <label>Reason/Notes</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for debit"
              rows="3"
              required
            />
          </div>
          <div className="user-detail-tab__form-actions">
            <button type="button" onClick={() => setShowDebitForm(false)}>Cancel</button>
            <button type="submit">Debit</button>
          </div>
        </form>
      )}

      {/* Transaction History */}
      <h3 className="user-detail-tab__title">Transaction History</h3>
      <div className="user-detail-tab__table-container">
        <table className="user-detail-tab__table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {user.transactions && user.transactions.length > 0 ? (
              user.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>
                    <span className={`user-detail-tab__txn-type user-detail-tab__txn-type--${transaction.type}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td>{formatCurrency(transaction.amount)}</td>
                  <td>{transaction.description}</td>
                  <td>
                    <StatusBadge status={transaction.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="user-detail-tab__empty">No transactions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Actions Tab Component
const ActionsTab = ({ user }) => {
  const { toggleUserAccountStatus } = useAdmin();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState(null);

  const handleAction = (type) => {
    setActionType(type);
    setShowConfirmDialog(true);
  };

  const confirmAction = () => {
    if (actionType) {
      toggleUserAccountStatus(user.id, actionType);
      setShowConfirmDialog(false);
      setActionType(null);
    }
  };

  const getActionLabel = (type) => {
    const labels = {
      lock: 'Lock Account',
      unlock: 'Unlock Account',
      suspend: 'Suspend Account',
      delete: 'Delete Account',
    };
    return labels[type] || type;
  };

  return (
    <div className="user-detail-tab">
      <h3 className="user-detail-tab__title">Account Actions</h3>
      <div className="user-detail-tab__actions-grid">
        {user.accountStatus === 'active' ? (
          <>
            <button
              className="user-detail-tab__action-btn user-detail-tab__action-btn--warning"
              onClick={() => handleAction('lock')}
            >
              🔒 Lock Account
            </button>
            <button
              className="user-detail-tab__action-btn user-detail-tab__action-btn--warning"
              onClick={() => handleAction('suspend')}
            >
              ⏸️ Suspend Account
            </button>
          </>
        ) : user.accountStatus === 'locked' ? (
          <button
            className="user-detail-tab__action-btn user-detail-tab__action-btn--success"
            onClick={() => handleAction('unlock')}
          >
            🔓 Unlock Account
          </button>
        ) : (
          <button
            className="user-detail-tab__action-btn user-detail-tab__action-btn--success"
            onClick={() => handleAction('unlock')}
          >
            ✅ Activate Account
          </button>
        )}
        <button
          className="user-detail-tab__action-btn user-detail-tab__action-btn--danger"
          onClick={() => handleAction('delete')}
        >
          🗑️ Delete Account
        </button>
      </div>

      {showConfirmDialog && (
        <div className="user-detail-tab__confirm-overlay">
          <div className="user-detail-tab__confirm-dialog">
            <h4>Confirm Action</h4>
            <p>Are you sure you want to {getActionLabel(actionType).toLowerCase()} for {user.name}?</p>
            <div className="user-detail-tab__confirm-actions">
              <button onClick={() => setShowConfirmDialog(false)}>Cancel</button>
              <button
                className={actionType === 'delete' ? 'user-detail-tab__confirm-btn--danger' : ''}
                onClick={confirmAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;

