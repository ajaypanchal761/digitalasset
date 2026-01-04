const AssetCard = ({ holding, onViewDetail, onWithdraw }) => {
  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const calculateDaysRemaining = () => {
    if (!holding.maturityDate) return 0;
    const today = new Date();
    const maturity = new Date(holding.maturityDate);

    // Set both dates to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    maturity.setHours(0, 0, 0, 0);

    const diffTime = maturity - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Check if 3 months (90 days) have passed since purchase
  const checkThreeMonthsPassed = () => {
    if (!holding.purchaseDate) return false;
    const purchaseDate = new Date(holding.purchaseDate);
    const today = new Date();
    const daysSincePurchase = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
    return daysSincePurchase >= 90;
  };

  const daysRemaining = holding.daysRemaining !== undefined ? holding.daysRemaining : calculateDaysRemaining();
  const isMatured = holding.status === "matured" || daysRemaining === 0;
  const threeMonthsPassed = checkThreeMonthsPassed();
  const canWithdraw = threeMonthsPassed && holding.canWithdrawInvestment !== false;

  return (
    <div className="asset-card">
      <div className="asset-card__header">
        <span className="asset-card__name">{holding.name}</span>
        <span className={`asset-card__status ${isMatured ? "asset-card__status--matured" : "asset-card__status--locked"}`}>
          {isMatured ? "Matured" : "Locked"}
        </span>
      </div>
      <div className="asset-card__body">
        <div className="asset-card__amount-section">
          <span className="asset-card__amount-label">Invested</span>
          <span className="asset-card__amount">{formatCurrency(holding.amountInvested, "INR")}</span>
        </div>
        <div className="asset-card__earning-section">
          <span className="asset-card__earning-label">Monthly Earning</span>
          <span className="asset-card__earning">{formatCurrency(holding.monthlyEarning || holding.amountInvested * 0.005, "INR")}</span>
        </div>
        <div className="asset-card__days-section">
          <span className="asset-card__days-label">Days Remaining</span>
          <span className="asset-card__days">{isMatured ? "0" : daysRemaining}</span>
        </div>
      </div>
      <div className="asset-card__footer">
        <button className="asset-card__btn asset-card__btn--view" onClick={() => onViewDetail(holding)}>
          View Detail
        </button>
        <button 
          className={`asset-card__btn asset-card__btn--withdraw ${!canWithdraw ? 'asset-card__btn--withdraw-disabled' : ''}`}
          onClick={() => onWithdraw(holding)}
        >
          Withdraw
        </button>
      </div>
    </div>
  );
};

export default AssetCard;

