import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useMemo, useState, useEffect, useRef } from "react";
import { certificateAPI, withdrawalAPI } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import "./HoldingDetail.css";

const HoldingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { holdings, listings, loading, error, wallet } = useAppState();
  const { showToast } = useToast();
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
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
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef(null);

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

  const holding = holdings.find((h) => (h._id || h.id) === id);
  const property = holding ? listings.find((p) => {
    const propertyId = holding.propertyId?._id || holding.propertyId || holding.property;
    return (p._id || p.id) === propertyId;
  }) : null;

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

  const calculateDaysRemaining = useMemo(() => {
    if (!holding?.maturityDate) return 0;
    const today = new Date();
    const maturity = new Date(holding.maturityDate);
    const diffTime = maturity - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [holding]);

  const calculateMonthsSincePurchase = useMemo(() => {
    if (!holding?.purchaseDate) return 0;
    const today = new Date();
    const purchase = new Date(holding.purchaseDate);
    const diffTime = today - purchase;
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  }, [holding]);

  // Check if 3 months (90 days) have passed since purchase
  const checkThreeMonthsPassed = useMemo(() => {
    if (!holding?.purchaseDate) return false;
    const purchaseDate = new Date(holding.purchaseDate);
    const today = new Date();
    const daysSincePurchase = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
    return daysSincePurchase >= 90;
  }, [holding]);

  const isMatured = holding?.status === "matured" || calculateDaysRemaining === 0;
  const canWithdrawInvestment = checkThreeMonthsPassed && holding?.canWithdrawInvestment !== false;
  const canWithdrawEarnings = holding?.canWithdrawEarnings !== false;

  const totalExpectedEarnings = useMemo(() => {
    if (!holding) return 0;
    const monthsSincePurchase = calculateMonthsSincePurchase;
    return (holding.monthlyEarning || holding.amountInvested * 0.005) * monthsSincePurchase;
  }, [holding, calculateMonthsSincePurchase]);

  const walletData = wallet || {
    currency: "INR",
    balance: 0,
    earningsReceived: 0,
    withdrawableBalance: 0,
  };

  const maxEarningsWithdrawAmount = holding?.totalEarningsReceived || totalExpectedEarnings || 0;

  // Handle certificate download
  const handleDownloadCertificate = async () => {
    if (!holding) return;
    
    const holdingId = holding._id || holding.id;
    if (!holdingId) {
      alert('Unable to download certificate: Holding ID not found');
      return;
    }

    try {
      setDownloadingCertificate(true);
      await certificateAPI.downloadCertificate(holdingId);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert(error.message || 'Failed to download certificate. Please try again.');
    } finally {
      setDownloadingCertificate(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="holding-detail">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading holding details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="holding-detail">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Error loading holding: {error}</p>
          <button onClick={() => navigate("/holdings")} className="holding-detail__btn holding-detail__btn--primary" style={{ marginTop: "1rem" }}>
            Back to Holdings
          </button>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!holding) {
    return (
      <div className="holding-detail">
        <div className="holding-detail__not-found">
          <h2>Holding Not Found</h2>
          <p>The holding you are looking for does not exist.</p>
          <button onClick={() => navigate("/holdings")} className="holding-detail__btn holding-detail__btn--primary">
            Back to Holdings
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Header - Full Width */}
      <div className="holding-detail__top-header">
        <div className="holding-detail__top-header-content">
          <button onClick={() => navigate(-1)} className="holding-detail__back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="holding-detail__back-text">Back</span>
          </button>
          <span className={`holding-detail__status ${isMatured ? "holding-detail__status--matured" : "holding-detail__status--locked"}`}>
            {isMatured ? "Matured" : "Locked"}
          </span>
        </div>
      </div>

      <div className="holding-detail">
        {/* Back Button for Web View */}
        <div className="holding-detail__web-back">
          <button onClick={() => navigate(-1)} className="holding-detail__web-back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </button>
        </div>
        {/* Header Section */}
        <div className="holding-detail__header">
        <div className="holding-detail__header-box">
          <div className="holding-detail__header-content">
            <div className="holding-detail__icon">
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#e0e7ff" />
                <path
                  d="M16 8L24 12V20L16 24L8 20V12L16 8Z"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="holding-detail__header-info">
              <h1 className="holding-detail__title">{holding.name}</h1>
              <p className="holding-detail__type">Your Investment</p>
              {property && (property._id || property.id) && (
                <button onClick={() => navigate(`/property/${property._id || property.id}`)} className="holding-detail__property-link">
                  View Property Details →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Key Investment Info Card */}
      <div className="holding-detail__info-card">
        <div className="holding-detail__info-item">
          <span className="holding-detail__info-label">Amount Invested</span>
          <span className="holding-detail__info-value">{formatCurrency(holding.amountInvested, "INR")}</span>
        </div>
        <div className="holding-detail__info-item">
          <span className="holding-detail__info-label">Monthly Earning</span>
          <span className="holding-detail__info-value holding-detail__info-value--green">
            {formatCurrency(holding.monthlyEarning || holding.amountInvested * 0.005, "INR")}
          </span>
        </div>
        <div className="holding-detail__info-item">
          <span className="holding-detail__info-label">Total Earnings</span>
          <span className="holding-detail__info-value holding-detail__info-value--green">
            {formatCurrency(holding.totalEarningsReceived || totalExpectedEarnings, "INR")}
          </span>
        </div>
        <div className="holding-detail__info-item">
          <span className="holding-detail__info-label">Days Remaining</span>
          <span className="holding-detail__info-value">{isMatured ? "0" : calculateDaysRemaining}</span>
        </div>
      </div>

      {/* Download Certificate Button */}
      <div className="holding-detail__section">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <button
            onClick={handleDownloadCertificate}
            disabled={downloadingCertificate}
            className="holding-detail__btn holding-detail__btn--primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: downloadingCertificate ? 'not-allowed' : 'pointer',
              opacity: downloadingCertificate ? 0.7 : 1,
            }}
          >
            {downloadingCertificate ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="32">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite" />
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite" />
                  </circle>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download Certificate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Investment Details */}
      <div className="holding-detail__section">
        <h2 className="holding-detail__section-title">Investment Details</h2>
        <div className="holding-detail__details-list">
          <div className="holding-detail__detail-item">
            <span className="holding-detail__detail-label">Purchase Date</span>
            <span className="holding-detail__detail-value">{formatDate(holding.purchaseDate)}</span>
          </div>
          <div className="holding-detail__detail-item">
            <span className="holding-detail__detail-label">Maturity Date</span>
            <span className="holding-detail__detail-value">{formatDate(holding.maturityDate)}</span>
          </div>
          <div className="holding-detail__detail-item">
            <span className="holding-detail__detail-label">Lock-in Period</span>
            <span className="holding-detail__detail-value">{holding.lockInMonths || 3} months</span>
          </div>
          <div className="holding-detail__detail-item">
            <span className="holding-detail__detail-label">Monthly Return Rate</span>
            <span className="holding-detail__detail-value holding-detail__detail-value--green">0.5%</span>
          </div>
          <div className="holding-detail__detail-item">
            <span className="holding-detail__detail-label">Months Since Purchase</span>
            <span className="holding-detail__detail-value">{calculateMonthsSincePurchase} months</span>
          </div>
          <div className="holding-detail__detail-item">
            <span className="holding-detail__detail-label">Investment Status</span>
            <span className={`holding-detail__detail-value ${isMatured ? "holding-detail__detail-value--green" : "holding-detail__detail-value--orange"}`}>
              {isMatured ? "Matured - Ready to Withdraw" : "In Lock-in Period"}
            </span>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="holding-detail__section">
        <h2 className="holding-detail__section-title">Earnings Breakdown</h2>
        <div className="holding-detail__earnings-card">
          <div className="holding-detail__earnings-item">
            <span className="holding-detail__earnings-label">Monthly Earning</span>
            <span className="holding-detail__earnings-value">
              {formatCurrency(holding.monthlyEarning || holding.amountInvested * 0.005, "INR")}
            </span>
            <span className="holding-detail__earnings-subtext">0.5% of investment amount</span>
          </div>
          <div className="holding-detail__earnings-item">
            <span className="holding-detail__earnings-label">Total Earnings Received</span>
            <span className="holding-detail__earnings-value holding-detail__earnings-value--green">
              {formatCurrency(holding.totalEarningsReceived || totalExpectedEarnings, "INR")}
            </span>
            <span className="holding-detail__earnings-subtext">
              From {calculateMonthsSincePurchase} months of investment
            </span>
          </div>
          <div className="holding-detail__earnings-item holding-detail__earnings-item--total">
            <span className="holding-detail__earnings-label">Total Value</span>
            <span className="holding-detail__earnings-value holding-detail__earnings-value--highlight">
              {formatCurrency(
                holding.amountInvested + (holding.totalEarningsReceived || totalExpectedEarnings),
                "INR"
              )}
            </span>
            <span className="holding-detail__earnings-subtext">Investment + Earnings</span>
          </div>
        </div>
      </div>

      {/* Withdrawal Options */}
      <div className="holding-detail__section">
        <h2 className="holding-detail__section-title">Withdrawal Options</h2>
        <div className="holding-detail__withdrawal-card">
          <div className="holding-detail__withdrawal-item">
            <div className="holding-detail__withdrawal-info">
              <span className="holding-detail__withdrawal-label">Investment Amount</span>
              <span className="holding-detail__withdrawal-value">{formatCurrency(holding.amountInvested, "INR")}</span>
            </div>
            <button
              className={`holding-detail__withdrawal-btn ${canWithdrawInvestment ? "holding-detail__withdrawal-btn--active" : "holding-detail__withdrawal-btn--disabled"}`}
              disabled={!canWithdrawInvestment}
              onClick={() => {
                if (canWithdrawInvestment) {
                  const holdingId = holding._id || holding.id;
                  navigate("/withdraw-info", { state: { holdingId } });
                }
              }}
            >
              {canWithdrawInvestment ? "Withdraw Investment" : "Locked"}
            </button>
          </div>
          <div className="holding-detail__withdrawal-item">
            <div className="holding-detail__withdrawal-info">
              <span className="holding-detail__withdrawal-label">Available Earnings</span>
              <span className="holding-detail__withdrawal-value holding-detail__withdrawal-value--green">
                {formatCurrency(holding.totalEarningsReceived || totalExpectedEarnings, "INR")}
              </span>
            </div>
            <button
              className={`holding-detail__withdrawal-btn ${canWithdrawEarnings ? "holding-detail__withdrawal-btn--active" : "holding-detail__withdrawal-btn--disabled"}`}
              disabled={!canWithdrawEarnings}
              onClick={() => {
                if (!canWithdrawEarnings) return;
                
                // Check if mobile view - show modal on same page
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                  setShowWithdrawModal(true);
                  setWithdrawForm({
                    amount: holding.totalEarningsReceived || totalExpectedEarnings || 0,
                    bankAccount: "",
                    accountNumber: "",
                    ifscCode: "",
                    accountHolderName: "",
                    acceptTerms: false,
                  });
                } else {
                  // Desktop: navigate to wallet page
                  const holdingId = holding._id || holding.id;
                  navigate("/wallet", {
                    state: {
                      openWithdrawModal: true,
                      source: "earnings",
                      holdingId,
                      prefillAmount: holding.totalEarningsReceived || totalExpectedEarnings || 0,
                    },
                  });
                }
              }}
            >
              {canWithdrawEarnings ? "Withdraw Earnings" : "Not Available"}
            </button>
          </div>
        </div>
      </div>

      {/* Property Information */}
      {property && (
        <div className="holding-detail__section">
          <h2 className="holding-detail__section-title">Property Information</h2>
          <div className="holding-detail__property-card">
            <div className="holding-detail__property-info">
              <h3 className="holding-detail__property-title">{property.title}</h3>
              <p className="holding-detail__property-description">{property.description || "Premium digital property investment"}</p>
            </div>
            {(property._id || property.id) && (
              <button onClick={() => navigate(`/property/${property._id || property.id}`)} className="holding-detail__btn holding-detail__btn--outline">
                View Full Property Details
              </button>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Modal for Mobile */}
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
                  <span className="withdraw-modal__balance-value">{formatCurrency(walletData.balance || 0, walletData.currency)}</span>
                </div>
                <div className="withdraw-modal__balance-item">
                  <span className="withdraw-modal__balance-label">Withdrawable Amount</span>
                  <span className="withdraw-modal__balance-value withdraw-modal__balance-value--green">
                    {formatCurrency(maxEarningsWithdrawAmount, walletData.currency)}
                  </span>
                </div>
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
                  } else if (withdrawForm.amount > maxEarningsWithdrawAmount) {
                    errors.amount = `Maximum earnings you can withdraw is ${formatCurrency(maxEarningsWithdrawAmount, walletData.currency)}`;
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
                    type: "earnings",
                    bankDetails: {
                      accountNumber: withdrawForm.accountNumber,
                      ifscCode: withdrawForm.ifscCode,
                      accountHolderName: withdrawForm.accountHolderName,
                      bankName: withdrawForm.bankAccount === "saved" ? "Saved Bank Account" : "Custom Bank",
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
                    setWithdrawErrors({});
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
                    max={maxEarningsWithdrawAmount}
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
                    Maximum earnings withdrawable: {formatCurrency(maxEarningsWithdrawAmount, walletData.currency)}
                  </span>
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
                          ? "Saved Account (HDFC Bank - ****7890)"
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
                              accountNumber: "1234567890",
                              ifscCode: "HDFC0001234",
                              accountHolderName: "Yunus Ahmed",
                            });
                            setIsBankDropdownOpen(false);
                            if (withdrawErrors.bankAccount) {
                              setWithdrawErrors({ ...withdrawErrors, bankAccount: null });
                            }
                          }}
                        >
                          Saved Account (HDFC Bank - ****7890)
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
    </>
  );
};

export default HoldingDetail;

