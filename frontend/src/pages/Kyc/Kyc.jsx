import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./kyc.css";

const bankInitialState = {
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
};

const documentInitialState = {
  fullName: "",
  aadhaarNumber: "",
  panNumber: "",
};

const statusPresets = {
  pending: {
    label: "Pending",
    helper: "Your KYC details are under review. We will notify you once verification is complete.",
    reason: "Awaiting verification by compliance team.",
  },
  approved: {
    label: "Approved",
    helper: "Congratulations! Your KYC has been approved and you can start investing.",
    reason: "Documents validated successfully.",
  },
  rejected: {
    label: "Rejected",
    helper: "We could not verify your details. Please review the reason and resubmit.",
    reason: "Name on bank account does not match with provided documents.",
  },
};

const Kyc = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [bankForm, setBankForm] = useState(bankInitialState);
  const [documentForm, setDocumentForm] = useState(documentInitialState);
  const [formErrors, setFormErrors] = useState({});
  const [isStatusVisible, setIsStatusVisible] = useState(false);
  const [statusValue, setStatusValue] = useState("pending");
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  const activeStatus = useMemo(
    () => statusPresets[statusValue] ?? statusPresets.pending,
    [statusValue],
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateMobileView = (event) => setIsMobileView(event.matches);

    setIsMobileView(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateMobileView);
    } else {
      mediaQuery.addListener(updateMobileView);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateMobileView);
      } else {
        mediaQuery.removeListener(updateMobileView);
      }
    };
  }, []);

  useEffect(() => {
    const className = "kyc-hide-header";
    if (isMobileView) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }

    return () => {
      document.body.classList.remove(className);
    };
  }, [isMobileView]);

  useEffect(() => {
    if (!isStatusVisible || statusValue !== "pending") {
      return undefined;
    }

    const timer = setTimeout(() => {
      setStatusValue("approved");
      setTimeout(() => {
        navigate("/auth/login", { 
          replace: true,
          state: { 
            message: "KYC verification successful! Please login to continue." 
          }
        });
      }, 2000);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isStatusVisible, statusValue, navigate]);

  useEffect(() => {
    if (isStatusVisible && isMobileView) {
      // Scroll status into view on mobile when it appears
      const timer = setTimeout(() => {
        const statusElement = document.getElementById("kyc-status");
        const wrapperElement = document.querySelector(".kyc-wrapper");
        if (statusElement && wrapperElement) {
          // Calculate position relative to wrapper
          const wrapperRect = wrapperElement.getBoundingClientRect();
          const statusRect = statusElement.getBoundingClientRect();
          const scrollTop = wrapperElement.scrollTop;
          const targetScroll = scrollTop + (statusRect.top - wrapperRect.top) - 10;
          
          wrapperElement.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isStatusVisible, isMobileView]);

  const handleBankChange = (event) => {
    const { name, value } = event.target;
    setBankForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (event) => {
    const { name, value } = event.target;
    setDocumentForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateBankForm = () => {
    const errors = {};

    if (!bankForm.accountHolderName.trim()) {
      errors.accountHolderName = "Account holder name is required.";
    }
    if (!bankForm.accountNumber.trim()) {
      errors.accountNumber = "Account number is required.";
    } else if (!/^\d{9,18}$/.test(bankForm.accountNumber.trim())) {
      errors.accountNumber = "Enter a valid bank account number (9-18 digits).";
    }
    if (!bankForm.ifscCode.trim()) {
      errors.ifscCode = "IFSC code is required.";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.ifscCode.trim().toUpperCase())) {
      errors.ifscCode = "Enter a valid IFSC code (e.g., HDFC0001234).";
    }

    return errors;
  };

  const validateDocumentForm = () => {
    const errors = {};

    if (!documentForm.fullName.trim()) {
      errors.fullName = "Full name (as per Aadhaar) is required.";
    }
    if (!documentForm.aadhaarNumber.trim()) {
      errors.aadhaarNumber = "Aadhaar number is required.";
    } else if (!/^\d{12}$/.test(documentForm.aadhaarNumber.trim())) {
      errors.aadhaarNumber = "Aadhaar number must be 12 digits.";
    }
    if (!documentForm.panNumber.trim()) {
      errors.panNumber = "PAN number is required.";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(documentForm.panNumber.trim().toUpperCase())) {
      errors.panNumber = "Enter a valid PAN (e.g., ABCDE1234F).";
    }

    return errors;
  };

  const handleBankSubmit = (event) => {
    event.preventDefault();
    const errors = validateBankForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setCurrentStep(2);
  };

  const handleDocumentSubmit = (event) => {
    event.preventDefault();
    const errors = validateDocumentForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsStatusVisible(true);
    setStatusValue("pending");
  };

  const handleStatusChange = (event) => {
    setStatusValue(event.target.value);
  };

  const handleEditBankDetails = () => {
    setCurrentStep(1);
    setIsStatusVisible(false);
  };

  return (
    <div className="kyc-wrapper">
      <div className="kyc-card">
        <header className="kyc-header">
          <h1>KYC Verification</h1>
          <p>Complete your verification to unlock investments and payouts.</p>
        </header>

        {isStatusVisible && (
          <div className="kyc-status" id="kyc-status">
            <div className={`status-pill status-${statusValue}`}>{activeStatus.label}</div>
            <p className="status-helper">{activeStatus.helper}</p>

            {statusValue === "rejected" && (
              <div className="status-reason">
                <span className="reason-label">Reason</span>
                <p>{activeStatus.reason}</p>
              </div>
            )}

            <div className="status-selector">
              <label htmlFor="statusSelect">Preview status (UI only)</label>
              <select
                id="statusSelect"
                value={statusValue}
                onChange={handleStatusChange}
                aria-label="Preview KYC status"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        )}

        <div className="kyc-progress">
          <div className={`progress-step ${currentStep >= 1 ? "active" : ""}`}>
            <span className="step-index">1</span>
            <span className="step-label">Bank details</span>
          </div>
          <div className="progress-divider" />
          <div className={`progress-step ${currentStep >= 2 ? "active" : ""}`}>
            <span className="step-index">2</span>
            <span className="step-label">Document verification</span>
          </div>
        </div>

        {currentStep === 1 && (
          <form className="kyc-form" onSubmit={handleBankSubmit}>
            <div className="form-group">
              <label htmlFor="accountHolderName">Account holder name</label>
              <input
                id="accountHolderName"
                name="accountHolderName"
                type="text"
                placeholder="Enter account holder name"
                value={bankForm.accountHolderName}
                onChange={handleBankChange}
              />
              {formErrors.accountHolderName && (
                <span className="form-error">{formErrors.accountHolderName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="accountNumber">Account number</label>
              <input
                id="accountNumber"
                name="accountNumber"
                type="text"
                placeholder="Enter bank account number"
                value={bankForm.accountNumber}
                onChange={handleBankChange}
              />
              {formErrors.accountNumber && (
                <span className="form-error">{formErrors.accountNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="ifscCode">IFSC code</label>
              <input
                id="ifscCode"
                name="ifscCode"
                type="text"
                placeholder="e.g., HDFC0001234"
                value={bankForm.ifscCode}
                onChange={handleBankChange}
              />
              {formErrors.ifscCode && <span className="form-error">{formErrors.ifscCode}</span>}
            </div>

            <button type="submit" className="primary-action">
              Continue
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => setCurrentStep(2)}
            >
              I&apos;ll do it later
            </button>
          </form>
        )}

        {currentStep === 2 && (
          <form className="kyc-form" onSubmit={handleDocumentSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full name (as per Aadhaar)</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter full name"
                value={documentForm.fullName}
                onChange={handleDocumentChange}
              />
              {formErrors.fullName && <span className="form-error">{formErrors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="aadhaarNumber">Aadhaar number</label>
              <input
                id="aadhaarNumber"
                name="aadhaarNumber"
                type="text"
                placeholder="12-digit Aadhaar number"
                value={documentForm.aadhaarNumber}
                onChange={handleDocumentChange}
              />
              {formErrors.aadhaarNumber && (
                <span className="form-error">{formErrors.aadhaarNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="panNumber">PAN number</label>
              <input
                id="panNumber"
                name="panNumber"
                type="text"
                placeholder="ABCDE1234F"
                value={documentForm.panNumber}
                onChange={handleDocumentChange}
              />
              {formErrors.panNumber && <span className="form-error">{formErrors.panNumber}</span>}
            </div>

            <div className="form-actions">
              <button type="button" className="ghost-action" onClick={handleEditBankDetails}>
                Back to bank details
              </button>
              <button type="submit" className="primary-action">
                Submit KYC
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Kyc;

