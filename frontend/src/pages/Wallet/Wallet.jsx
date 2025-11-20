import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";

const Wallet = () => {
  const { wallet, holdings, listings, loading, error } = useAppState();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // overview, transactions, investments
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: 0,
    bankAccount: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    acceptTerms: false,
  });
  const [withdrawErrors, setWithdrawErrors] = useState({});

  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // Generate transactions from holdings
  const transactions = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];
    
    const txs = [];
    holdings.forEach((holding) => {
      const holdingId = holding._id || holding.id;
      const propertyId = holding.propertyId?._id || holding.propertyId || holding.property;
      const property = listings.find((p) => (p._id || p.id) === propertyId);
      const propertyName = holding.name || property?.title || "Property";
      
      // Investment transaction
      txs.push({
        id: `inv-${holdingId}`,
        date: holding.purchaseDate,
        type: "investment",
        amount: holding.amountInvested || 0,
        description: `Investment in ${propertyName}`,
        status: "completed",
        propertyId: propertyId,
        holdingId: holdingId,
      });

      // Earnings transactions (monthly)
      if (holding.totalEarningsReceived > 0) {
        const monthsSincePurchase = Math.floor((new Date() - new Date(holding.purchaseDate)) / (1000 * 60 * 60 * 24 * 30));
        for (let i = 1; i <= monthsSincePurchase && i <= (holding.lockInMonths || 3); i++) {
          const earningDate = new Date(holding.purchaseDate);
          earningDate.setMonth(earningDate.getMonth() + i);
          txs.push({
            id: `earn-${holdingId}-${i}`,
            date: earningDate.toISOString().split("T")[0],
            type: "earning",
            amount: holding.monthlyEarning || (holding.amountInvested || 0) * 0.005,
            description: `Monthly earning from ${propertyName}`,
            status: "completed",
            propertyId: propertyId,
            holdingId: holdingId,
          });
        }
      }
    });

    // Sort by date (newest first)
    return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [holdings, listings]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        totalEarnings: 0,
        totalInvested: 0,
        maturedInvestments: 0,
        activeInvestments: 0,
      };
    }
    
    const totalEarnings = holdings.reduce((sum, h) => sum + (h.totalEarningsReceived || 0), 0);
    const totalInvested = holdings.reduce((sum, h) => sum + (h.amountInvested || 0), 0);
    const maturedInvestments = holdings.filter((h) => h.status === "matured").length;
    
    return {
      totalEarnings,
      totalInvested,
      maturedInvestments,
      activeInvestments: holdings.length - maturedInvestments,
    };
  }, [holdings]);

  // Show loading state
  if (loading) {
    return (
      <div className="wallet-page">
        <div className="wallet-page__container">
          <div className="wallet-page__header">
            <h1 className="wallet-page__title">My Wallet</h1>
            <p className="wallet-page__subtitle">Manage your investments and transactions</p>
          </div>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading wallet data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="wallet-page">
        <div className="wallet-page__container">
          <div className="wallet-page__header">
            <h1 className="wallet-page__title">My Wallet</h1>
            <p className="wallet-page__subtitle">Manage your investments and transactions</p>
          </div>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Error loading wallet: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure wallet has default values
  const walletData = wallet || {
    currency: "INR",
    balance: 0,
    totalInvestments: 0,
    earningsReceived: 0,
    withdrawableBalance: 0,
    lockedAmount: 0,
  };

  return (
    <div className="wallet-page">
      <div className="wallet-page__container">
        {/* Header */}
        <div className="wallet-page__header">
          <h1 className="wallet-page__title">My Wallet</h1>
          <p className="wallet-page__subtitle">Manage your investments and transactions</p>
        </div>

        {/* Tabs */}
        <div className="wallet-page__tabs">
          <button
            className={`wallet-page__tab ${activeTab === "overview" ? "wallet-page__tab--active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`wallet-page__tab ${activeTab === "transactions" ? "wallet-page__tab--active" : ""}`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
          <button
            className={`wallet-page__tab ${activeTab === "investments" ? "wallet-page__tab--active" : ""}`}
            onClick={() => setActiveTab("investments")}
          >
            Investments
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="wallet-page__content">
            <div className="wallet-page__stats-grid">
              <div className="wallet-page__stat-card">
                <div className="wallet-page__stat-icon wallet-page__stat-icon--blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="wallet-page__stat-info">
                  <span className="wallet-page__stat-label">Active Investments</span>
                  <span className="wallet-page__stat-value">{stats.activeInvestments}</span>
                </div>
              </div>

              <div className="wallet-page__stat-card">
                <div className="wallet-page__stat-icon wallet-page__stat-icon--green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="wallet-page__stat-info">
                  <span className="wallet-page__stat-label">Matured Investments</span>
                  <span className="wallet-page__stat-value">{stats.maturedInvestments}</span>
                </div>
              </div>

              <div className="wallet-page__stat-card">
                <div className="wallet-page__stat-icon wallet-page__stat-icon--purple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="wallet-page__stat-info">
                  <span className="wallet-page__stat-label">Total Invested</span>
                  <span className="wallet-page__stat-value">{formatCurrency(stats.totalInvested, walletData.currency)}</span>
                </div>
              </div>

              <div className="wallet-page__stat-card">
                <div className="wallet-page__stat-icon wallet-page__stat-icon--orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="wallet-page__stat-info">
                  <span className="wallet-page__stat-label">Total Earnings</span>
                  <span className="wallet-page__stat-value wallet-page__stat-value--green">
                    {formatCurrency(stats.totalEarnings, walletData.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="wallet-page__quick-actions">
              <button className="wallet-page__action-btn wallet-page__action-btn--primary" onClick={() => navigate("/explore")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Invest Now
              </button>
              <button className="wallet-page__action-btn wallet-page__action-btn--outline" onClick={() => navigate("/withdraw-info")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 10H21M7 15H12M16 19H21M3 5H21M3 15H21M3 19H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Withdraw Funds
              </button>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="wallet-page__content">
            <div className="wallet-page__table-container">
              <div className="wallet-page__table-header">
                <span className="wallet-page__table-header-item">Date</span>
                <span className="wallet-page__table-header-item">Type</span>
                <span className="wallet-page__table-header-item">Description</span>
                <span className="wallet-page__table-header-item">Amount</span>
                <span className="wallet-page__table-header-item">Status</span>
              </div>
              <div className="wallet-page__table-body">
                {transactions.length === 0 ? (
                  <div className="wallet-page__empty">
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="wallet-page__table-row wallet-page__table-row--clickable" onClick={() => tx.holdingId && navigate(`/holding/${tx.holdingId}`)}>
                      <span className="wallet-page__table-cell" data-label="Date">{formatDate(tx.date)}</span>
                      <span className="wallet-page__table-cell" data-label="Type">
                        <span className={`wallet-page__type-badge wallet-page__type-badge--${tx.type}`}>
                          {tx.type === "investment" ? "Investment" : "Earning"}
                        </span>
                      </span>
                      <span className="wallet-page__table-cell wallet-page__table-cell--description" data-label="Description">{tx.description}</span>
                      <span className={`wallet-page__table-cell wallet-page__table-cell--amount ${tx.type === "earning" ? "wallet-page__table-cell--green" : ""}`} data-label="Amount">
                        {tx.type === "earning" ? "+" : "-"}
                        {formatCurrency(tx.amount, walletData.currency)}
                      </span>
                      <span className="wallet-page__table-cell" data-label="Status">
                        <span className={`wallet-page__status-badge wallet-page__status-badge--${tx.status}`}>
                          {tx.status === "completed" ? "Completed" : tx.status}
                        </span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Investments Tab */}
        {activeTab === "investments" && (
          <div className="wallet-page__content">
            <div className="wallet-page__table-container">
              <div className="wallet-page__table-header wallet-page__table-header--investments">
                <span className="wallet-page__table-header-item">Property</span>
                <span className="wallet-page__table-header-item">Invested</span>
                <span className="wallet-page__table-header-item">Earnings</span>
                <span className="wallet-page__table-header-item">Status</span>
                <span className="wallet-page__table-header-item">Maturity</span>
                <span className="wallet-page__table-header-item">Action</span>
              </div>
              <div className="wallet-page__table-body">
                {holdings.length === 0 ? (
                  <div className="wallet-page__empty">
                    <p>No investments yet. Start investing to see your holdings here.</p>
                    <button className="wallet-page__empty-btn" onClick={() => navigate("/explore")}>
                      Browse Properties
                    </button>
                  </div>
                ) : (
                  holdings.map((holding) => {
                    const isMatured = holding.status === "matured" || holding.daysRemaining === 0;
                    return (
                      <div key={holding._id || holding.id} className="wallet-page__table-row wallet-page__table-row--clickable wallet-page__table-row--investments" onClick={() => navigate(`/holding/${holding._id || holding.id}`)}>
                        <span className="wallet-page__table-cell wallet-page__table-cell--property" data-label="Property">
                          <span className="wallet-page__property-name">{holding.name}</span>
                        </span>
                        <span className="wallet-page__table-cell" data-label="Invested">{formatCurrency(holding.amountInvested || 0, walletData.currency)}</span>
                        <span className="wallet-page__table-cell wallet-page__table-cell--green" data-label="Earnings">
                          {formatCurrency(holding.totalEarningsReceived || 0, walletData.currency)}
                        </span>
                        <span className="wallet-page__table-cell" data-label="Status">
                          <span className={`wallet-page__status-badge ${isMatured ? "wallet-page__status-badge--matured" : "wallet-page__status-badge--locked"}`}>
                            {isMatured ? "Matured" : "Locked"}
                          </span>
                        </span>
                        <span className="wallet-page__table-cell" data-label="Maturity">{formatDate(holding.maturityDate)}</span>
                        <span className="wallet-page__table-cell" data-label="Action">
                          <button
                            className="wallet-page__view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/holding/${holding.id}`);
                            }}
                          >
                            View
                          </button>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="withdraw-modal-overlay" onClick={() => setShowWithdrawModal(false)}>
            <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
              <div className="withdraw-modal__header">
                <h2 className="withdraw-modal__title">Withdraw Funds</h2>
                <button className="withdraw-modal__close" onClick={() => setShowWithdrawModal(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="withdraw-modal__content">
                {/* Withdrawable Balance Info */}
                <div className="withdraw-modal__balance-info">
                  <div className="withdraw-modal__balance-item">
                    <span className="withdraw-modal__balance-label">Available Balance</span>
                    <span className="withdraw-modal__balance-value">{formatCurrency(walletData.balance, walletData.currency)}</span>
                  </div>
                  <div className="withdraw-modal__balance-item">
                    <span className="withdraw-modal__balance-label">Withdrawable Amount</span>
                    <span className="withdraw-modal__balance-value withdraw-modal__balance-value--green">
                      {formatCurrency(walletData.withdrawableBalance, walletData.currency)}
                    </span>
                  </div>
                </div>

                {/* Withdrawal Form */}
                <form
                  className="withdraw-modal__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Validate and submit withdrawal
                    const errors = {};
                    if (!withdrawForm.amount || withdrawForm.amount <= 0) {
                      errors.amount = "Please enter a valid amount";
                    } else if (withdrawForm.amount > walletData.withdrawableBalance) {
                      errors.amount = `Maximum withdrawable amount is ${formatCurrency(walletData.withdrawableBalance, walletData.currency)}`;
                    }
                    if (!withdrawForm.accountNumber) {
                      errors.accountNumber = "Account number is required";
                    }
                    if (!withdrawForm.ifscCode) {
                      errors.ifscCode = "IFSC code is required";
                    }
                    if (!withdrawForm.accountHolderName) {
                      errors.accountHolderName = "Account holder name is required";
                    }
                    if (!withdrawForm.acceptTerms) {
                      errors.acceptTerms = "You must accept the terms";
                    }

                    if (Object.keys(errors).length === 0) {
                      // Handle withdrawal submission
                      console.log("Withdrawal submitted:", withdrawForm);
                      alert("Withdrawal request submitted successfully! It will be processed within 2-3 business days.");
                      setShowWithdrawModal(false);
                      setWithdrawForm({
                        amount: 0,
                        bankAccount: "",
                        accountNumber: "",
                        ifscCode: "",
                        accountHolderName: "",
                        acceptTerms: false,
                      });
                    } else {
                      setWithdrawErrors(errors);
                    }
                  }}
                >
                  {/* Amount */}
                  <div className="withdraw-modal__field">
                    <label htmlFor="withdraw-amount" className="withdraw-modal__label">
                      Withdrawal Amount (₹) <span className="withdraw-modal__required">*</span>
                    </label>
                    <input
                      id="withdraw-amount"
                      type="number"
                      min="1"
                      max={walletData.withdrawableBalance}
                      step="100"
                      value={withdrawForm.amount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setWithdrawForm({ ...withdrawForm, amount: value });
                        if (withdrawErrors.amount) {
                          setWithdrawErrors({ ...withdrawErrors, amount: null });
                        }
                      }}
                      className={`withdraw-modal__input ${withdrawErrors.amount ? "withdraw-modal__input--error" : ""}`}
                      placeholder="Enter amount to withdraw"
                    />
                    {withdrawErrors.amount && <span className="withdraw-modal__error">{withdrawErrors.amount}</span>}
                    <span className="withdraw-modal__hint">
                      Maximum: {formatCurrency(walletData.withdrawableBalance, walletData.currency)}
                    </span>
                  </div>

                  {/* Bank Account Selection */}
                  <div className="withdraw-modal__field">
                    <label htmlFor="bank-account" className="withdraw-modal__label">
                      Select Bank Account <span className="withdraw-modal__required">*</span>
                    </label>
                    <select
                      id="bank-account"
                      value={withdrawForm.bankAccount}
                      onChange={(e) => {
                        setWithdrawForm({ ...withdrawForm, bankAccount: e.target.value });
                        // Auto-fill if saved account selected
                        if (e.target.value === "saved") {
                          setWithdrawForm({
                            ...withdrawForm,
                            bankAccount: "saved",
                            accountNumber: "1234567890",
                            ifscCode: "HDFC0001234",
                            accountHolderName: "Yunus Ahmed",
                          });
                        }
                      }}
                      className={`withdraw-modal__input withdraw-modal__input--select ${withdrawErrors.bankAccount ? "withdraw-modal__input--error" : ""}`}
                    >
                      <option value="">Select bank account</option>
                      <option value="saved">Saved Account (HDFC Bank - ****7890)</option>
                      <option value="new">Add New Account</option>
                    </select>
                    {withdrawErrors.bankAccount && <span className="withdraw-modal__error">{withdrawErrors.bankAccount}</span>}
                  </div>

                  {/* Account Number */}
                  <div className="withdraw-modal__field">
                    <label htmlFor="account-number" className="withdraw-modal__label">
                      Account Number <span className="withdraw-modal__required">*</span>
                    </label>
                    <input
                      id="account-number"
                      type="text"
                      value={withdrawForm.accountNumber}
                      onChange={(e) => {
                        setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value });
                        if (withdrawErrors.accountNumber) {
                          setWithdrawErrors({ ...withdrawErrors, accountNumber: null });
                        }
                      }}
                      className={`withdraw-modal__input ${withdrawErrors.accountNumber ? "withdraw-modal__input--error" : ""}`}
                      placeholder="Enter account number"
                      maxLength={18}
                    />
                    {withdrawErrors.accountNumber && <span className="withdraw-modal__error">{withdrawErrors.accountNumber}</span>}
                  </div>

                  {/* IFSC Code */}
                  <div className="withdraw-modal__field">
                    <label htmlFor="ifsc-code" className="withdraw-modal__label">
                      IFSC Code <span className="withdraw-modal__required">*</span>
                    </label>
                    <input
                      id="ifsc-code"
                      type="text"
                      value={withdrawForm.ifscCode}
                      onChange={(e) => {
                        setWithdrawForm({ ...withdrawForm, ifscCode: e.target.value.toUpperCase() });
                        if (withdrawErrors.ifscCode) {
                          setWithdrawErrors({ ...withdrawErrors, ifscCode: null });
                        }
                      }}
                      className={`withdraw-modal__input ${withdrawErrors.ifscCode ? "withdraw-modal__input--error" : ""}`}
                      placeholder="Enter IFSC code"
                      maxLength={11}
                      style={{ textTransform: "uppercase" }}
                    />
                    {withdrawErrors.ifscCode && <span className="withdraw-modal__error">{withdrawErrors.ifscCode}</span>}
                  </div>

                  {/* Account Holder Name */}
                  <div className="withdraw-modal__field">
                    <label htmlFor="account-holder" className="withdraw-modal__label">
                      Account Holder Name <span className="withdraw-modal__required">*</span>
                    </label>
                    <input
                      id="account-holder"
                      type="text"
                      value={withdrawForm.accountHolderName}
                      onChange={(e) => {
                        setWithdrawForm({ ...withdrawForm, accountHolderName: e.target.value });
                        if (withdrawErrors.accountHolderName) {
                          setWithdrawErrors({ ...withdrawErrors, accountHolderName: null });
                        }
                      }}
                      className={`withdraw-modal__input ${withdrawErrors.accountHolderName ? "withdraw-modal__input--error" : ""}`}
                      placeholder="Enter account holder name"
                    />
                    {withdrawErrors.accountHolderName && <span className="withdraw-modal__error">{withdrawErrors.accountHolderName}</span>}
                  </div>

                  {/* Withdrawal Summary */}
                  <div className="withdraw-modal__summary">
                    <h3 className="withdraw-modal__summary-title">Withdrawal Summary</h3>
                    <div className="withdraw-modal__summary-item">
                      <span className="withdraw-modal__summary-label">Withdrawal Amount</span>
                      <span className="withdraw-modal__summary-value">
                        {withdrawForm.amount > 0 ? formatCurrency(withdrawForm.amount, walletData.currency) : "₹0"}
                      </span>
                    </div>
                    <div className="withdraw-modal__summary-item">
                      <span className="withdraw-modal__summary-label">Processing Fee</span>
                      <span className="withdraw-modal__summary-value">Free</span>
                    </div>
                    <div className="withdraw-modal__summary-item withdraw-modal__summary-item--total">
                      <span className="withdraw-modal__summary-label">Amount to be Credited</span>
                      <span className="withdraw-modal__summary-value withdraw-modal__summary-value--highlight">
                        {withdrawForm.amount > 0 ? formatCurrency(withdrawForm.amount, walletData.currency) : "₹0"}
                      </span>
                    </div>
                    <div className="withdraw-modal__summary-note">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Withdrawal will be processed within 2-3 business days</span>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="withdraw-modal__field">
                    <label className={`withdraw-modal__checkbox-label ${withdrawErrors.acceptTerms ? "withdraw-modal__checkbox-label--error" : ""}`}>
                      <input
                        type="checkbox"
                        checked={withdrawForm.acceptTerms}
                        onChange={(e) => {
                          setWithdrawForm({ ...withdrawForm, acceptTerms: e.target.checked });
                          if (withdrawErrors.acceptTerms) {
                            setWithdrawErrors({ ...withdrawErrors, acceptTerms: null });
                          }
                        }}
                        className="withdraw-modal__checkbox"
                      />
                      <span>
                        I confirm that the bank account details are correct and I authorize the withdrawal <span className="withdraw-modal__required">*</span>
                      </span>
                    </label>
                    {withdrawErrors.acceptTerms && <span className="withdraw-modal__error">{withdrawErrors.acceptTerms}</span>}
                  </div>

                  {/* Action Buttons */}
                  <div className="withdraw-modal__actions">
                    <button type="button" className="withdraw-modal__btn withdraw-modal__btn--cancel" onClick={() => setShowWithdrawModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="withdraw-modal__btn withdraw-modal__btn--submit">
                      Confirm Withdrawal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
