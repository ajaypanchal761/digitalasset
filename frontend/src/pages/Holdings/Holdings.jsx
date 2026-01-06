import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import "./Holdings.css";

const Holdings = () => {
  const { holdings, wallet, loading, error } = useAppState();
  const navigate = useNavigate();

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

  // Calculate days remaining if not provided
  const calculateDaysRemaining = (maturityDate) => {
    if (!maturityDate) return 0;
    const maturity = new Date(maturityDate);
    const now = new Date();

    // Set both dates to start of day for accurate day calculation
    now.setHours(0, 0, 0, 0);
    maturity.setHours(0, 0, 0, 0);

    const diff = maturity - now;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="holdings-page">
        <div className="holdings-page__container">
          <div className="holdings-page__header">
            <button
              type="button"
              className="holdings-page__back-btn"
              onClick={() => navigate("/dashboard")}
              aria-label="Go back to dashboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19L5 12L12 5" />
              </svg>
            </button>
            <div className="holdings-page__header-content">
              <h1 className="holdings-page__title">Current Holdings</h1>
              <p className="holdings-page__subtitle">View all your investment holdings</p>
            </div>
          </div>
          <div className="holdings-page__content">
            <div className="holdings-page__empty">
              <p>Loading holdings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="holdings-page">
        <div className="holdings-page__container">
          <div className="holdings-page__header">
            <button
              type="button"
              className="holdings-page__back-btn"
              onClick={() => navigate("/dashboard")}
              aria-label="Go back to dashboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19L5 12L12 5" />
              </svg>
            </button>
            <div className="holdings-page__header-content">
              <h1 className="holdings-page__title">Current Holdings</h1>
              <p className="holdings-page__subtitle">View all your investment holdings</p>
            </div>
          </div>
          <div className="holdings-page__content">
            <div className="holdings-page__empty">
              <p>Error loading holdings: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const walletCurrency = wallet?.currency || "INR";

  return (
    <div className="holdings-page">
      <div className="holdings-page__container">
        {/* Header */}
        <div className="holdings-page__header">
          <button
            type="button"
            className="holdings-page__back-btn"
            onClick={() => navigate("/dashboard")}
            aria-label="Go back to dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19L5 12L12 5" />
            </svg>
          </button>
          <div className="holdings-page__header-content">
            <h1 className="holdings-page__title">Current Holdings</h1>
            <p className="holdings-page__subtitle">View all your investment holdings</p>
          </div>
        </div>

        {/* Holdings List */}
        <div className="holdings-page__content">
          {holdings.length === 0 ? (
            <div className="holdings-page__empty">
              <p>No holdings yet. Start investing to see your assets here.</p>
              <button className="holdings-page__empty-btn" onClick={() => navigate("/explore")}>
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="holdings-page__table-container">
              <div className="holdings-page__table-header">
                <span className="holdings-page__table-header-item">Property</span>
                <span className="holdings-page__table-header-item">Invested</span>
                <span className="holdings-page__table-header-item">Earnings</span>
                <span className="holdings-page__table-header-item">Status</span>
                <span className="holdings-page__table-header-item">Maturity</span>
                <span className="holdings-page__table-header-item">Next Payout</span>
                <span className="holdings-page__table-header-item">Action</span>
              </div>
              <div className="holdings-page__table-body">
                {holdings.map((holding) => {
                  const holdingId = holding._id || holding.id;
                  const daysRemaining = holding.daysRemaining !== undefined 
                    ? holding.daysRemaining 
                    : calculateDaysRemaining(holding.maturityDate);
                  const isMatured = holding.status === "matured" || daysRemaining === 0;
                  // Get property name from holding or property reference
                  const propertyName = holding.name || holding.propertyId?.title || "Property";
                  
                  // Calculate next payout date (1st of the month, 3 months after purchase due to lock-in period)
                  const calculateNextPayoutDate = (purchaseDate) => {
                    if (!purchaseDate) return null;
                    const purchase = new Date(purchaseDate);
                    const nextPayout = new Date(purchase);
                    nextPayout.setMonth(nextPayout.getMonth() + 3); // Add 3 months for lock-in period
                    nextPayout.setDate(1); // Set to 1st of that month
                    return nextPayout;
                  };

                  const nextPayoutDate = calculateNextPayoutDate(holding.purchaseDate);
                  
                  return (
                    <div
                      key={holdingId}
                      className="holdings-page__table-row holdings-page__table-row--clickable"
                      onClick={() => navigate(`/holding/${holdingId}`)}
                    >
                      <span className="holdings-page__table-cell holdings-page__table-cell--property" data-label="Property">
                        <span className="holdings-page__property-name">{propertyName}</span>
                      </span>
                      <span className="holdings-page__table-cell" data-label="Invested">
                        {formatCurrency(holding.amountInvested || 0, walletCurrency)}
                      </span>
                      <span className="holdings-page__table-cell holdings-page__table-cell--green" data-label="Earnings">
                        {formatCurrency(holding.totalEarningsReceived || 0, walletCurrency)}
                      </span>
                      <span className="holdings-page__table-cell" data-label="Status">
                        <span className={`holdings-page__status-badge ${isMatured ? "holdings-page__status-badge--matured" : "holdings-page__status-badge--locked"}`}>
                          {isMatured ? "Matured" : "Locked"}
                        </span>
                      </span>
                      <span className="holdings-page__table-cell" data-label="Maturity">
                        {formatDate(holding.maturityDate)}
                      </span>
                      <span className="holdings-page__table-cell" data-label="Next Payout">
                        {nextPayoutDate ? formatDate(nextPayoutDate.toISOString()) : 'N/A'}
                      </span>
                      <span className="holdings-page__table-cell" data-label="Action">
                        <button
                          className="holdings-page__view-btn"
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
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Holdings;

