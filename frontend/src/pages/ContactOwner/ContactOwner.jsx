import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { contactOwnerAPI } from "../../services/api.js";
import Select from "../../components/common/Select";

const ContactOwner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { holdings, listings } = useAppState();
  const { showToast } = useToast();
  const holdingId = location.state?.holdingId;
  const holding = holdings.find((h) => (h._id || h.id) === holdingId);
  const property = holding ? listings.find((p) => {
    const propertyId = holding.propertyId?._id || holding.propertyId || holding.property;
    return (p._id || p.id) === propertyId;
  }) : null;

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [ownerContact, setOwnerContact] = useState({
    name: "Property Owner",
    email: "owner@digitalassets.com",
    phone: "+91 98765 43210",
  });
  const [loadingOwner, setLoadingOwner] = useState(true);

  useEffect(() => {
    if (!holding) {
      navigate("/wallet");
      return;
    }
    
    // Pre-fill subject with property name
    if (holding && !formData.subject) {
      setFormData((prev) => ({
        ...prev,
        subject: `Property Sale Inquiry - ${holding.name || property?.title || "Property"}`,
      }));
    }

    // Fetch owner contact info
    const fetchOwnerInfo = async () => {
      if (!property) return;
      
      try {
        setLoadingOwner(true);
        const propertyId = property._id || property.id;
        const response = await contactOwnerAPI.getPropertyOwnerInfo(propertyId);
        if (response.success && response.data) {
          setOwnerContact(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch owner info:", error);
        // Keep default values on error
      } finally {
        setLoadingOwner(false);
      }
    };

    if (property) {
      fetchOwnerInfo();
    }
  }, [holding, property, navigate]);

  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    if (!formData.message.trim() || formData.message.trim().length < 20) {
      newErrors.message = "Message must be at least 20 characters";
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await contactOwnerAPI.create(
        holdingId,
        formData.subject.trim(),
        formData.message.trim()
      );

      if (response.success) {
        showToast(
          "Your message has been sent to the property owner! They will contact you via email to discuss the sale options.",
          "success"
        );
        navigate("/wallet");
      } else {
        showToast(response.message || "Failed to send message", "error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showToast(error.message || "Failed to send message. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!holding) {
    return null;
  }

  return (
    <div className="contact-owner-page">
      <div className="contact-owner-page__container">
        {/* Header */}
        <div className="contact-owner-page__header">
          <button className="contact-owner-page__back" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="contact-owner-page__title">Contact Owner</h1>
          <div style={{ width: "24px" }}></div>
        </div>

        {/* Info Card */}
        <div className="contact-owner-page__info-card">
          <div className="contact-owner-page__icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="contact-owner-page__info-title">Contact Property Owner</h2>
          <p className="contact-owner-page__info-text">
            Reach out to the property owner to discuss sale options for your holding. The owner will get back to you with details on how to proceed with the sale.
          </p>
          <button
            className="contact-owner-page__view-messages-btn"
            onClick={() => navigate("/contact-owner/messages")}
          >
            View My Messages
          </button>
        </div>

        {/* Property Info */}
        <div className="contact-owner-page__property-card">
          <h3 className="contact-owner-page__card-title">Your Property Details</h3>
          <div className="contact-owner-page__property-info">
            <div className="contact-owner-page__property-item">
              <span className="contact-owner-page__property-label">Property Name</span>
              <span className="contact-owner-page__property-value">{holding.name}</span>
            </div>
            <div className="contact-owner-page__property-item">
              <span className="contact-owner-page__property-label">Your Investment</span>
              <span className="contact-owner-page__property-value">{formatCurrency(holding.amountInvested, "INR")}</span>
            </div>
            <div className="contact-owner-page__property-item">
              <span className="contact-owner-page__property-label">Earnings Received</span>
              <span className="contact-owner-page__property-value contact-owner-page__property-value--green">
                {formatCurrency(holding.totalEarningsReceived || 0, "INR")}
              </span>
            </div>
            <div className="contact-owner-page__property-item">
              <span className="contact-owner-page__property-label">Status</span>
              <span className={`contact-owner-page__status-badge ${holding.status === "matured" ? "contact-owner-page__status-badge--matured" : "contact-owner-page__status-badge--locked"}`}>
                {holding.status === "matured" ? "Matured" : "Locked"}
              </span>
            </div>
          </div>
        </div>

        {/* Owner Contact Info */}
        <div className="contact-owner-page__owner-card">
          <h3 className="contact-owner-page__card-title">Owner Contact Information</h3>
          <div className="contact-owner-page__owner-contact">
            <div className="contact-owner-page__owner-contact-item">
              <div className="contact-owner-page__owner-contact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="contact-owner-page__owner-contact-details">
                <span className="contact-owner-page__owner-contact-label">Owner Name</span>
                <span className="contact-owner-page__owner-contact-value">{ownerContact.name}</span>
              </div>
            </div>
            <div className="contact-owner-page__owner-contact-item">
              <div className="contact-owner-page__owner-contact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="contact-owner-page__owner-contact-details">
                <span className="contact-owner-page__owner-contact-label">Email</span>
                <span className="contact-owner-page__owner-contact-value">{ownerContact.email}</span>
              </div>
            </div>
            <div className="contact-owner-page__owner-contact-item">
              <div className="contact-owner-page__owner-contact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="contact-owner-page__owner-contact-details">
                <span className="contact-owner-page__owner-contact-label">Phone</span>
                <span className="contact-owner-page__owner-contact-value">{ownerContact.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form className="contact-owner-page__form" onSubmit={handleSubmit}>
          <h3 className="contact-owner-page__form-title">Send Message to Owner</h3>

          {/* Subject */}
          <div className="contact-owner-page__field">
            <label htmlFor="subject" className="contact-owner-page__label">
              Subject <span className="contact-owner-page__required">*</span>
            </label>
            <input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                if (errors.subject) setErrors({ ...errors, subject: null });
              }}
              className={`contact-owner-page__input ${errors.subject ? "contact-owner-page__input--error" : ""}`}
              placeholder="Enter message subject"
            />
            {errors.subject && <span className="contact-owner-page__error">{errors.subject}</span>}
          </div>

          {/* Message */}
          <div className="contact-owner-page__field">
            <label htmlFor="message" className="contact-owner-page__label">
              Message <span className="contact-owner-page__required">*</span>
            </label>
            <textarea
              id="message"
              rows="6"
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                if (errors.message) setErrors({ ...errors, message: null });
              }}
              className={`contact-owner-page__input contact-owner-page__textarea ${errors.message ? "contact-owner-page__input--error" : ""}`}
              placeholder="Write your message to the owner about the sale. Include any specific details about your property holding, preferred sale price, or questions you may have..."
            />
            {errors.message && <span className="contact-owner-page__error">{errors.message}</span>}
            <span className="contact-owner-page__hint">Minimum 20 characters required</span>
          </div>


          {/* Terms */}
          <div className="contact-owner-page__field">
            <label className={`contact-owner-page__checkbox-label ${errors.acceptTerms ? "contact-owner-page__checkbox-label--error" : ""}`}>
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => {
                  setFormData({ ...formData, acceptTerms: e.target.checked });
                  if (errors.acceptTerms) setErrors({ ...errors, acceptTerms: null });
                }}
                className="contact-owner-page__checkbox"
              />
              <span>
                I understand that the owner will contact me to discuss sale options and I will need to complete the ownership transfer process after finding a buyer <span className="contact-owner-page__required">*</span>
              </span>
            </label>
            {errors.acceptTerms && <span className="contact-owner-page__error">{errors.acceptTerms}</span>}
          </div>

          {/* Actions */}
          <div className="contact-owner-page__actions">
            <button type="button" className="contact-owner-page__btn contact-owner-page__btn--cancel" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="contact-owner-page__btn contact-owner-page__btn--submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactOwner;

