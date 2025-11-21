import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const PropertySale = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { holdings, listings } = useAppState();
  const { showToast } = useToast();
  const holdingId = location.state?.holdingId;
  const holding = holdings.find((h) => h.id === holdingId);
  const property = listings.find((p) => p.id === holding?.propertyId);

  const [formData, setFormData] = useState({
    salePrice: holding?.amountInvested || 0,
    description: "",
    contactMethod: "platform",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!holding) {
      navigate("/wallet");
    }
  }, [holding, navigate]);

  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.salePrice || formData.salePrice < holding.amountInvested * 0.8) {
      newErrors.salePrice = `Minimum sale price is ${formatCurrency(holding.amountInvested * 0.8, "INR")} (80% of investment)`;
    }
    if (!formData.description.trim()) {
      newErrors.description = "Please provide a description";
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms";
    }

    if (Object.keys(newErrors).length === 0) {
      // Here you would typically save to backend
      console.log("Property listed for sale:", { holdingId, ...formData });
      showToast("Property listed for sale successfully! It will be visible to other users on the platform.", "success");
      navigate("/wallet");
    } else {
      setErrors(newErrors);
    }
  };

  if (!holding) {
    return null;
  }

  return (
    <div className="property-sale-page">
      <div className="property-sale-page__container">
        {/* Header */}
        <div className="property-sale-page__header">
          <button className="property-sale-page__back" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="property-sale-page__title">List Property for Sale</h1>
          <div style={{ width: "24px" }}></div>
        </div>

        {/* Property Info */}
        <div className="property-sale-page__property-card">
          <h3 className="property-sale-page__card-title">Property Details</h3>
          <div className="property-sale-page__property-info">
            <div className="property-sale-page__property-item">
              <span className="property-sale-page__property-label">Property Name</span>
              <span className="property-sale-page__property-value">{holding.name}</span>
            </div>
            <div className="property-sale-page__property-item">
              <span className="property-sale-page__property-label">Your Investment</span>
              <span className="property-sale-page__property-value">{formatCurrency(holding.amountInvested, "INR")}</span>
            </div>
            <div className="property-sale-page__property-item">
              <span className="property-sale-page__property-label">Earnings Received</span>
              <span className="property-sale-page__property-value property-sale-page__property-value--green">
                {formatCurrency(holding.totalEarningsReceived || 0, "INR")}
              </span>
            </div>
            <div className="property-sale-page__property-item">
              <span className="property-sale-page__property-label">Status</span>
              <span className={`property-sale-page__status-badge ${holding.status === "matured" ? "property-sale-page__status-badge--matured" : "property-sale-page__status-badge--locked"}`}>
                {holding.status === "matured" ? "Matured" : "Locked"}
              </span>
            </div>
          </div>
        </div>

        {/* Sale Form */}
        <form className="property-sale-page__form" onSubmit={handleSubmit}>
          <h3 className="property-sale-page__form-title">Sale Information</h3>

          {/* Sale Price */}
          <div className="property-sale-page__field">
            <label htmlFor="sale-price" className="property-sale-page__label">
              Sale Price (₹) <span className="property-sale-page__required">*</span>
            </label>
            <input
              id="sale-price"
              type="number"
              min={holding.amountInvested * 0.8}
              step="1000"
              value={formData.salePrice}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setFormData({ ...formData, salePrice: value });
                if (errors.salePrice) {
                  setErrors({ ...errors, salePrice: null });
                }
              }}
              className={`property-sale-page__input ${errors.salePrice ? "property-sale-page__input--error" : ""}`}
              placeholder="Enter sale price"
            />
            {errors.salePrice && <span className="property-sale-page__error">{errors.salePrice}</span>}
            <span className="property-sale-page__hint">
              Minimum: {formatCurrency(holding.amountInvested * 0.8, "INR")} (80% of your investment)
            </span>
          </div>

          {/* Description */}
          <div className="property-sale-page__field">
            <label htmlFor="description" className="property-sale-page__label">
              Sale Description <span className="property-sale-page__required">*</span>
            </label>
            <textarea
              id="description"
              rows="4"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) {
                  setErrors({ ...errors, description: null });
                }
              }}
              className={`property-sale-page__input property-sale-page__textarea ${errors.description ? "property-sale-page__input--error" : ""}`}
              placeholder="Describe why you're selling and any relevant details..."
            />
            {errors.description && <span className="property-sale-page__error">{errors.description}</span>}
          </div>

          {/* Summary */}
          <div className="property-sale-page__summary">
            <h4 className="property-sale-page__summary-title">Sale Summary</h4>
            <div className="property-sale-page__summary-item">
              <span className="property-sale-page__summary-label">Original Investment</span>
              <span className="property-sale-page__summary-value">{formatCurrency(holding.amountInvested, "INR")}</span>
            </div>
            <div className="property-sale-page__summary-item">
              <span className="property-sale-page__summary-label">Sale Price</span>
              <span className="property-sale-page__summary-value property-sale-page__summary-value--highlight">
                {formatCurrency(formData.salePrice || 0, "INR")}
              </span>
            </div>
            <div className="property-sale-page__summary-item property-sale-page__summary-item--total">
              <span className="property-sale-page__summary-label">Profit/Loss</span>
              <span className={`property-sale-page__summary-value ${formData.salePrice - holding.amountInvested >= 0 ? "property-sale-page__summary-value--green" : "property-sale-page__summary-value--red"}`}>
                {formData.salePrice >= holding.amountInvested ? "+" : ""}
                {formatCurrency(formData.salePrice - holding.amountInvested, "INR")}
              </span>
            </div>
          </div>

          {/* Terms */}
          <div className="property-sale-page__field">
            <label className={`property-sale-page__checkbox-label ${errors.acceptTerms ? "property-sale-page__checkbox-label--error" : ""}`}>
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => {
                  setFormData({ ...formData, acceptTerms: e.target.checked });
                  if (errors.acceptTerms) {
                    setErrors({ ...errors, acceptTerms: null });
                  }
                }}
                className="property-sale-page__checkbox"
              />
              <span>
                I understand that once a buyer is found, I will need to transfer all profile details (email, phone, KYC info) to the buyer before withdrawal <span className="property-sale-page__required">*</span>
              </span>
            </label>
            {errors.acceptTerms && <span className="property-sale-page__error">{errors.acceptTerms}</span>}
          </div>

          {/* Actions */}
          <div className="property-sale-page__actions">
            <button type="button" className="property-sale-page__btn property-sale-page__btn--cancel" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="property-sale-page__btn property-sale-page__btn--submit">
              List for Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertySale;

