const AssetCard = ({ holding, onViewDetail, onWithdraw }) => {
  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const isMatured = () => {
    if (!holding.maturityDate) return false;
    const today = new Date();
    const maturity = new Date(holding.maturityDate);
    return today >= maturity;
  };

  const canWithdraw = isMatured() && holding.status !== "withdrawn";
  const isProfit = holding.returnRate >= 0;
  const returnValue = Math.abs(holding.returnRate);

  return (
    <div className="asset-card">
      <div className="asset-card__header">
        <span className="asset-card__name">{holding.name}</span>
        <div className={`asset-card__return ${isProfit ? "asset-card__return--profit" : "asset-card__return--loss"}`}>
          <span className="asset-card__return-value">
            {isProfit ? "+" : "-"}
            {returnValue.toFixed(2)}%
          </span>
          {isProfit ? (
            <svg className="asset-card__arrow" width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2L10 6H2L6 2Z" fill="currentColor" />
            </svg>
          ) : (
            <svg className="asset-card__arrow" width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10L2 6H10L6 10Z" fill="currentColor" />
            </svg>
          )}
        </div>
      </div>
      <div className="asset-card__body">
        <span className="asset-card__amount">{formatCurrency(holding.amountInvested, "INR")}</span>
      </div>
      <div className="asset-card__footer">
        <button className="asset-card__btn asset-card__btn--view" onClick={() => onViewDetail(holding)}>
          View
        </button>
        <button 
          className="asset-card__btn asset-card__btn--withdraw" 
          onClick={() => onWithdraw(holding)}
          disabled={!canWithdraw}
        >
          Withdraw
        </button>
      </div>
    </div>
  );
};

export default AssetCard;

