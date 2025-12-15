import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";

const ActiveInvestments = () => {
  const { holdings, listings, wallet } = useAppState();
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

  // Filter active investments (lock-in status)
  const activeInvestments = useMemo(() => {
    return holdings.filter((h) => h.status === "lock-in" || (h.status !== "matured" && h.daysRemaining > 0));
  }, [holdings]);

  return (
    <div className="wallet-page">
      <div className="wallet-page__container">
        {/* Header */}
        <div className="wallet-page__header">
          <button
            className="wallet-page__back-btn"
            onClick={() => navigate("/wallet")}
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="wallet-page__title">Active Investments</h1>
            <p className="wallet-page__subtitle">Your investments currently in lock-in period</p>
          </div>
        </div>

        {/* Content */}
        <div className="wallet-page__content">
          {activeInvestments.length === 0 ? (
            <div className="wallet-page__empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: "1rem", opacity: 0.5 }}>
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p>No active investments at the moment</p>
              <button className="wallet-page__empty-btn" onClick={() => navigate("/explore")}>
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="wallet-page__table-container">
              <div className="wallet-page__table-header wallet-page__table-header--investments">
                <span className="wallet-page__table-header-item">Property</span>
                <span className="wallet-page__table-header-item">Invested</span>
                <span className="wallet-page__table-header-item">Earnings</span>
                <span className="wallet-page__table-header-item">Days Remaining</span>
                <span className="wallet-page__table-header-item">Maturity Date</span>
                <span className="wallet-page__table-header-item">Action</span>
              </div>
              <div className="wallet-page__table-body">
                {activeInvestments.map((holding) => {
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
                    <div
                      key={holdingId}
                      className="wallet-page__table-row wallet-page__table-row--clickable wallet-page__table-row--investments"
                      onClick={() => navigate(`/holding/${holdingId}`)}
                    >
                      <span className="wallet-page__table-cell wallet-page__table-cell--property" data-label="Property">
                        <span className="wallet-page__property-name">{propertyName}</span>
                      </span>
                      <span className="wallet-page__table-cell" data-label="Invested">
                        {formatCurrency(holding.amountInvested, wallet.currency)}
                      </span>
                      <span className="wallet-page__table-cell wallet-page__table-cell--green" data-label="Earnings">
                        {formatCurrency(holding.totalEarningsReceived || 0, wallet.currency)}
                      </span>
                      <span className="wallet-page__table-cell" data-label="Days Remaining">
                        <span className="wallet-page__status-badge wallet-page__status-badge--locked">
                          {holding.daysRemaining || 0} days
                        </span>
                      </span>
                      <span className="wallet-page__table-cell" data-label="Maturity Date">
                        {formatDate(holding.maturityDate)}
                      </span>
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
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveInvestments;

