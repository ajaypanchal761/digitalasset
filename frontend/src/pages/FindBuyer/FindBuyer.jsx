import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { offlineBuyerRequestAPI } from "../../services/api.js";
import "./FindBuyer.css";

const FindBuyer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { holdings, listings, loading: holdingsLoading } = useAppState();
  const { showToast } = useToast();
  const holdingId = location.state?.holdingId;

  // More robust holding lookup - convert both to strings for comparison
  const holding = holdings.find((h) => {
    const hId = (h._id || h.id)?.toString();
    const searchId = holdingId?.toString();
    return hId === searchId;
  });

  const [formData, setFormData] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
  });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [offlineRequests, setOfflineRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for holdings to load before checking
    if (holdingsLoading) {
      return;
    }

    // Check if holdingId was provided
    if (!holdingId) {
      showToast("Holding ID is required", "error");
      navigate("/wallet");
      return;
    }

    // Check if holding exists
    if (!holding) {
      showToast("Holding not found", "error");
      navigate("/wallet");
      return;
    }

    fetchOfflineRequests();
  }, [holding, holdingId, holdingsLoading, navigate, showToast]);

  const fetchOfflineRequests = async () => {
    try {
      setLoading(true);
      const response = await offlineBuyerRequestAPI.getAll();
      if (response.success) {
        const holdingRequests = (response.data || []).filter(
          (req) => (req.holdingId?._id || req.holdingId) === (holding?._id || holding?.id)
        );
        setOfflineRequests(holdingRequests);
      }
    } catch (error) {
      console.error("Error fetching offline requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.buyerName.trim()) {
      newErrors.buyerName = "Buyer name is required";
    }

    if (!formData.buyerEmail.trim()) {
      newErrors.buyerEmail = "Buyer email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail)) {
      newErrors.buyerEmail = "Invalid email format";
    }

    if (!formData.buyerPhone.trim()) {
      newErrors.buyerPhone = "Buyer phone is required";
    } else if (!/^\d{10}$/.test(formData.buyerPhone)) {
      newErrors.buyerPhone = "Phone number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSending(true);
      const response = await offlineBuyerRequestAPI.create({
        holdingId: holding._id || holding.id,
        buyerName: formData.buyerName.trim(),
        buyerEmail: formData.buyerEmail.trim(),
        buyerPhone: formData.buyerPhone.trim(),
      });

      if (response.success) {
        showToast("Email sent to offline buyer successfully!", "success");
        setFormData({
          buyerName: "",
          buyerEmail: "",
          buyerPhone: "",
        });
        fetchOfflineRequests();
      } else {
        showToast(response.message || "Failed to send email", "error");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      showToast(error.message || "Failed to send email", "error");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="find-buyer-page">
        <div className="find-buyer-page__container">
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const property = listings.find(
    (p) => (p._id || p.id) === (holding.propertyId?._id || holding.propertyId || holding.property)
  );

  return (
    <div className="find-buyer-page">
      <div className="find-buyer-page__container">
        {/* Header */}
        <div className="find-buyer-page__header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="find-buyer-page__title">Find Offline Buyer</h1>
          <div style={{ width: "24px" }}></div>
        </div>

        {/* Property Info */}
        <div className="find-buyer-page__property-card">
          <h3 className="find-buyer-page__property-title">Property Details</h3>
          <div className="find-buyer-page__property-info">
            <div className="find-buyer-page__property-item">
              <span className="find-buyer-page__property-label">Property</span>
              <span className="find-buyer-page__property-value">{property?.title || holding?.name || "N/A"}</span>
            </div>
            <div className="find-buyer-page__property-item">
              <span className="find-buyer-page__property-label">Your Investment</span>
              <span className="find-buyer-page__property-value">{formatCurrency(holding.amountInvested, "INR")}</span>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="find-buyer-page__info-card" style={{
          background: "#f0f9ff",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          border: "1px solid #bae6fd"
        }}>
          <p style={{ margin: 0, color: "#0369a1", fontSize: "0.875rem" }}>
            <strong>Note:</strong> Enter the details of an external buyer (not registered on the platform).
            An email will be sent to them with property details and instructions to sign up.
            The property will be automatically transferred once they complete KYC verification.
          </p>
        </div>

        {/* Offline Buyer Form */}
        <form className="find-buyer-page__form" onSubmit={handleSubmit}>
          <h3 className="find-buyer-page__form-title">Offline Buyer Information</h3>

          {/* Buyer Name */}
          <div className="find-buyer-page__field">
            <label htmlFor="buyer-name" className="find-buyer-page__label">
              Buyer Name <span className="find-buyer-page__required">*</span>
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
              className={`find-buyer-page__input ${errors.buyerName ? "find-buyer-page__input--error" : ""}`}
              placeholder="Enter buyer's full name"
            />
            {errors.buyerName && <span className="find-buyer-page__error">{errors.buyerName}</span>}
          </div>

          {/* Buyer Email */}
          <div className="find-buyer-page__field">
            <label htmlFor="buyer-email" className="find-buyer-page__label">
              Buyer Email <span className="find-buyer-page__required">*</span>
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
              className={`find-buyer-page__input ${errors.buyerEmail ? "find-buyer-page__input--error" : ""}`}
              placeholder="Enter buyer's email address"
            />
            {errors.buyerEmail && <span className="find-buyer-page__error">{errors.buyerEmail}</span>}
          </div>

          {/* Buyer Phone */}
          <div className="find-buyer-page__field">
            <label htmlFor="buyer-phone" className="find-buyer-page__label">
              Buyer Phone Number <span className="find-buyer-page__required">*</span>
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
              className={`find-buyer-page__input ${errors.buyerPhone ? "find-buyer-page__input--error" : ""}`}
              placeholder="Enter buyer's phone number"
            />
            {errors.buyerPhone && <span className="find-buyer-page__error">{errors.buyerPhone}</span>}
          </div>

          {/* Submit Button */}
          <div className="find-buyer-page__actions">
            <button
              type="button"
              className="find-buyer-page__btn find-buyer-page__btn--cancel"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="find-buyer-page__btn find-buyer-page__btn--primary"
              disabled={sending}
            >
              {sending ? "Sending Email..." : "Send Email"}
            </button>
          </div>
        </form>

        {/* Sent Requests List */}
        {offlineRequests.length > 0 && (
          <div className="find-buyer-page__requests-section">
            <h3 className="find-buyer-page__form-title">Sent Requests</h3>
            <div className="find-buyer-page__requests-list">
              {offlineRequests.map((request) => (
                <div key={request._id || request.id} className="find-buyer-page__request-card">
                  <div className="find-buyer-page__request-header">
                    <div>
                      <h4 className="find-buyer-page__request-buyer-name">{request.buyerName}</h4>
                      <p className="find-buyer-page__request-buyer-email">{request.buyerEmail}</p>
                      <p className="find-buyer-page__request-buyer-phone">{request.buyerPhone}</p>
                    </div>
                    <span className={`find-buyer-page__status-badge ${request.status === "completed"
                        ? "find-buyer-page__status-badge--completed"
                        : "find-buyer-page__status-badge--pending"
                      }`}>
                      {request.status === "completed" ? "Completed" : "Pending"}
                    </span>
                  </div>
                  <div className="find-buyer-page__request-details">
                    <div className="find-buyer-page__request-detail-item">
                      <span className="find-buyer-page__request-detail-label">Request Date</span>
                      <span className="find-buyer-page__request-detail-value">
                        {new Date(request.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    {request.status === "completed" && request.transferCompletedDate && (
                      <div className="find-buyer-page__request-detail-item">
                        <span className="find-buyer-page__request-detail-label">Transfer Completed</span>
                        <span className="find-buyer-page__request-detail-value">
                          {new Date(request.transferCompletedDate).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindBuyer;
