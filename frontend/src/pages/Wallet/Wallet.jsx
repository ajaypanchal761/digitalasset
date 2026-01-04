import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { investmentRequestAPI, transferRequestAPI, walletAPI, withdrawalAPI, profileAPI } from "../../services/api.js";

const Wallet = () => {
  const { wallet, holdings, listings, loading, error } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview"); // overview, transactions, investments, requests
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [investmentRequests, setInvestmentRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: 0,
    bankAccount: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    acceptTerms: false,
  });
  const [withdrawErrors, setWithdrawErrors] = useState({});
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef(null);
  const [userBankDetails, setUserBankDetails] = useState(null);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target)) {
        setIsBankDropdownOpen(false);
      }
    };

    if (isBankDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBankDropdownOpen]);

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

  // Fetch investment requests
  useEffect(() => {
    const fetchInvestmentRequests = async () => {
      if (activeTab === "requests") {
        setLoadingRequests(true);
        try {
          const response = await investmentRequestAPI.getAll();
          if (response.success) {
            setInvestmentRequests(response.data || []);
          }
        } catch (error) {
          console.error("Error fetching investment requests:", error);
        } finally {
          setLoadingRequests(false);
        }
      }
    };
    fetchInvestmentRequests();
  }, [activeTab]);

  // Fetch user bank details
  useEffect(() => {
    const fetchBankDetails = async () => {
      setLoadingBankDetails(true);
      try {
        const response = await profileAPI.get();
        if (response.success && response.data?.bankDetails) {
          setUserBankDetails(response.data.bankDetails);
        }
      } catch (error) {
        console.error("Error fetching bank details:", error);
      } finally {
        setLoadingBankDetails(false);
      }
    };

    fetchBankDetails();
  }, []);

  // Open withdraw modal when navigated from a holding (e.g. "Withdraw Earnings" button)
  useEffect(() => {
    if (location.state && location.state.openWithdrawModal) {
      setShowWithdrawModal(true);

      // Optionally prefill amount if provided
      if (location.state.prefillAmount) {
        setWithdrawForm((prev) => ({
          ...prev,
          amount: location.state.prefillAmount,
        }));
      }
    }
  }, [location.state]);


  // Fetch transactions from backend API
  useEffect(() => {
    const fetchTransactions = async () => {
      if (activeTab === "transactions") {
        setLoadingTransactions(true);
        try {
          const response = await walletAPI.getTransactions();
          if (response.success) {
            setTransactions(response.data || []);
          } else {
            setTransactions([]);
          }
        } catch (error) {
          console.error("Error fetching transactions:", error);
          setTransactions([]);
        } finally {
          setLoadingTransactions(false);
        }
      }
    };
    fetchTransactions();
  }, [activeTab]);

  // Calculate summary stats
  const stats = useMemo(() => {
    // Use wallet.earningsReceived for total earnings (matches "Earnings Received" field)
    const totalEarnings = wallet?.earningsReceived || 0;
    
    if (!holdings || holdings.length === 0) {
      return {
        totalEarnings,
        totalInvested: 0,
        maturedInvestments: 0,
        activeInvestments: 0,
      };
    }
    
    const totalInvested = holdings.reduce((sum, h) => sum + (h.amountInvested || 0), 0);
    const maturedInvestments = holdings.filter((h) => h.status === "matured").length;
    
    return {
      totalEarnings,
      totalInvested,
      maturedInvestments,
      activeInvestments: holdings.length - maturedInvestments,
    };
  }, [holdings, wallet]);


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

  // For current flow we only support earnings withdrawals from wallet.
  // Backend validates earnings withdrawals against wallet.earningsReceived,
  // so we align the front-end max amount with the same value to avoid
  // allowing amounts that the backend would later reject.
  const maxEarningsWithdrawAmount = walletData.earningsReceived || 0;

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
          <button
            className={`wallet-page__tab ${activeTab === "requests" ? "wallet-page__tab--active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Requests
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="wallet-page__content">
            <div className="wallet-page__stats-grid">
              <div 
                className="wallet-page__stat-card wallet-page__stat-card--clickable"
                onClick={() => navigate("/wallet/active-investments")}
              >
                <div className="wallet-page__stat-icon wallet-page__stat-icon--blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="wallet-page__stat-info">
                  <span className="wallet-page__stat-label">Active Investments</span>
                  <span className="wallet-page__stat-value">
                    {stats.activeInvestments}
                  </span>
                </div>
              </div>

              <div 
                className="wallet-page__stat-card wallet-page__stat-card--clickable"
                onClick={() => navigate("/wallet/matured-investments")}
              >
                <div className="wallet-page__stat-icon wallet-page__stat-icon--green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="wallet-page__stat-info">
                  <span className="wallet-page__stat-label">Matured Investments</span>
                  <span className="wallet-page__stat-value">
                    {stats.maturedInvestments}
                  </span>
                </div>
              </div>

              <div 
                className="wallet-page__stat-card wallet-page__stat-card--clickable"
                onClick={() => navigate("/wallet/investments")}
              >
                <div className="wallet-page__stat-icon wallet-page__stat-icon--purple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="wallet-page__stat-info">
                  <span className="wallet-page__stat-label">Total Invested</span>
                  <span className="wallet-page__stat-value">
                    {formatCurrency(stats.totalInvested, walletData.currency)}
                  </span>
                </div>
              </div>

              <div 
                className="wallet-page__stat-card wallet-page__stat-card--clickable"
                onClick={() => navigate("/wallet/earnings")}
              >
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

            {/* Monthly Payouts Section */}
            <div className="wallet-page__payout-section">
              <h2 className="wallet-page__section-title">Monthly Payouts</h2>
              <div className="wallet-page__payout-cards">
                {holdings && holdings.length > 0 ? (
                  holdings
                    .filter(h => h.status === 'lock-in' || h.status === 'matured')
                    .map((holding) => {
                      const holdingId = holding._id || holding.id;
                      const propertyId = holding.propertyId?._id || holding.propertyId;
                      const property = listings.find((p) => (p._id || p.id) === propertyId);
                      const propertyName = property?.title || holding.name || 'Property';
                      
                      // Calculate next payout date (1st of next month from purchase date)
                      const calculateNextPayoutDate = (purchaseDate) => {
                        if (!purchaseDate) return null;
                        const purchase = new Date(purchaseDate);
                        const nextPayout = new Date(purchase);
                        nextPayout.setMonth(nextPayout.getMonth() + 1);
                        nextPayout.setDate(1); // Set to 1st of next month
                        return nextPayout;
                      };

                      const nextPayoutDate = calculateNextPayoutDate(holding.purchaseDate);
                      const monthlyEarning = holding.monthlyEarning || (holding.amountInvested || 0) * 0.005;
                      const isPayoutDue = nextPayoutDate && new Date() >= nextPayoutDate;

                      return (
                        <div key={holdingId} className="wallet-page__payout-card">
                          <div className="wallet-page__payout-card-header">
                            <h3 className="wallet-page__payout-property">{propertyName}</h3>
                            <span className={`wallet-page__payout-badge ${isPayoutDue ? 'wallet-page__payout-badge--due' : ''}`}>
                              {isPayoutDue ? 'Due' : 'Upcoming'}
                            </span>
                          </div>
                          <div className="wallet-page__payout-details">
                            <div className="wallet-page__payout-detail-item">
                              <span className="wallet-page__payout-label">Next Payout Date:</span>
                              <span className="wallet-page__payout-value">
                                {nextPayoutDate ? formatDate(nextPayoutDate.toISOString()) : 'N/A'}
                              </span>
                            </div>
                            <div className="wallet-page__payout-detail-item">
                              <span className="wallet-page__payout-label">Monthly Amount:</span>
                              <span className="wallet-page__payout-value wallet-page__payout-value--green">
                                {formatCurrency(monthlyEarning, walletData.currency)}
                              </span>
                            </div>
                            <div className="wallet-page__payout-detail-item">
                              <span className="wallet-page__payout-label">Investment:</span>
                              <span className="wallet-page__payout-value">
                                {formatCurrency(holding.amountInvested || 0, walletData.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="wallet-page__payout-empty">
                    <p>No active investments for monthly payouts</p>
                  </div>
                )}
              </div>
            </div>

            {/* Buy Requests Summary Card */}

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
            {loadingTransactions ? (
              <div className="wallet-page__empty">
                <p>Loading transactions...</p>
              </div>
            ) : (
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
                    transactions.map((tx) => {
                      const transactionId = tx._id || tx.id;
                      const transactionDate = tx.createdAt || tx.date;
                      const isPositive = tx.type === "earning" || tx.type === "credit";
                      const isNegative = tx.type === "investment" || tx.type === "debit" || tx.type === "withdrawal";
                      
                      // Format type for display
                      const typeDisplay = {
                        investment: "Investment",
                        earning: "Earning",
                        withdrawal: "Withdrawal",
                        credit: "Credit",
                        debit: "Debit"
                      }[tx.type] || tx.type;

                      return (
                        <div 
                          key={transactionId} 
                          className="wallet-page__table-row wallet-page__table-row--clickable" 
                          onClick={() => tx.holdingId && navigate(`/holding/${tx.holdingId}`)}
                        >
                          <span className="wallet-page__table-cell" data-label="Date">
                            {formatDate(transactionDate)}
                          </span>
                          <span className="wallet-page__table-cell" data-label="Type">
                            <span className={`wallet-page__type-badge wallet-page__type-badge--${tx.type}`}>
                              {typeDisplay}
                            </span>
                          </span>
                          <span className="wallet-page__table-cell wallet-page__table-cell--description" data-label="Description">
                            {tx.description}
                          </span>
                          <span 
                            className={`wallet-page__table-cell wallet-page__table-cell--amount ${isPositive ? "wallet-page__table-cell--green" : ""}`} 
                            data-label="Amount"
                          >
                            {isPositive ? "+" : isNegative ? "-" : ""}
                            {formatCurrency(tx.amount, walletData.currency)}
                          </span>
                          <span className="wallet-page__table-cell" data-label="Status">
                            <span className={`wallet-page__status-badge wallet-page__status-badge--${tx.status}`}>
                              {tx.status === "completed" ? "Completed" : tx.status === "pending" ? "Pending" : tx.status === "failed" ? "Failed" : tx.status}
                            </span>
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
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
                    const holdingId = holding._id || holding.id;
                    
                    // Get property ID (handle both populated and unpopulated cases)
                    const propertyId = holding.propertyId?._id || holding.propertyId?.id || holding.propertyId || holding.property;
                    
                    // Get property name - check populated propertyId first, then listings
                    let propertyName = "Unknown Property";
                    if (holding.propertyId && typeof holding.propertyId === 'object' && holding.propertyId.title) {
                      // Property is populated from backend
                      propertyName = holding.propertyId.title;
                    } else {
                      // Try to find property from listings
                      const property = listings.find((p) => {
                        const pId = p._id || p.id;
                        return pId && propertyId && (pId.toString() === propertyId.toString());
                      });
                      propertyName = property?.title || "Unknown Property";
                    }
                    
                    return (
                      <div key={holdingId} className="wallet-page__table-row wallet-page__table-row--clickable wallet-page__table-row--investments" onClick={() => navigate(`/holding/${holdingId}`)}>
                        <span className="wallet-page__table-cell wallet-page__table-cell--property" data-label="Property">
                          <span className="wallet-page__property-name">{propertyName}</span>
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
                              navigate(`/holding/${holdingId}`);
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

        {/* Investment Requests Tab */}
        {activeTab === "requests" && (
          <div className="wallet-page__content">
            <div className="wallet-page__requests-section">
              <h2 className="wallet-page__section-title">My Investment Requests</h2>
              {loadingRequests ? (
                <div className="wallet-page__empty">
                  <p>Loading investment requests...</p>
                </div>
              ) : investmentRequests.length === 0 ? (
                <div className="wallet-page__empty">
                  <p>No investment requests yet. Submit a request to get started.</p>
                  <button className="wallet-page__empty-btn" onClick={() => navigate("/explore")}>
                    Browse Properties
                  </button>
                </div>
              ) : (
                <div className="wallet-page__requests-list">
                  {investmentRequests.map((request) => {
                    const property = request.propertyId;
                    const status = request.status;
                    const isRejected = status === "rejected";
                    const isPending = status === "pending";
                    const isApproved = status === "approved";

                    return (
                      <div key={request._id || request.id} className="wallet-page__request-card">
                        <div className="wallet-page__request-header">
                          <div className="wallet-page__request-info">
                            <h3 className="wallet-page__request-property">
                              {property?.title || "Unknown Property"}
                            </h3>
                            <span className="wallet-page__request-date">
                              {formatDate(request.createdAt)}
                            </span>
                          </div>
                          <span
                            className={`wallet-page__request-status wallet-page__request-status--${status}`}
                          >
                            {status === "pending" && "Pending"}
                            {status === "approved" && "Approved"}
                            {status === "rejected" && "Rejected"}
                          </span>
                        </div>

                        <div className="wallet-page__request-details">
                          <div className="wallet-page__request-detail-row">
                            <span className="wallet-page__request-label">Investment Amount:</span>
                            <span className="wallet-page__request-value">
                              {formatCurrency(request.amountInvested, walletData.currency)}
                            </span>
                          </div>
                          <div className="wallet-page__request-detail-row">
                            <span className="wallet-page__request-label">Investment Period:</span>
                            <span className="wallet-page__request-value">
                              {request.timePeriod} months
                            </span>
                          </div>
                          {isApproved && request.approvedAt && (
                            <div className="wallet-page__request-detail-row">
                              <span className="wallet-page__request-label">Approved On:</span>
                              <span className="wallet-page__request-value">
                                {formatDate(request.approvedAt)}
                              </span>
                            </div>
                          )}
                          {isRejected && request.rejectedAt && (
                            <div className="wallet-page__request-detail-row">
                              <span className="wallet-page__request-label">Rejected On:</span>
                              <span className="wallet-page__request-value">
                                {formatDate(request.rejectedAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Rejection Reason Section */}
                        {isRejected && request.adminNotes && (
                          <div className="wallet-page__rejection-section">
                            <div className="wallet-page__rejection-header">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              <h4 className="wallet-page__rejection-title">Rejection Reason</h4>
                            </div>
                            <div className="wallet-page__rejection-content">
                              <p>{request.adminNotes}</p>
                            </div>
                          </div>
                        )}

                        {/* Admin Notes for Approved Requests (if any) */}
                        {isApproved && request.adminNotes && (
                          <div className="wallet-page__admin-notes-section">
                            <div className="wallet-page__admin-notes-header">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                              <h4 className="wallet-page__admin-notes-title">Admin Notes</h4>
                            </div>
                            <div className="wallet-page__admin-notes-content">
                              <p>{request.adminNotes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
                  {walletData.earningsReceived > 0 && (
                    <div className="withdraw-modal__balance-item">
                      <span className="withdraw-modal__balance-label">Withdrawable Earning</span>
                      <span className="withdraw-modal__balance-value withdraw-modal__balance-value--green">
                        {formatCurrency(walletData.earningsReceived, walletData.currency)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Withdrawal Form */}
                <form
                  className="withdraw-modal__form"
                  onSubmit={async (e) => {
                    e.preventDefault();

                    // Validate form fields
                    const errors = {};
                    if (!withdrawForm.amount || withdrawForm.amount <= 0) {
                      errors.amount = "Please enter a valid amount";
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

                    if (Object.keys(errors).length > 0) {
                      setWithdrawErrors(errors);
                      return;
                    }

                    // Build payload for withdrawal API
                    const payload = {
                      amount: withdrawForm.amount,
                      // Current flow is for earnings withdrawals
                      type: "earnings",
                      bankDetails: {
                        accountNumber: withdrawForm.accountNumber,
                        ifscCode: withdrawForm.ifscCode,
                        accountHolderName: withdrawForm.accountHolderName,
                        bankName:
                          withdrawForm.bankAccount === "saved"
                            ? "Saved Bank Account"
                            : "Custom Bank",
                      },
                    };

                    try {
                      const response = await withdrawalAPI.create(payload);

                      if (response && response.success === false) {
                        throw new Error(response.message || "Withdrawal request failed");
                      }

                      showToast(
                        "Withdrawal request submitted successfully! It will be processed within 2-3 business days.",
                        "success"
                      );

                      setShowWithdrawModal(false);
                      setWithdrawForm({
                        amount: 0,
                        bankAccount: "",
                        accountNumber: "",
                        ifscCode: "",
                        accountHolderName: "",
                        acceptTerms: false,
                      });
                    } catch (error) {
                      console.error("Error submitting withdrawal:", error);
                      showToast(
                        error.message || "Failed to submit withdrawal request. Please try again.",
                        "error"
                      );
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
                  </div>

                  {/* Bank Account Selection */}
                  <div className="withdraw-modal__field">
                    <label htmlFor="bank-account" className="withdraw-modal__label">
                      Select Bank Account <span className="withdraw-modal__required">*</span>
                    </label>
                    <div className="withdraw-modal__custom-dropdown" ref={bankDropdownRef}>
                      <button
                        type="button"
                        id="bank-account"
                        onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                        className={`withdraw-modal__dropdown-toggle ${withdrawForm.bankAccount ? "withdraw-modal__dropdown-toggle--selected" : ""} ${withdrawErrors.bankAccount ? "withdraw-modal__input--error" : ""}`}
                      >
                        <span className="withdraw-modal__dropdown-value">
                          {withdrawForm.bankAccount === "saved"
                            ? userBankDetails
                              ? `Saved Account (${userBankDetails.bankName || 'Bank'} - ****${userBankDetails.accountNumber?.slice(-4) || '0000'})`
                              : "Saved Account (Loading...)"
                            : withdrawForm.bankAccount === "new"
                            ? "Add New Account"
                            : "Select bank account"}
                        </span>
                        <svg
                          width="12"
                          height="8"
                          viewBox="0 0 12 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className={`withdraw-modal__dropdown-arrow ${isBankDropdownOpen ? "withdraw-modal__dropdown-arrow--open" : ""}`}
                        >
                          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {isBankDropdownOpen && (
                        <div className="withdraw-modal__dropdown-menu">
                          <button
                            type="button"
                            className={`withdraw-modal__dropdown-item ${withdrawForm.bankAccount === "" ? "withdraw-modal__dropdown-item--selected" : ""}`}
                            onClick={() => {
                              setWithdrawForm({ ...withdrawForm, bankAccount: "" });
                              setIsBankDropdownOpen(false);
                              if (withdrawErrors.bankAccount) {
                                setWithdrawErrors({ ...withdrawErrors, bankAccount: null });
                              }
                            }}
                          >
                            Select bank account
                          </button>
                          <button
                            type="button"
                            className={`withdraw-modal__dropdown-item ${withdrawForm.bankAccount === "saved" ? "withdraw-modal__dropdown-item--selected" : ""}`}
                            onClick={() => {
                              setWithdrawForm({
                                ...withdrawForm,
                                bankAccount: "saved",
                                accountNumber: userBankDetails?.accountNumber || "",
                                ifscCode: userBankDetails?.ifscCode || "",
                                accountHolderName: userBankDetails?.accountHolderName || "",
                              });
                              setIsBankDropdownOpen(false);
                              if (withdrawErrors.bankAccount) {
                                setWithdrawErrors({ ...withdrawErrors, bankAccount: null });
                              }
                            }}
                          >
                            {userBankDetails
                              ? `Saved Account (${userBankDetails.bankName || 'Bank'} - ****${userBankDetails.accountNumber?.slice(-4) || '0000'})`
                              : "Saved Account (Loading...)"}
                          </button>
                          <button
                            type="button"
                            className={`withdraw-modal__dropdown-item ${withdrawForm.bankAccount === "new" ? "withdraw-modal__dropdown-item--selected" : ""}`}
                            onClick={() => {
                              setWithdrawForm({ ...withdrawForm, bankAccount: "new" });
                              setIsBankDropdownOpen(false);
                              if (withdrawErrors.bankAccount) {
                                setWithdrawErrors({ ...withdrawErrors, bankAccount: null });
                              }
                            }}
                          >
                            Add New Account
                          </button>
                        </div>
                      )}
                    </div>
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
