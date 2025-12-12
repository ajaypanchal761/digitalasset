import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useMemo, useState } from "react";
import { certificateAPI } from "../../services/api.js";
import "./HoldingDetail.css";

const HoldingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { holdings, listings, loading, error } = useAppState();
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);

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
    <div className="holding-detail">
      {/* Header Section */}
      <div className="holding-detail__header">
        <div className="holding-detail__header-top">
          <button onClick={() => navigate(-1)} className="holding-detail__back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <div className="holding-detail__header-actions">
            <span className={`holding-detail__status ${isMatured ? "holding-detail__status--matured" : "holding-detail__status--locked"}`}>
              {isMatured ? "Matured" : "Locked"}
            </span>
          </div>
        </div>
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

                const holdingId = holding._id || holding.id;

                // Navigate to Wallet and open the withdraw modal in earnings mode.
                // This keeps styling in Wallet and reuses the existing modal.
                navigate("/wallet", {
                  state: {
                    openWithdrawModal: true,
                    source: "earnings",
                    holdingId,
                    // Suggest full earnings amount; user can edit in modal if needed.
                    prefillAmount: holding.totalEarningsReceived || totalExpectedEarnings || 0,
                  },
                });
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
    </div>
  );
};

export default HoldingDetail;

