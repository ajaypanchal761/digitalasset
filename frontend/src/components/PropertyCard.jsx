const PropertyCard = ({ property, onInvest, onClick }) => {
  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const minInvestment = property.minInvestment || 500000;
  const monthlyReturn = property.monthlyReturnRate || 0.5;
  const isPositive = true; // Always positive for 0.5% return

  const handleCardClick = (e) => {
    // Don't navigate if clicking on button or its parent
    if (e.target.closest(".property-card__invest-btn") || e.target.closest("button")) {
      return;
    }
    if (onClick) {
      onClick(property);
    }
  };

  return (
    <div
      className="property-card"
      onClick={handleCardClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="property-card__content">
        {/* First Row: Logo and Name */}
        <div className="property-card__row property-card__row--first">
          <div className="property-card__icon">
            {property.image ? (
              <img
                src={property.image}
                alt={property.title}
                className="property-card__image"
                onError={(e) => {
                  // Fallback to SVG if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <svg
              width="40"
              height="40"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: property.image ? 'none' : 'block' }}
            >
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
          <div className="property-card__name">{property.title}</div>
        </div>
        
        {/* Second Row: Min Investment */}
        <div className="property-card__row property-card__row--second">
          <div className="property-card__price-section">
            <span className="property-card__price-label">Min Investment</span>
            <span className="property-card__price">{formatCurrency(minInvestment, "INR")}</span>
          </div>
        </div>
        
        {/* Third Row: Return */}
        <div className="property-card__row property-card__row--third">
          <div className="property-card__return-section">
            <span className="property-card__return-label">Return</span>
            <div className={`property-card__return ${isPositive ? "property-card__return--profit" : "property-card__return--loss"}`}>
              <span className="property-card__return-value">
                {isPositive ? "+" : "-"}
                {monthlyReturn.toFixed(2)}%
              </span>
              {isPositive ? (
                <svg className="property-card__arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 2L10 6H2L6 2Z" fill="currentColor" />
                </svg>
              ) : (
                <svg className="property-card__arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 10L2 6H10L6 10Z" fill="currentColor" />
                </svg>
              )}
            </div>
          </div>
        </div>
        
        {/* Fourth Row: Invest Now Button */}
        {onInvest && (
          <div className="property-card__row property-card__row--fourth">
            <button
              className="property-card__invest-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Check if property is active before allowing investment
                if (property.status !== 'active') {
                  alert(`This property is ${property.status}. Only active properties are available for investment.`);
                  return;
                }
                onInvest(property);
              }}
              disabled={property.status !== 'active'}
              title={property.status !== 'active' ? `This property is ${property.status}. Only active properties are available for investment.` : 'Invest in this property'}
            >
              {property.status === 'active' ? 'Invest Now' : `Property ${property.status?.charAt(0).toUpperCase() + property.status?.slice(1) || 'Unavailable'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;

