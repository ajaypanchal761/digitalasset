import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";

const PropertySaleOffline = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { holdings } = useAppState();
  const holdingId = location.state?.holdingId;
  const holding = holdings.find((h) => h.id === holdingId);

  const [formData, setFormData] = useState({
    buyerFound: false,
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    salePrice: holding?.amountInvested || 0,
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

    if (!formData.buyerFound) {
      newErrors.buyerFound = "Please confirm if buyer is found";
    } else {
      if (!formData.buyerName.trim()) {
        newErrors.buyerName = "Buyer name is required";
      }
      if (!formData.buyerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail)) {
        newErrors.buyerEmail = "Valid buyer email is required";
      }
      if (!formData.buyerPhone.trim() || !/^\d{10}$/.test(formData.buyerPhone)) {
        newErrors.buyerPhone = "Valid 10-digit phone number is required";
      }
      if (!formData.salePrice || formData.salePrice < holding.amountInvested * 0.8) {
        newErrors.salePrice = `Minimum sale price is ${formatCurrency(holding.amountInvested * 0.8, "INR")}`;
      }
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms";
    }

    if (Object.keys(newErrors).length === 0) {
      // Navigate to transfer ownership page
      navigate("/transfer-ownership", {
        state: {
          holdingId: holding.id,
          buyerInfo: {
            name: formData.buyerName,
            email: formData.buyerEmail,
            phone: formData.buyerPhone,
          },
          salePrice: formData.salePrice,
        },
      });
    } else {
      setErrors(newErrors);
    }
  };

  if (!holding) {
    return null;
  }

  return (
    <div className="property-sale-offline-page">
      <div className="property-sale-offline-page__container">
        {/* Header */}
        <div className="property-sale-offline-page__header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="property-sale-offline-page__title">Offline Sale</h1>
          <div style={{ width: "24px" }}></div>
        </div>

        {/* Info Card */}
        <div className="property-sale-offline-page__info-card">
          <div className="property-sale-offline-page__icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="property-sale-offline-page__info-title">Arrange Offline Sale</h2>
          <p className="property-sale-offline-page__info-text">
            If you've found a buyer outside the platform, provide their details below. You'll need to transfer all profile details to them before completing the sale.
          </p>
        </div>

        {/* Property Info */}
        <div className="property-sale-offline-page__property-card">
          <h3 className="property-sale-offline-page__card-title">Property Details</h3>
          <div className="property-sale-offline-page__property-info">
            <div className="property-sale-offline-page__property-item">
              <span className="property-sale-offline-page__property-label">Property Name</span>
              <span className="property-sale-offline-page__property-value">{holding.name}</span>
            </div>
            <div className="property-sale-offline-page__property-item">
              <span className="property-sale-offline-page__property-label">Your Investment</span>
              <span className="property-sale-offline-page__property-value">{formatCurrency(holding.amountInvested, "INR")}</span>
            </div>
          </div>
        </div>

        {/* Sale Form */}
        <form className="property-sale-offline-page__form" onSubmit={handleSubmit}>
          <h3 className="property-sale-offline-page__form-title">Buyer Information</h3>

          {/* Buyer Found Toggle */}
          <div className="property-sale-offline-page__field">
            <label className={`property-sale-offline-page__checkbox-label ${errors.buyerFound ? "property-sale-offline-page__checkbox-label--error" : ""}`}>
              <input
                type="checkbox"
                checked={formData.buyerFound}
                onChange={(e) => {
                  setFormData({ ...formData, buyerFound: e.target.checked });
                  if (errors.buyerFound) {
                    setErrors({ ...errors, buyerFound: null });
                  }
                }}
                className="property-sale-offline-page__checkbox"
              />
              <span>
                I have found a buyer for this property <span className="property-sale-offline-page__required">*</span>
              </span>
            </label>
            {errors.buyerFound && <span className="property-sale-offline-page__error">{errors.buyerFound}</span>}
          </div>

          {formData.buyerFound && (
            <>
              {/* Buyer Name */}
              <div className="property-sale-offline-page__field">
                <label htmlFor="buyer-name" className="property-sale-offline-page__label">
                  Buyer Name <span className="property-sale-offline-page__required">*</span>
                </label>
                <input
                  id="buyer-name"
                  type="text"
                  value={formData.buyerName}
                  onChange={(e) => {
                    setFormData({ ...formData, buyerName: e.target.value });
                    if (errors.buyerName) {
                      setErrors({ ...errors, buyerName: null });
                    }
                  }}
                  className={`property-sale-offline-page__input ${errors.buyerName ? "property-sale-offline-page__input--error" : ""}`}
                  placeholder="Enter buyer's full name"
                />
                {errors.buyerName && <span className="property-sale-offline-page__error">{errors.buyerName}</span>}
              </div>

              {/* Buyer Email */}
              <div className="property-sale-offline-page__field">
                <label htmlFor="buyer-email" className="property-sale-offline-page__label">
                  Buyer Email <span className="property-sale-offline-page__required">*</span>
                </label>
                <input
                  id="buyer-email"
                  type="email"
                  value={formData.buyerEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, buyerEmail: e.target.value });
                    if (errors.buyerEmail) {
                      setErrors({ ...errors, buyerEmail: null });
                    }
                  }}
                  className={`property-sale-offline-page__input ${errors.buyerEmail ? "property-sale-offline-page__input--error" : ""}`}
                  placeholder="Enter buyer's email address"
                />
                {errors.buyerEmail && <span className="property-sale-offline-page__error">{errors.buyerEmail}</span>}
              </div>

              {/* Buyer Phone */}
              <div className="property-sale-offline-page__field">
                <label htmlFor="buyer-phone" className="property-sale-offline-page__label">
                  Buyer Phone <span className="property-sale-offline-page__required">*</span>
                </label>
                <input
                  id="buyer-phone"
                  type="tel"
                  maxLength="10"
                  value={formData.buyerPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, buyerPhone: value });
                    if (errors.buyerPhone) {
                      setErrors({ ...errors, buyerPhone: null });
                    }
                  }}
                  className={`property-sale-offline-page__input ${errors.buyerPhone ? "property-sale-offline-page__input--error" : ""}`}
                  placeholder="Enter buyer's phone number"
                />
                {errors.buyerPhone && <span className="property-sale-offline-page__error">{errors.buyerPhone}</span>}
              </div>

              {/* Sale Price */}
              <div className="property-sale-offline-page__field">
                <label htmlFor="sale-price" className="property-sale-offline-page__label">
                  Sale Price (₹) <span className="property-sale-offline-page__required">*</span>
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
                  className={`property-sale-offline-page__input ${errors.salePrice ? "property-sale-offline-page__input--error" : ""}`}
                  placeholder="Enter sale price"
                />
                {errors.salePrice && <span className="property-sale-offline-page__error">{errors.salePrice}</span>}
                <span className="property-sale-offline-page__hint">
                  Minimum: {formatCurrency(holding.amountInvested * 0.8, "INR")} (80% of your investment)
                </span>
              </div>
            </>
          )}

          {/* Terms */}
          <div className="property-sale-offline-page__field">
            <label className={`property-sale-offline-page__checkbox-label ${errors.acceptTerms ? "property-sale-offline-page__checkbox-label--error" : ""}`}>
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => {
                  setFormData({ ...formData, acceptTerms: e.target.checked });
                  if (errors.acceptTerms) {
                    setErrors({ ...errors, acceptTerms: null });
                  }
                }}
                className="property-sale-offline-page__checkbox"
              />
              <span>
                I understand that I must transfer all profile details (email, phone, KYC info) to the buyer before withdrawal <span className="property-sale-offline-page__required">*</span>
              </span>
            </label>
            {errors.acceptTerms && <span className="property-sale-offline-page__error">{errors.acceptTerms}</span>}
          </div>

          {/* Actions */}
          <div className="property-sale-offline-page__actions">
            <button type="button" className="property-sale-offline-page__btn property-sale-offline-page__btn--cancel" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="property-sale-offline-page__btn property-sale-offline-page__btn--submit" disabled={!formData.buyerFound}>
              Proceed to Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertySaleOffline;

