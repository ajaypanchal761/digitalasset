import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";

const MaturedInvestments = () => {
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

  // Filter matured investments
  const maturedInvestments = useMemo(() => {
    return holdings.filter((h) => h.status === "matured" || h.daysRemaining === 0);
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
            <h1 className="wallet-page__title">Matured Investments</h1>
            <p className="wallet-page__subtitle">Your investments that have completed the lock-in period</p>
          </div>
        </div>

        {/* Content */}
        <div className="wallet-page__content">
          {maturedInvestments.length === 0 ? (
            <div className="wallet-page__empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: "1rem", opacity: 0.5 }}>
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p>No matured investments yet</p>
              <button className="wallet-page__empty-btn" onClick={() => navigate("/explore")}>
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="wallet-page__table-container">
              <div className="wallet-page__table-header wallet-page__table-header--investments">
                <span className="wallet-page__table-header-item">Property</span>
                <span className="wallet-page__table-header-item">Invested</span>
                <span className="wallet-page__table-header-item">Total Earnings</span>
                <span className="wallet-page__table-header-item">Status</span>
                <span className="wallet-page__table-header-item">Maturity Date</span>
                <span className="wallet-page__table-header-item">Action</span>
              </div>
              <div className="wallet-page__table-body">
                {maturedInvestments.map((holding) => {
                  const property = listings.find((p) => p.id === holding.propertyId);
                  return (
                    <div
                      key={holding.id}
                      className="wallet-page__table-row wallet-page__table-row--clickable wallet-page__table-row--investments"
                      onClick={() => navigate(`/holding/${holding.id}`)}
                    >
                      <span className="wallet-page__table-cell wallet-page__table-cell--property" data-label="Property">
                        <span className="wallet-page__property-name">{holding.name}</span>
                      </span>
                      <span className="wallet-page__table-cell" data-label="Invested">
                        {formatCurrency(holding.amountInvested, wallet.currency)}
                      </span>
                      <span className="wallet-page__table-cell wallet-page__table-cell--green" data-label="Total Earnings">
                        {formatCurrency(holding.totalEarningsReceived || 0, wallet.currency)}
                      </span>
                      <span className="wallet-page__table-cell" data-label="Status">
                        <span className="wallet-page__status-badge wallet-page__status-badge--matured">
                          Matured
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
                            navigate(`/holding/${holding.id}`);
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

export default MaturedInvestments;

