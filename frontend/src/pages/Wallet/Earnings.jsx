import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";

const Earnings = () => {
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

  // Generate earnings transactions from holdings
  const earningsTransactions = useMemo(() => {
    const earnings = [];
    holdings.forEach((holding) => {
      if (holding.totalEarningsReceived > 0) {
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
        
        const monthsSincePurchase = Math.floor((new Date() - new Date(holding.purchaseDate)) / (1000 * 60 * 60 * 24 * 30));
        // Payouts only start AFTER the lock-in period (3 months)
        const lockInMonths = holding.lockInMonths || 3;
        for (let i = lockInMonths + 1; i <= monthsSincePurchase; i++) {
          const earningDate = new Date(holding.purchaseDate);
          earningDate.setMonth(earningDate.getMonth() + i);
          earnings.push({
            id: `earn-${holdingId}-${i}`,
            date: earningDate.toISOString().split("T")[0],
            amount: holding.monthlyEarning || holding.amountInvested * 0.005,
            description: `Monthly earning from ${propertyName}`,
            propertyId: propertyId,
            holdingId: holdingId,
            propertyName: propertyName,
          });
        }
      }
    });
    return earnings.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [holdings, listings]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalEarnings = earningsTransactions.reduce((sum, e) => sum + e.amount, 0);
    const thisMonthEarnings = earningsTransactions.filter((e) => {
      const earningDate = new Date(e.date);
      const now = new Date();
      return earningDate.getMonth() === now.getMonth() && earningDate.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);

    return {
      totalEarnings,
      thisMonthEarnings,
      totalTransactions: earningsTransactions.length,
    };
  }, [earningsTransactions]);

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
            <h1 className="wallet-page__title">Total Earnings</h1>
            <p className="wallet-page__subtitle">Complete history of your earnings from investments</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="wallet-page__stats-grid" style={{ marginBottom: "2rem" }}>
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
            <div className="wallet-page__stat-icon wallet-page__stat-icon--green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="wallet-page__stat-info">
              <span className="wallet-page__stat-label">This Month</span>
              <span className="wallet-page__stat-value wallet-page__stat-value--green">
                {formatCurrency(summary.thisMonthEarnings, wallet.currency)}
              </span>
            </div>
          </div>
          <div className="wallet-page__stat-card">
            <div className="wallet-page__stat-icon wallet-page__stat-icon--blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="wallet-page__stat-info">
              <span className="wallet-page__stat-label">Transactions</span>
              <span className="wallet-page__stat-value">{summary.totalTransactions}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="wallet-page__content">
          {earningsTransactions.length === 0 ? (
            <div className="wallet-page__empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: "1rem", opacity: 0.5 }}>
                <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p>No earnings recorded yet. Earnings will appear here after the 3-month lock-in period when you start receiving monthly returns.</p>
              <button className="wallet-page__empty-btn" onClick={() => navigate("/explore")}>
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="wallet-page__table-container">
              <div className="wallet-page__table-header">
                <span className="wallet-page__table-header-item">Date</span>
                <span className="wallet-page__table-header-item">Property</span>
                <span className="wallet-page__table-header-item">Description</span>
                <span className="wallet-page__table-header-item">Amount</span>
                <span className="wallet-page__table-header-item">Action</span>
              </div>
              <div className="wallet-page__table-body">
                {earningsTransactions.map((earning) => (
                  <div
                    key={earning.id}
                    className="wallet-page__table-row wallet-page__table-row--clickable"
                    onClick={() => earning.holdingId && navigate(`/holding/${earning.holdingId}`)}
                  >
                    <span className="wallet-page__table-cell" data-label="Date">
                      {formatDate(earning.date)}
                    </span>
                    <span className="wallet-page__table-cell wallet-page__table-cell--property" data-label="Property">
                      <span className="wallet-page__property-name">{earning.propertyName}</span>
                    </span>
                    <span className="wallet-page__table-cell wallet-page__table-cell--description" data-label="Description">
                      {earning.description}
                    </span>
                    <span className="wallet-page__table-cell wallet-page__table-cell--green wallet-page__table-cell--amount" data-label="Amount">
                      +{formatCurrency(earning.amount, wallet.currency)}
                    </span>
                    <span className="wallet-page__table-cell" data-label="Action">
                      {earning.holdingId && (
                        <button
                          className="wallet-page__view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/holding/${earning.holdingId}`);
                          }}
                        >
                          View
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Earnings;

