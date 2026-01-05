import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext.jsx";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const paymentData = location.state;

  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  if (!paymentData) {
    return (
      <div className="payment-page">
        <div className="payment-page__error">
          <h2>No Payment Data</h2>
          <p>Please start from the investment page.</p>
          <button onClick={() => navigate("/explore")} className="payment-page__btn">
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-page__container">
        <div className="payment-page__header">
          <button onClick={() => navigate(-1)} className="btn-back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="payment-page__title">Payment</h1>
        </div>

        <div className="payment-page__content">
          <div className="payment-page__info-card">
            <h3 className="payment-page__info-title">Investment Details</h3>
            <div className="payment-page__info-item">
              <span className="payment-page__info-label">Property</span>
              <span className="payment-page__info-value">{paymentData.propertyTitle}</span>
            </div>
            <div className="payment-page__info-item">
              <span className="payment-page__info-label">Investment Amount</span>
              <span className="payment-page__info-value">{formatCurrency(paymentData.investmentAmount, "INR")}</span>
            </div>
            <div className="payment-page__info-item">
              <span className="payment-page__info-label">Time Period</span>
              <span className="payment-page__info-value">{paymentData.timePeriod} months</span>
            </div>
          </div>

          <div className="payment-page__amount-card">
            <div className="payment-page__amount-item">
              <span className="payment-page__amount-label">Amount to Pay</span>
              <span className="payment-page__amount-value">{formatCurrency(paymentData.investmentAmount, "INR")}</span>
            </div>
          </div>

          <div className="payment-page__message">
            <p>Payment gateway integration will be implemented here.</p>
            <p>Please implement your preferred payment gateway.</p>
          </div>

          <div className="payment-page__actions">
            <button onClick={() => navigate(-1)} className="payment-page__btn payment-page__btn--cancel">
              Cancel
            </button>
            <button onClick={() => showToast("Integrate soon", "info")} className="payment-page__btn payment-page__btn--primary">
              Proceed with Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;

