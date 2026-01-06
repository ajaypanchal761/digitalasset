import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const Invest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { listings } = useAppState();
  const { showToast } = useToast();
  const { user } = useAuth();
  const propertyId = location.state?.propertyId;
  const property = listings.find((p) => (p._id || p.id) === propertyId);

  const [formData, setFormData] = useState({
    amount: property?.minInvestment || 500000,
    timePeriod: 3,
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (property) {
      setFormData((prev) => ({
        ...prev,
        amount: property.minInvestment || 500000,
      }));
    }
    // If no property found, redirect to explore
    if (!property && propertyId) {
      navigate("/explore");
    }
  }, [property, propertyId, navigate]);

  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const minInvestment = property?.minInvestment || 500000;

    if (!formData.amount || formData.amount < minInvestment) {
      newErrors.amount = `Minimum investment is ${formatCurrency(minInvestment, "INR")}`;
    }

    if (formData.timePeriod !== 3) {
      newErrors.timePeriod = "Investment period must be 3 months";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check KYC status
    if (!user || user.kycStatus !== 'approved') {
      showToast('Please complete KYC verification before investing', 'error');
      navigate('/kyc');
      return;
    }

    // Check if property is active
    if (property && property.status !== 'active') {
      showToast(`This property is ${property.status}. Only active properties are available for investment.`, 'error');
      navigate('/explore');
      return;
    }

    if (validateForm()) {
      // Navigate to investment request form with investment data
      navigate("/invest/request", {
        state: {
          propertyId: property?._id || property?.id,
          propertyTitle: property?.title,
          property: property,
          investmentAmount: formData.amount,
          timePeriod: formData.timePeriod,
          monthlyEarning: formData.amount * 0.005,
          totalEarnings: formData.timePeriod <= 3 ? 0 : formData.amount * 0.005 * (formData.timePeriod - 3),
          maturityAmount: formData.amount + (formData.timePeriod <= 3 ? 0 : formData.amount * 0.005 * (formData.timePeriod - 3)),
        },
      });
    }
  };

  const monthlyEarning = formData.amount * 0.005;
  // During 3-month lock period, payout earnings are 0
  // After 3 months, 0.5% monthly payout is generated if property is not sold
  const totalEarnings = formData.timePeriod <= 3 ? 0 : monthlyEarning * (formData.timePeriod - 3);
  // Total amount after maturity is the investment amount (principal returned after lock-in) plus earnings generated after lock-in
  const maturityAmount = formData.amount + totalEarnings;

  // Calculate withdrawal availability date (3-month lock-in period)
  const calculateMaturityDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // Always 3 months lock-in period
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!property) {
    return (
      <div className="invest-page">
        <div className="invest-page__container">
          <div className="invest-page__header">
            <button onClick={() => navigate(-1)} className="btn-back" aria-label="Go back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="invest-page__title">My Investments</h1>
            <div className="invest-page__header-spacer"></div>
          </div>
          <div className="invest-page__not-found">
            <h2>Property Not Found</h2>
            <p>Please select a property to invest in.</p>
            <button onClick={() => navigate("/explore")} className="invest-page__btn invest-page__btn--primary">
              Browse Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invest-page">
      <div className="invest-page__container">
        {/* Header */}
        <div className="invest-page__header">
          <button onClick={() => navigate(-1)} className="btn-back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="invest-page__title">Invest in {property.title}</h1>
          <div className="invest-page__header-spacer"></div>
        </div>

        {/* Property Info Card */}
        <div className="invest-page__property-card">
          <div className="invest-page__property-info">
            <div className="invest-page__property-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#e0e7ff" />
                <path
                  d="M16 8L24 12V20L16 24L8 20V12L16 8Z"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="invest-page__property-details">
              <h3 className="invest-page__property-title">{property.title}</h3>
              <p className="invest-page__property-type">Digital Property</p>
            </div>
          </div>
          <div className="invest-page__property-stats">
            <div className="invest-page__stat-item">
              <span className="invest-page__stat-label">Min Investment</span>
              <span className="invest-page__stat-value">{formatCurrency(property.minInvestment || 500000, "INR")}</span>
            </div>
            <div className="invest-page__stat-item">
              <span className="invest-page__stat-label">Monthly return after 3 month of lock</span>
              <span className="invest-page__stat-value invest-page__stat-value--green">0.5%</span>
            </div>
          </div>
        </div>

        {/* Investment Form */}
        <form onSubmit={handleSubmit} className="invest-page__form">
          {/* Investment Amount */}
          <div className="invest-page__field">
            <label htmlFor="amount" className="invest-page__label">
              Investment Amount (₹) <span className="invest-page__required">*</span>
            </label>
            <input
              id="amount"
              type="number"
              min={property.minInvestment || 500000}
              step={10000}
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", Math.max(property.minInvestment || 500000, parseInt(e.target.value) || property.minInvestment || 500000))}
              className={`invest-page__input ${errors.amount ? "invest-page__input--error" : ""}`}
              placeholder="Enter investment amount"
            />
            {errors.amount && <span className="invest-page__error">{errors.amount}</span>}
            <span className="invest-page__hint">Minimum: {formatCurrency(property.minInvestment || 500000, "INR")}</span>
          </div>

          {/* Time Period */}
          <div className="invest-page__field">
            <label htmlFor="timePeriod" className="invest-page__label">
              Investment Period (Months) <span className="invest-page__required">*</span>
            </label>
            <div className="invest-page__input invest-page__input--readonly">
              <span>3 Months (Lock-in Period)</span>
            </div>
            <span className="invest-page__hint">Fixed lock-in period of 3 months</span>
          </div>

          {/* Investment Summary */}
          <div className="invest-page__summary">
            <h3 className="invest-page__summary-title">Investment Summary</h3>
            <div className="invest-page__summary-list">
              <div className="invest-page__summary-item">
                <span className="invest-page__summary-label">Investment Amount</span>
                <span className="invest-page__summary-value">{formatCurrency(formData.amount, "INR")}</span>
              </div>
              <div className="invest-page__summary-item">
                <span className="invest-page__summary-label">Monthly return after 3 month of lock</span>
                <span className="invest-page__summary-value invest-page__summary-value--green">0.5%</span>
              </div>
              <div className="invest-page__summary-item">
                <span className="invest-page__summary-label">Monthly Earning</span>
                <span className="invest-page__summary-value invest-page__summary-value--green">
                  {formatCurrency(monthlyEarning, "INR")}/month
                </span>
                <span className="invest-page__summary-subtext">
                  (starts after 3-month lock-in)
                </span>
              </div>
              <div className="invest-page__summary-item">
                <span className="invest-page__summary-label">Investment Period</span>
                <span className="invest-page__summary-value">{formData.timePeriod} months</span>
              </div>
              <div className="invest-page__summary-item">
                <span className="invest-page__summary-label">Lock-in Period</span>
                <span className="invest-page__summary-value">3 months (required)</span>
              </div>
              <div className="invest-page__summary-item">
                <span className="invest-page__summary-label">Withdrawal Available</span>
                <span className="invest-page__summary-value">{calculateMaturityDate()}</span>
              </div>
              <div className="invest-page__summary-item">
                <span className="invest-page__summary-label">Total Earnings</span>
                <span className="invest-page__summary-value invest-page__summary-value--green">
                  {formatCurrency(totalEarnings, "INR")}
                </span>
              </div>
              <div className="invest-page__summary-item invest-page__summary-item--total">
                <span className="invest-page__summary-label">Total Amount After Maturity</span>
                <span className="invest-page__summary-value invest-page__summary-value--highlight">
                  {formatCurrency(maturityAmount, "INR")}
                </span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="invest-page__field">
            <label className={`invest-page__checkbox-label ${errors.acceptTerms ? "invest-page__checkbox-label--error" : ""}`}>
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => handleInputChange("acceptTerms", e.target.checked)}
                className="invest-page__checkbox"
              />
              <span>
                I accept the <a href="#" onClick={(e) => e.preventDefault()} className="invest-page__link">Terms & Conditions</a> and
                understand the investment risks <span className="invest-page__required">*</span>
              </span>
            </label>
            {errors.acceptTerms && <span className="invest-page__error">{errors.acceptTerms}</span>}
          </div>

          {/* Submit Button */}
          <div className="invest-page__actions">
            <button type="button" onClick={() => navigate(-1)} className="invest-page__btn invest-page__btn--cancel">
              Cancel
            </button>
            <button type="submit" className="invest-page__btn invest-page__btn--primary">
              Invest Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Invest;
