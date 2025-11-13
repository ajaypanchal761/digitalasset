const PropertyCard = ({ property, onInvest }) => {
  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const isPositive = property.returnRate >= 0;
  const returnValue = Math.abs(property.returnRate);

  // Generate a zig-zag trend line SVG (green for positive, red for negative)
  const generateTrendLine = () => {
    if (isPositive) {
      // Zig-zag upward trend
      return "M0,35 L5,30 L10,32 L15,28 L20,30 L25,25 L30,22 L35,20 L40,18 L45,15 L50,12 L55,10 L60,8 L65,6 L70,5";
    } else {
      // Zig-zag downward trend
      return "M0,5 L5,8 L10,6 L15,10 L20,12 L25,15 L30,18 L35,20 L40,22 L45,25 L50,28 L55,30 L60,32 L65,35 L70,38";
    }
  };

  return (
    <div className="property-card">
      <div className="property-card__left">
        <div className="property-card__icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#e0e7ff" />
            <path
              d="M16 8L24 12V20L16 24L8 20V12L16 8Z"
              stroke="#6366f1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="property-card__info">
          <div className="property-card__name">{property.title}</div>
          <div className="property-card__type">Digital Property</div>
        </div>
      </div>
      <div className="property-card__middle">
        <svg width="70" height="40" viewBox="0 0 70 40" className="property-card__graph">
          <path
            d={generateTrendLine()}
            stroke={isPositive ? "#10b981" : "#ef4444"}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="property-card__right">
        <div className="property-card__price">{formatCurrency(property.totalValue, "INR")}</div>
        <div className={`property-card__return ${isPositive ? "property-card__return--profit" : "property-card__return--loss"}`}>
          <span className="property-card__return-value">
            {isPositive ? "+" : "-"}
            {returnValue.toFixed(1)}%
          </span>
          {isPositive ? (
            <svg className="property-card__arrow" width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2L10 6H2L6 2Z" fill="currentColor" />
            </svg>
          ) : (
            <svg className="property-card__arrow" width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10L2 6H10L6 10Z" fill="currentColor" />
            </svg>
          )}
        </div>
        <div className="property-card__deadline">Deadline: {formatDate(property.deadline)}</div>
        <button className="property-card__btn" onClick={() => onInvest(property)}>
          Invest Now
        </button>
      </div>
    </div>
  );
};

export default PropertyCard;

