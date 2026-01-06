import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../context/ToastContext.jsx";
import { investmentRequestAPI, adminAuthAPI } from "../../services/api.js";
import "./InvestmentRequest.css";

const InvestmentRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const { propertyId, propertyTitle, property, investmentAmount, timePeriod, monthlyEarning, totalEarnings, maturityAmount } = location.state || {};

  const [formData, setFormData] = useState({
    notes: "",
  });

  const [transactionProof, setTransactionProof] = useState(null);
  const [transactionProofPreview, setTransactionProofPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [loadingBankDetails, setLoadingBankDetails] = useState(true);

  useEffect(() => {
    // Redirect if no state data
    if (!propertyId || !investmentAmount) {
      showToast('Invalid request. Please select a property to invest.', 'error');
      navigate('/explore');
    }
  }, [propertyId, investmentAmount, navigate, showToast]);

  useEffect(() => {
    // Fetch admin bank details
    const fetchBankDetails = async () => {
      try {
        setLoadingBankDetails(true);
        const response = await adminAuthAPI.getBankDetails();
        if (response.success) {
          setBankDetails(response.data);
        }
      } catch (error) {
        console.error('Error fetching bank details:', error);
      } finally {
        setLoadingBankDetails(false);
      }
    };

    fetchBankDetails();
  }, []);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          transactionProof: 'File size should be less than 5MB',
        }));
        return;
      }

      // Validate file type - only images allowed
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          transactionProof: 'Only JPG and PNG image files are allowed',
        }));
        return;
      }

      setTransactionProof(file);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.transactionProof;
        return newErrors;
      });

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setTransactionProofPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setTransactionProofPreview(null);
      }
    }
  };

  const removeFile = () => {
    setTransactionProof(null);
    setTransactionProofPreview(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!transactionProof) {
      newErrors.transactionProof = 'Transaction proof is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitFormData = new FormData();
      submitFormData.append('propertyId', propertyId);
      submitFormData.append('amountInvested', investmentAmount);
      submitFormData.append('timePeriod', timePeriod);
      submitFormData.append('document', transactionProof);
      if (formData.notes) {
        submitFormData.append('notes', formData.notes);
      }

      const response = await investmentRequestAPI.create(submitFormData);

      if (response.success) {
        showToast('Investment request submitted successfully! Admin will verify your transaction.', 'success');
        navigate('/wallet');
      } else {
        showToast(response.message || 'Failed to submit investment request', 'error');
      }
    } catch (error) {
      console.error('Error submitting investment request:', error);
      showToast(error.message || 'Failed to submit investment request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!propertyId || !investmentAmount) {
    return null;
  }

  return (
    <div className="investment-request-page">
      {/* Header */}
      <div className="investment-request-page__header">
        <button onClick={() => navigate(-1)} className="btn-back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="investment-request-page__title">Submit Investment Request</h1>
      </div>

      <div className="investment-request-page__container">

        {/* Property Info Card */}
        <div className="investment-request-page__property-card">
          <div className="investment-request-page__property-info">
            <div className="investment-request-page__property-icon">
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
            <div className="investment-request-page__property-details">
              <h3 className="investment-request-page__property-title">{propertyTitle || property?.title}</h3>
              <p className="investment-request-page__property-type">Digital Property</p>
            </div>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="investment-request-page__summary">
          <h3 className="investment-request-page__summary-title">Investment Summary</h3>
          <div className="investment-request-page__summary-list">
            <div className="investment-request-page__summary-item">
              <span className="investment-request-page__summary-label">Investment Amount</span>
              <span className="investment-request-page__summary-value">{formatCurrency(investmentAmount, "INR")}</span>
            </div>
            <div className="investment-request-page__summary-item">
              <span className="investment-request-page__summary-label">Monthly return after 3 month of lock</span>
              <span className="investment-request-page__summary-value investment-request-page__summary-value--green">0.5% + 5% yearly</span>
            </div>
            <div className="investment-request-page__summary-item">
              <span className="investment-request-page__summary-label">Monthly Earning</span>
              <span className="investment-request-page__summary-value investment-request-page__summary-value--green">
                {formatCurrency(monthlyEarning, "INR")}/month
              </span>
              <span className="investment-request-page__summary-subtext">
                (starts after 3-month lock-in)
              </span>
            </div>
            <div className="investment-request-page__summary-item">
              <span className="investment-request-page__summary-label">Investment Period</span>
              <span className="investment-request-page__summary-value">{timePeriod} months</span>
            </div>
            <div className="investment-request-page__summary-item">
              <span className="investment-request-page__summary-label">Lock-in Period</span>
              <span className="investment-request-page__summary-value">3 months (required)</span>
            </div>
            <div className="investment-request-page__summary-item">
              <span className="investment-request-page__summary-label">Withdrawal Available</span>
              <span className="investment-request-page__summary-value">{calculateMaturityDate()}</span>
            </div>
            <div className="investment-request-page__summary-item">
              <span className="investment-request-page__summary-label">Total Earnings</span>
              <span className="investment-request-page__summary-value investment-request-page__summary-value--green">
                {formatCurrency(totalEarnings, "INR")}
              </span>
            </div>
            <div className="investment-request-page__summary-item investment-request-page__summary-item--total">
              <span className="investment-request-page__summary-label">Total Amount After Maturity</span>
              <span className="investment-request-page__summary-value investment-request-page__summary-value--highlight">
                {formatCurrency(maturityAmount, "INR")}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Details Section */}
        {!loadingBankDetails && bankDetails && (
          <div className="investment-request-page__bank-details">
            <h3 className="investment-request-page__bank-details-title">Bank Details for Payment</h3>
            <div className="investment-request-page__bank-details-content">
              <div className="investment-request-page__bank-details-item">
                <span className="investment-request-page__bank-details-label">Account Holder Name</span>
                <span className="investment-request-page__bank-details-value">{bankDetails.accountHolderName || 'N/A'}</span>
              </div>
              <div className="investment-request-page__bank-details-item">
                <span className="investment-request-page__bank-details-label">Account Number</span>
                <span className="investment-request-page__bank-details-value">{bankDetails.accountNumber || 'N/A'}</span>
              </div>
              <div className="investment-request-page__bank-details-item">
                <span className="investment-request-page__bank-details-label">IFSC Code</span>
                <span className="investment-request-page__bank-details-value">{bankDetails.ifscCode || 'N/A'}</span>
              </div>
              <div className="investment-request-page__bank-details-item">
                <span className="investment-request-page__bank-details-label">Bank Name</span>
                <span className="investment-request-page__bank-details-value">{bankDetails.bankName || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Investment Request Form */}
        <form onSubmit={handleSubmit} className="investment-request-page__form">
          {/* Transaction Proof Upload */}
          <div className="investment-request-page__field">
            <label htmlFor="transactionProof" className="investment-request-page__label">
              Transaction Proof <span className="investment-request-page__required">*</span>
            </label>
            <div className="investment-request-page__file-upload">
              {transactionProofPreview ? (
                <div className="investment-request-page__file-preview">
                  <img
                    src={transactionProofPreview}
                    alt="Transaction proof preview"
                    className="investment-request-page__preview-image"
                  />
                  <button
                    type="button"
                    onClick={removeFile}
                    className="investment-request-page__remove-file"
                  >
                    Remove
                  </button>
                </div>
              ) : transactionProof ? (
                <div className="investment-request-page__file-info">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>{transactionProof.name}</span>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="investment-request-page__remove-file"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="investment-request-page__file-upload-label">
                  <input
                    id="transactionProof"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                    className="investment-request-page__file-input"
                  />
                  <div className="investment-request-page__file-upload-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Click to upload transaction proof</span>
                    <span className="investment-request-page__file-upload-hint">JPG or PNG (Max 5MB)</span>
                  </div>
                </label>
              )}
            </div>
            {errors.transactionProof && (
              <span className="investment-request-page__error">{errors.transactionProof}</span>
            )}
          </div>

          {/* Notes (Optional) */}
          <div className="investment-request-page__field">
            <label htmlFor="notes" className="investment-request-page__label">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="investment-request-page__textarea"
              placeholder="Add any additional information about your transaction..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="investment-request-page__actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="investment-request-page__btn investment-request-page__btn--cancel"
              disabled={isSubmitting}
            >
              Go Back
            </button>
            <button
              type="submit"
              className="investment-request-page__btn investment-request-page__btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Investment Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvestmentRequest;

