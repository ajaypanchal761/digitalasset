import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";

const WithdrawInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { holdings } = useAppState();
  const holdingId = location.state?.holdingId; // If coming from specific holding
  
  // More robust holding lookup - convert both to strings for comparison
  const holding = holdingId ? holdings.find((h) => {
    const hId = (h._id || h.id)?.toString();
    const searchId = holdingId?.toString();
    return hId === searchId;
  }) : null;

  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="withdraw-info-page">
      <div className="withdraw-info-page__container">
        {/* Header */}
        <div className="withdraw-info-page__header">
          <button className="withdraw-info-page__back" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="withdraw-info-page__title">Withdrawal Process</h1>
          <div style={{ width: "24px" }}></div>
        </div>

        {/* Info Card */}
        <div className="withdraw-info-page__info-card">
          <div className="withdraw-info-page__icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12 16V12M12 8H12.01" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="withdraw-info-page__info-title">Property Sale Required for Withdrawal</h2>
          <p className="withdraw-info-page__info-text">
            To withdraw your invested amount, you must first sell your property holding to another buyer. The property cannot be directly withdrawn until ownership is transferred.
          </p>
        </div>

        {/* Process Steps */}
        <div className="withdraw-info-page__process">
          <h3 className="withdraw-info-page__process-title">How It Works</h3>
          <div className="withdraw-info-page__steps">
          <div className="withdraw-info-page__step">
            <div className="withdraw-info-page__step-number">1</div>
            <div className="withdraw-info-page__step-content">
              <h4 className="withdraw-info-page__step-title">Contact Owner or Find Buyer</h4>
              <p className="withdraw-info-page__step-text">Contact the property owner for sale options or find a buyer from the platform</p>
            </div>
          </div>

            <div className="withdraw-info-page__step">
              <div className="withdraw-info-page__step-number">2</div>
              <div className="withdraw-info-page__step-content">
                <h4 className="withdraw-info-page__step-title">Find a Buyer</h4>
                <p className="withdraw-info-page__step-text">Wait for a buyer to purchase your property holding</p>
              </div>
            </div>

            <div className="withdraw-info-page__step">
              <div className="withdraw-info-page__step-number">3</div>
              <div className="withdraw-info-page__step-content">
                <h4 className="withdraw-info-page__step-title">Transfer Ownership</h4>
                <p className="withdraw-info-page__step-text">Transfer all profile details (email, phone, etc.) to the new buyer</p>
              </div>
            </div>

            <div className="withdraw-info-page__step">
              <div className="withdraw-info-page__step-number">4</div>
              <div className="withdraw-info-page__step-content">
                <h4 className="withdraw-info-page__step-title">Complete Withdrawal</h4>
                <p className="withdraw-info-page__step-text">Once ownership is transferred, you can withdraw the sale proceeds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sale Options */}
        <div className="withdraw-info-page__options">
          <h3 className="withdraw-info-page__options-title">Choose Your Sale Method</h3>
          <div className="withdraw-info-page__options-grid">
            <div className="withdraw-info-page__option-card" onClick={() => navigate("/contact-owner", { state: { holdingId } })}>
              <div className="withdraw-info-page__option-icon withdraw-info-page__option-icon--blue">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="withdraw-info-page__option-title">Contact Owner for Sale</h4>
              <p className="withdraw-info-page__option-text">Get in touch with the property owner to discuss sale options</p>
              <span className="withdraw-info-page__option-badge">Recommended</span>
            </div>

            <div className="withdraw-info-page__option-card" onClick={() => navigate("/find-buyer", { state: { holdingId } })}>
              <div className="withdraw-info-page__option-icon withdraw-info-page__option-icon--green">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="withdraw-info-page__option-title">Find Buyer</h4>
              <p className="withdraw-info-page__option-text">Find a buyer from the platform to purchase your property holding</p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="withdraw-info-page__notes">
          <h3 className="withdraw-info-page__notes-title">Important Information</h3>
          <ul className="withdraw-info-page__notes-list">
            <li className="withdraw-info-page__note-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>All profile details including email, phone number, and mandatory KYC information must be transferred to the buyer</span>
            </li>
            <li className="withdraw-info-page__note-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Withdrawal is only possible after successful ownership transfer is completed</span>
            </li>
            <li className="withdraw-info-page__note-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sale proceeds will be credited to your wallet once the transfer process is verified</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="withdraw-info-page__actions">
          <button className="withdraw-info-page__btn withdraw-info-page__btn--primary" onClick={() => navigate("/contact-owner", { state: { holdingId } })}>
            Contact Owner
          </button>
          <button className="withdraw-info-page__btn withdraw-info-page__btn--outline" onClick={() => navigate("/find-buyer", { state: { holdingId } })}>
            Find Buyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawInfo;

