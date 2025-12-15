import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";

const AllInvestments = () => {
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

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalInvested = holdings.reduce((sum, h) => sum + h.amountInvested, 0);
    const totalEarnings = holdings.reduce((sum, h) => sum + (h.totalEarningsReceived || 0), 0);
    const activeCount = holdings.filter((h) => h.status === "lock-in" || (h.status !== "matured" && h.daysRemaining > 0)).length;
    const maturedCount = holdings.filter((h) => h.status === "matured" || h.daysRemaining === 0).length;

    return {
      totalInvested,
      totalEarnings,
      activeCount,
      maturedCount,
      totalCount: holdings.length,
    };
  }, [holdings]);

  // Sort holdings by purchase date (newest first)
  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
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
            <h1 className="wallet-page__title">All Investments</h1>
            <p className="wallet-page__subtitle">Complete overview of your investment portfolio</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="wallet-page__stats-grid" style={{ marginBottom: "2rem" }}>
          <div className="wallet-page__stat-card">
            <div className="wallet-page__stat-icon wallet-page__stat-icon--purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="wallet-page__stat-info">
              <span className="wallet-page__stat-label">Total Invested</span>
              <span className="wallet-page__stat-value">{formatCurrency(summary.totalInvested, wallet.currency)}</span>
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
                {formatCurrency(summary.totalEarnings, wallet.currency)}
              </span>
            </div>
          </div>
          <div className="wallet-page__stat-card">
            <div className="wallet-page__stat-icon wallet-page__stat-icon--blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="wallet-page__stat-info">
              <span className="wallet-page__stat-label">Active</span>
              <span className="wallet-page__stat-value">{summary.activeCount}</span>
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
              <span className="wallet-page__stat-label">Matured</span>
              <span className="wallet-page__stat-value">{summary.maturedCount}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="wallet-page__content">
          {sortedHoldings.length === 0 ? (
            <div className="wallet-page__empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: "1rem", opacity: 0.5 }}>
                <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p>No investments yet. Start investing to see your portfolio here.</p>
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
                <span className="wallet-page__table-header-item">Status</span>
                <span className="wallet-page__table-header-item">Purchase Date</span>
                <span className="wallet-page__table-header-item">Action</span>
              </div>
              <div className="wallet-page__table-body">
                {sortedHoldings.map((holding) => {
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
                      <span className="wallet-page__table-cell" data-label="Status">
                        <span className={`wallet-page__status-badge ${isMatured ? "wallet-page__status-badge--matured" : "wallet-page__status-badge--locked"}`}>
                          {isMatured ? "Matured" : "Locked"}
                        </span>
                      </span>
                      <span className="wallet-page__table-cell" data-label="Purchase Date">
                        {formatDate(holding.purchaseDate)}
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

export default AllInvestments;

