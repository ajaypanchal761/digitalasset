import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import "./Holdings.css";

const Holdings = () => {
  const { holdings, wallet } = useAppState();
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
                <span className="holdings-page__table-header-item">Action</span>
              </div>
              <div className="holdings-page__table-body">
                {holdings.map((holding) => {
                  const isMatured = holding.status === "matured" || holding.daysRemaining === 0;
                  return (
                    <div
                      key={holding.id}
                      className="holdings-page__table-row holdings-page__table-row--clickable"
                      onClick={() => navigate(`/holding/${holding.id}`)}
                    >
                      <span className="holdings-page__table-cell holdings-page__table-cell--property" data-label="Property">
                        <span className="holdings-page__property-name">{holding.name}</span>
                      </span>
                      <span className="holdings-page__table-cell" data-label="Invested">
                        {formatCurrency(holding.amountInvested, wallet.currency)}
                      </span>
                      <span className="holdings-page__table-cell holdings-page__table-cell--green" data-label="Earnings">
                        {formatCurrency(holding.totalEarningsReceived || 0, wallet.currency)}
                      </span>
                      <span className="holdings-page__table-cell" data-label="Status">
                        <span className={`holdings-page__status-badge ${isMatured ? "holdings-page__status-badge--matured" : "holdings-page__status-badge--locked"}`}>
                          {isMatured ? "Matured" : "Locked"}
                        </span>
                      </span>
                      <span className="holdings-page__table-cell" data-label="Maturity">
                        {formatDate(holding.maturityDate)}
                      </span>
                      <span className="holdings-page__table-cell" data-label="Action">
                        <button
                          className="holdings-page__view-btn"
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

export default Holdings;

