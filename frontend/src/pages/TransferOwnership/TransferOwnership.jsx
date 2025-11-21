import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const TransferOwnership = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { holdings } = useAppState();
  const { showToast } = useToast();
  const user = { name: "Yunus Ahmed", email: "yunus@example.com" }; // TODO: Get from context
  const holdingId = location.state?.holdingId;
  const buyerInfo = location.state?.buyerInfo;
  const salePrice = location.state?.salePrice;
  const holding = holdings.find((h) => h.id === holdingId);

  const [formData, setFormData] = useState({
    // Buyer Details (to be transferred)
    buyerName: buyerInfo?.name || "",
    buyerEmail: buyerInfo?.email || "",
    buyerPhone: buyerInfo?.phone || "",
    // KYC Details
    buyerPan: "",
    buyerAadhaar: "",
    // Bank Details
    buyerAccountNumber: "",
    buyerIfscCode: "",
    buyerAccountHolderName: "",
    // Password for buyer
    buyerPassword: "",
    confirmPassword: "",
    // Confirmation
    acceptTransfer: false,
    acceptWithdrawal: false,
  });
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: Buyer Info, 2: KYC, 3: Bank, 4: Confirm

  useEffect(() => {
    if (!holding) {
      navigate("/wallet");
    }
    if (buyerInfo) {
      setFormData((prev) => ({
        ...prev,
        buyerName: buyerInfo.name || "",
        buyerEmail: buyerInfo.email || "",
        buyerPhone: buyerInfo.phone || "",
      }));
    }
  }, [holding, buyerInfo, navigate]);

  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.buyerName.trim()) newErrors.buyerName = "Buyer name is required";
      if (!formData.buyerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail)) {
        newErrors.buyerEmail = "Valid email is required";
      }
      if (!formData.buyerPhone.trim() || !/^\d{10}$/.test(formData.buyerPhone)) {
        newErrors.buyerPhone = "Valid 10-digit phone number is required";
      }
    }

    if (step === 2) {
      if (!formData.buyerPan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.buyerPan.toUpperCase())) {
        newErrors.buyerPan = "Valid PAN number is required (e.g., ABCDE1234F)";
      }
      if (!formData.buyerAadhaar.trim() || !/^\d{12}$/.test(formData.buyerAadhaar)) {
        newErrors.buyerAadhaar = "Valid 12-digit Aadhaar number is required";
      }
    }

    if (step === 3) {
      if (!formData.buyerAccountNumber.trim()) newErrors.buyerAccountNumber = "Account number is required";
      if (!formData.buyerIfscCode.trim() || formData.buyerIfscCode.length !== 11) {
        newErrors.buyerIfscCode = "Valid IFSC code is required (11 characters)";
      }
      if (!formData.buyerAccountHolderName.trim()) newErrors.buyerAccountHolderName = "Account holder name is required";
    }

    if (step === 4) {
      if (!formData.buyerPassword.trim() || formData.buyerPassword.length < 8) {
        newErrors.buyerPassword = "Password must be at least 8 characters";
      }
      if (formData.buyerPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!formData.acceptTransfer) {
        newErrors.acceptTransfer = "You must accept the transfer terms";
      }
      if (!formData.acceptWithdrawal) {
        newErrors.acceptWithdrawal = "You must confirm withdrawal eligibility";
      }
    }

    return newErrors;
  };

  const handleNext = () => {
    // Show alert for KYC step
    if (currentStep === 2) {
      showToast('Integrate soon', 'info');
      return;
    }
    
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length === 0) {
      setErrors({});
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      setErrors(stepErrors);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = () => {
    const finalErrors = validateStep(4);
    if (Object.keys(finalErrors).length === 0) {
      // Transfer ownership
      console.log("Transferring ownership:", {
        holdingId,
        fromUser: user,
        toUser: {
          name: formData.buyerName,
          email: formData.buyerEmail,
          phone: formData.buyerPhone,
          pan: formData.buyerPan,
          aadhaar: formData.buyerAadhaar,
          bank: {
            accountNumber: formData.buyerAccountNumber,
            ifscCode: formData.buyerIfscCode,
            accountHolderName: formData.buyerAccountHolderName,
          },
          password: formData.buyerPassword,
        },
        salePrice,
      });

      showToast(
        `Ownership transfer initiated! Profile details have been updated. You can now proceed with withdrawal.`,
        "success"
      );

      // Navigate to withdrawal with updated info
      navigate("/wallet", {
        state: {
          canWithdraw: true,
          transferCompleted: true,
          saleAmount: salePrice || holding.amountInvested,
        },
      });
    } else {
      setErrors(finalErrors);
    }
  };

  if (!holding) {
    return null;
  }

  return (
    <div className="transfer-ownership-page">
      <div className="transfer-ownership-page__container">
        {/* Header */}
        <div className="transfer-ownership-page__header">
          <button className="transfer-ownership-page__back" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="transfer-ownership-page__title">Transfer Ownership</h1>
          <div style={{ width: "24px" }}></div>
        </div>

        {/* Progress Steps */}
        <div className="transfer-ownership-page__progress">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="transfer-ownership-page__progress-step">
              <div className={`transfer-ownership-page__progress-number ${currentStep >= step ? "transfer-ownership-page__progress-number--active" : ""}`}>
                {currentStep > step ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span className={`transfer-ownership-page__progress-label ${currentStep >= step ? "transfer-ownership-page__progress-label--active" : ""}`}>
                {step === 1 ? "Buyer Info" : step === 2 ? "KYC Details" : step === 3 ? "Bank Details" : "Confirm"}
              </span>
            </div>
          ))}
        </div>

        {/* Property Info */}
        <div className="transfer-ownership-page__property-card">
          <h3 className="transfer-ownership-page__card-title">Property Details</h3>
          <div className="transfer-ownership-page__property-info">
            <div className="transfer-ownership-page__property-item">
              <span className="transfer-ownership-page__property-label">Property</span>
              <span className="transfer-ownership-page__property-value">{holding.name}</span>
            </div>
            <div className="transfer-ownership-page__property-item">
              <span className="transfer-ownership-page__property-label">Sale Price</span>
              <span className="transfer-ownership-page__property-value transfer-ownership-page__property-value--highlight">
                {formatCurrency(salePrice || holding.amountInvested, "INR")}
              </span>
            </div>
          </div>
        </div>

        {/* Current Owner Info */}
        <div className="transfer-ownership-page__current-owner">
          <h3 className="transfer-ownership-page__section-title">Current Owner Details</h3>
          <div className="transfer-ownership-page__owner-info">
            <div className="transfer-ownership-page__owner-item">
              <span className="transfer-ownership-page__owner-label">Name</span>
              <span className="transfer-ownership-page__owner-value">{user.name}</span>
            </div>
            <div className="transfer-ownership-page__owner-item">
              <span className="transfer-ownership-page__owner-label">Email</span>
              <span className="transfer-ownership-page__owner-value">{user.email || "N/A"}</span>
            </div>
          </div>
          <p className="transfer-ownership-page__transfer-note">
            ⚠️ All these details will be transferred to the buyer below
          </p>
        </div>

        {/* Step 1: Buyer Basic Info */}
        {currentStep === 1 && (
          <div className="transfer-ownership-page__step-content">
            <h3 className="transfer-ownership-page__step-title">Buyer Basic Information</h3>
            <p className="transfer-ownership-page__step-description">Enter the buyer's basic contact details</p>

            <div className="transfer-ownership-page__field">
              <label htmlFor="buyer-name" className="transfer-ownership-page__label">
                Buyer Full Name <span className="transfer-ownership-page__required">*</span>
              </label>
              <input
                id="buyer-name"
                type="text"
                value={formData.buyerName}
                onChange={(e) => {
                  setFormData({ ...formData, buyerName: e.target.value });
                  if (errors.buyerName) setErrors({ ...errors, buyerName: null });
                }}
                className={`transfer-ownership-page__input ${errors.buyerName ? "transfer-ownership-page__input--error" : ""}`}
                placeholder="Enter buyer's full name"
              />
              {errors.buyerName && <span className="transfer-ownership-page__error">{errors.buyerName}</span>}
            </div>

            <div className="transfer-ownership-page__field">
              <label htmlFor="buyer-email" className="transfer-ownership-page__label">
                Buyer Email <span className="transfer-ownership-page__required">*</span>
              </label>
              <input
                id="buyer-email"
                type="email"
                value={formData.buyerEmail}
                onChange={(e) => {
                  setFormData({ ...formData, buyerEmail: e.target.value });
                  if (errors.buyerEmail) setErrors({ ...errors, buyerEmail: null });
                }}
                className={`transfer-ownership-page__input ${errors.buyerEmail ? "transfer-ownership-page__input--error" : ""}`}
                placeholder="Enter buyer's email address"
              />
              {errors.buyerEmail && <span className="transfer-ownership-page__error">{errors.buyerEmail}</span>}
            </div>

            <div className="transfer-ownership-page__field">
              <label htmlFor="buyer-phone" className="transfer-ownership-page__label">
                Buyer Phone <span className="transfer-ownership-page__required">*</span>
              </label>
              <input
                id="buyer-phone"
                type="tel"
                maxLength="10"
                value={formData.buyerPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, buyerPhone: value });
                  if (errors.buyerPhone) setErrors({ ...errors, buyerPhone: null });
                }}
                className={`transfer-ownership-page__input ${errors.buyerPhone ? "transfer-ownership-page__input--error" : ""}`}
                placeholder="Enter buyer's phone number"
              />
              {errors.buyerPhone && <span className="transfer-ownership-page__error">{errors.buyerPhone}</span>}
            </div>
          </div>
        )}

        {/* Step 2: KYC Details */}
        {currentStep === 2 && (
          <div className="transfer-ownership-page__step-content">
            <h3 className="transfer-ownership-page__step-title">Buyer KYC Details</h3>
            <p className="transfer-ownership-page__step-description">Enter the buyer's KYC information (mandatory)</p>

            <div className="transfer-ownership-page__field">
              <label htmlFor="buyer-pan" className="transfer-ownership-page__label">
                PAN Card Number <span className="transfer-ownership-page__required">*</span>
              </label>
              <input
                id="buyer-pan"
                type="text"
                maxLength="10"
                value={formData.buyerPan}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setFormData({ ...formData, buyerPan: value });
                  if (errors.buyerPan) setErrors({ ...errors, buyerPan: null });
                }}
                className={`transfer-ownership-page__input ${errors.buyerPan ? "transfer-ownership-page__input--error" : ""}`}
                placeholder="ABCDE1234F"
                style={{ textTransform: "uppercase" }}
              />
              {errors.buyerPan && <span className="transfer-ownership-page__error">{errors.buyerPan}</span>}
            </div>

            <div className="transfer-ownership-page__field">
              <label htmlFor="buyer-aadhaar" className="transfer-ownership-page__label">
                Aadhaar Number <span className="transfer-ownership-page__required">*</span>
              </label>
              <input
                id="buyer-aadhaar"
                type="text"
                maxLength="12"
                value={formData.buyerAadhaar}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, buyerAadhaar: value });
                  if (errors.buyerAadhaar) setErrors({ ...errors, buyerAadhaar: null });
                }}
                className={`transfer-ownership-page__input ${errors.buyerAadhaar ? "transfer-ownership-page__input--error" : ""}`}
                placeholder="Enter 12-digit Aadhaar number"
              />
              {errors.buyerAadhaar && <span className="transfer-ownership-page__error">{errors.buyerAadhaar}</span>}
            </div>
          </div>
        )}

        {/* Step 3: Bank Details */}
        {currentStep === 3 && (
          <div className="transfer-ownership-page__step-content">
            <h3 className="transfer-ownership-page__step-title">Buyer Bank Details</h3>
            <p className="transfer-ownership-page__step-description">Enter the buyer's bank account information</p>

            <div className="transfer-ownership-page__field">
              <label htmlFor="buyer-account-number" className="transfer-ownership-page__label">
                Account Number <span className="transfer-ownership-page__required">*</span>
              </label>
              <input
                id="buyer-account-number"
                type="text"
                value={formData.buyerAccountNumber}
                onChange={(e) => {
                  setFormData({ ...formData, buyerAccountNumber: e.target.value });
                  if (errors.buyerAccountNumber) setErrors({ ...errors, buyerAccountNumber: null });
                }}
                className={`transfer-ownership-page__input ${errors.buyerAccountNumber ? "transfer-ownership-page__input--error" : ""}`}
                placeholder="Enter account number"
              />
              {errors.buyerAccountNumber && <span className="transfer-ownership-page__error">{errors.buyerAccountNumber}</span>}
            </div>

            <div className="transfer-ownership-page__field">
              <label htmlFor="buyer-ifsc" className="transfer-ownership-page__label">
                IFSC Code <span className="transfer-ownership-page__required">*</span>
              </label>
              <input
                id="buyer-ifsc"
                type="text"
                maxLength="11"
                value={formData.buyerIfscCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setFormData({ ...formData, buyerIfscCode: value });
                  if (errors.buyerIfscCode) setErrors({ ...errors, buyerIfscCode: null });
                }}
                className={`transfer-ownership-page__input ${errors.buyerIfscCode ? "transfer-ownership-page__input--error" : ""}`}
                placeholder="Enter IFSC code"
                style={{ textTransform: "uppercase" }}
              />
              {errors.buyerIfscCode && <span className="transfer-ownership-page__error">{errors.buyerIfscCode}</span>}
            </div>

            <div className="transfer-ownership-page__field">
              <label htmlFor="buyer-account-holder" className="transfer-ownership-page__label">
                Account Holder Name <span className="transfer-ownership-page__required">*</span>
              </label>
              <input
                id="buyer-account-holder"
                type="text"
                value={formData.buyerAccountHolderName}
                onChange={(e) => {
                  setFormData({ ...formData, buyerAccountHolderName: e.target.value });
                  if (errors.buyerAccountHolderName) setErrors({ ...errors, buyerAccountHolderName: null });
                }}
                className={`transfer-ownership-page__input ${errors.buyerAccountHolderName ? "transfer-ownership-page__input--error" : ""}`}
                placeholder="Enter account holder name"
              />
              {errors.buyerAccountHolderName && <span className="transfer-ownership-page__error">{errors.buyerAccountHolderName}</span>}
            </div>
          </div>
        )}

        {/* Step 4: Confirm & Password */}
        {currentStep === 4 && (
          <div className="transfer-ownership-page__step-content">
            <h3 className="transfer-ownership-page__step-title">Confirm Transfer</h3>
            <p className="transfer-ownership-page__step-description">Set password for buyer and confirm transfer</p>

            <div className="transfer-ownership-page__field">
              <label htmlFor="buyer-password" className="transfer-ownership-page__label">
                Set Password for Buyer <span className="transfer-ownership-page__required">*</span>
              </label>
              <input
                id="buyer-password"
                type="password"
                value={formData.buyerPassword}
                onChange={(e) => {
                  setFormData({ ...formData, buyerPassword: e.target.value });
                  if (errors.buyerPassword) setErrors({ ...errors, buyerPassword: null });
                }}
                className={`transfer-ownership-page__input ${errors.buyerPassword ? "transfer-ownership-page__input--error" : ""}`}
                placeholder="Minimum 8 characters"
              />
              {errors.buyerPassword && <span className="transfer-ownership-page__error">{errors.buyerPassword}</span>}
            </div>

            <div className="transfer-ownership-page__field">
              <label htmlFor="confirm-password" className="transfer-ownership-page__label">
                Confirm Password <span className="transfer-ownership-page__required">*</span>
              </label>
              <input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                className={`transfer-ownership-page__input ${errors.confirmPassword ? "transfer-ownership-page__input--error" : ""}`}
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && <span className="transfer-ownership-page__error">{errors.confirmPassword}</span>}
            </div>

            {/* Transfer Summary */}
            <div className="transfer-ownership-page__transfer-summary">
              <h4 className="transfer-ownership-page__summary-title">Transfer Summary</h4>
              <div className="transfer-ownership-page__summary-item">
                <span className="transfer-ownership-page__summary-label">From (You)</span>
                <span className="transfer-ownership-page__summary-value">{user.name}</span>
              </div>
              <div className="transfer-ownership-page__summary-item">
                <span className="transfer-ownership-page__summary-label">To (Buyer)</span>
                <span className="transfer-ownership-page__summary-value">{formData.buyerName}</span>
              </div>
              <div className="transfer-ownership-page__summary-item">
                <span className="transfer-ownership-page__summary-label">Property</span>
                <span className="transfer-ownership-page__summary-value">{holding.name}</span>
              </div>
              <div className="transfer-ownership-page__summary-item transfer-ownership-page__summary-item--total">
                <span className="transfer-ownership-page__summary-label">Sale Proceeds</span>
                <span className="transfer-ownership-page__summary-value transfer-ownership-page__summary-value--highlight">
                  {formatCurrency(salePrice || holding.amountInvested, "INR")}
                </span>
              </div>
            </div>

            <div className="transfer-ownership-page__field">
              <label className={`transfer-ownership-page__checkbox-label ${errors.acceptTransfer ? "transfer-ownership-page__checkbox-label--error" : ""}`}>
                <input
                  type="checkbox"
                  checked={formData.acceptTransfer}
                  onChange={(e) => {
                    setFormData({ ...formData, acceptTransfer: e.target.checked });
                    if (errors.acceptTransfer) setErrors({ ...errors, acceptTransfer: null });
                  }}
                  className="transfer-ownership-page__checkbox"
                />
                <span>
                  I confirm that all profile details (email: {formData.buyerEmail}, phone: {formData.buyerPhone}) and KYC information will be transferred to the buyer <span className="transfer-ownership-page__required">*</span>
                </span>
              </label>
              {errors.acceptTransfer && <span className="transfer-ownership-page__error">{errors.acceptTransfer}</span>}
            </div>

            <div className="transfer-ownership-page__field">
              <label className={`transfer-ownership-page__checkbox-label ${errors.acceptWithdrawal ? "transfer-ownership-page__checkbox-label--error" : ""}`}>
                <input
                  type="checkbox"
                  checked={formData.acceptWithdrawal}
                  onChange={(e) => {
                    setFormData({ ...formData, acceptWithdrawal: e.target.checked });
                    if (errors.acceptWithdrawal) setErrors({ ...errors, acceptWithdrawal: null });
                  }}
                  className="transfer-ownership-page__checkbox"
                />
                <span>
                  I understand that withdrawal will only be possible after ownership transfer is completed <span className="transfer-ownership-page__required">*</span>
                </span>
              </label>
              {errors.acceptWithdrawal && <span className="transfer-ownership-page__error">{errors.acceptWithdrawal}</span>}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="transfer-ownership-page__actions">
          {currentStep > 1 && (
            <button type="button" className="transfer-ownership-page__btn transfer-ownership-page__btn--cancel" onClick={handleBack}>
              Back
            </button>
          )}
          {currentStep < 4 ? (
            <button type="button" className="transfer-ownership-page__btn transfer-ownership-page__btn--primary" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button type="button" className="transfer-ownership-page__btn transfer-ownership-page__btn--submit" onClick={handleSubmit}>
              Complete Transfer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferOwnership;

