import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext.jsx";
import "./Support.css";

const categories = [
  { value: "kyc", label: "KYC Verification" },
  { value: "investment", label: "Investment" },
  { value: "wallet", label: "Wallet & Payments" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "technical", label: "Technical Issue" },
  { value: "account", label: "Account Management" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const Support = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "medium",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files.slice(0, 5 - prev.length)]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please fill in all required fields correctly", "error");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call (mock submission)
    setTimeout(() => {
      setIsSubmitting(false);
      showToast("Support ticket created successfully! We'll get back to you soon.", "success");
      
      // Reset form
      setFormData({
        subject: "",
        category: "",
        priority: "medium",
        description: "",
      });
      setSelectedFiles([]);
      setErrors({});

      // Optionally navigate back or to tickets list
      // navigate("/help");
    }, 1500);
  };

  return (
    <div className="support-page">
      {/* Header */}
      <header className="support-header">
        <button
          type="button"
          className="support-header__back"
          onClick={() => navigate("/help")}
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="support-header__title">Contact Support</h1>
        <div className="support-header__spacer"></div>
      </header>

      <div className="support-content">
        <div className="support-info">
          <div className="support-info__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="support-info__title">We're here to help!</h2>
          <p className="support-info__text">
            Fill out the form below and our support team will get back to you as soon as possible.
            You can also check our <button type="button" className="support-info__link" onClick={() => navigate("/faq")}>FAQ</button> for quick answers.
          </p>
        </div>

        <form className="support-form" onSubmit={handleSubmit}>
          {/* Subject */}
          <div className="support-form__field">
            <label htmlFor="subject" className="support-form__label">
              Subject <span className="support-form__required">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className={`support-form__input ${errors.subject ? "support-form__input--error" : ""}`}
              placeholder="Brief description of your issue"
              value={formData.subject}
              onChange={handleInputChange}
            />
            {errors.subject && <span className="support-form__error">{errors.subject}</span>}
          </div>

          {/* Category and Priority Row */}
          <div className="support-form__row">
            <div className="support-form__field">
              <label htmlFor="category" className="support-form__label">
                Category <span className="support-form__required">*</span>
              </label>
              <select
                id="category"
                name="category"
                className={`support-form__input support-form__input--select ${errors.category ? "support-form__input--error" : ""}`}
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && <span className="support-form__error">{errors.category}</span>}
            </div>

            <div className="support-form__field">
              <label htmlFor="priority" className="support-form__label">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                className="support-form__input support-form__input--select"
                value={formData.priority}
                onChange={handleInputChange}
              >
                {priorities.map((pri) => (
                  <option key={pri.value} value={pri.value}>
                    {pri.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="support-form__field">
            <label htmlFor="description" className="support-form__label">
              Description <span className="support-form__required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              className={`support-form__input support-form__textarea ${errors.description ? "support-form__input--error" : ""}`}
              placeholder="Please provide detailed information about your issue..."
              rows={6}
              value={formData.description}
              onChange={handleInputChange}
            />
            {errors.description && <span className="support-form__error">{errors.description}</span>}
            <span className="support-form__hint">Minimum 20 characters required</span>
          </div>

          {/* File Upload */}
          <div className="support-form__field">
            <label htmlFor="attachments" className="support-form__label">
              Attachments (Optional)
            </label>
            <div className="support-form__file-upload">
              <input
                type="file"
                id="attachments"
                className="support-form__file-input"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={selectedFiles.length >= 5}
              />
              <label htmlFor="attachments" className="support-form__file-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <span>Choose files</span>
              </label>
              <span className="support-form__file-hint">Max 5 files (Images, PDF, DOC)</span>
            </div>
            {selectedFiles.length > 0 && (
              <div className="support-form__file-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="support-form__file-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                    </svg>
                    <span className="support-form__file-name">{file.name}</span>
                    <button
                      type="button"
                      className="support-form__file-remove"
                      onClick={() => removeFile(index)}
                      aria-label="Remove file"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="support-form__actions">
            <button
              type="button"
              className="support-form__button support-form__button--cancel"
              onClick={() => navigate("/help")}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="support-form__button support-form__button--submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="support-form__spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2C6.477 2 2 6.477 2 12" strokeLinecap="round" />
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit Ticket"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Support;



