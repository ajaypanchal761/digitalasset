import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminAuthAPI } from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import "./AdminForgotPassword.css";

const AdminForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors("");

    // Validation
    if (!email.trim()) {
      setErrors("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setErrors("Please enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors("");

      const response = await adminAuthAPI.forgotPassword(email.trim());

      if (response && response.success) {
        setIsSuccess(true);
        showToast(response.message || "Password reset link has been sent to your email", "success");
      } else {
        const errorMsg = response?.message || "Failed to send password reset email. Please try again.";
        setErrors(errorMsg);
        showToast(errorMsg, "error");
      }
    } catch (err) {
      let errorMessage = "Failed to send password reset email. Please try again.";
      if (err instanceof Error) {
        const msg = err.message;
        if (typeof msg === 'string' && msg && msg.trim()) {
          errorMessage = msg.trim();
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setErrors(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = email.trim() && validateEmail(email);

  if (isSuccess) {
    return (
      <div className="admin-forgot-password-page">
        <div className="admin-forgot-password-container">
          <div className="admin-forgot-password-illustration">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g>
                {/* Checkmark icon */}
                <circle cx="100" cy="100" r="80" fill="#10b981" opacity="0.1"/>
                <circle cx="100" cy="100" r="60" fill="#10b981" opacity="0.2"/>
                <path d="M70 100 L90 120 L130 80" stroke="#10b981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
          </div>
          <div className="admin-forgot-password-content">
            <h1 className="admin-forgot-password-title">Check Your Email</h1>
            <p className="admin-forgot-password-subtitle">
              If an admin account exists with this email, a password reset link has been sent.
              Please check your inbox and follow the instructions to reset your password.
            </p>
            <div className="admin-forgot-password-footer">
              <p>
                <Link to="/admin-auth/login">Back to Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-forgot-password-page">
      <div className="admin-forgot-password-container">
        {/* Illustration */}
        <div className="admin-forgot-password-illustration">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              {/* Lock/Key icon */}
              <rect x="70" y="100" width="60" height="70" rx="5" fill="#6366F1" opacity="0.2"/>
              <rect x="75" y="105" width="50" height="50" rx="3" fill="#6366F1"/>
              <path d="M85 105 L85 85 C85 70 95 60 100 60 C105 60 115 70 115 85 L115 105" stroke="#6366F1" strokeWidth="6" strokeLinecap="round"/>
              <circle cx="100" cy="130" r="8" fill="#FFFFFF"/>
            </g>
          </svg>
        </div>

        {/* Content */}
        <div className="admin-forgot-password-content">
          <h1 className="admin-forgot-password-title">Forgot Password?</h1>
          <p className="admin-forgot-password-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form 
            className="admin-forgot-password-form" 
            onSubmit={handleSubmit}
            noValidate
          >
            {errors && <div className="admin-forgot-password-error">{errors}</div>}

            {/* Email Input */}
            <div className="admin-forgot-password-field">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="admin-forgot-password-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors("");
                }}
                required
              />
            </div>

            <button 
              type="submit" 
              className="admin-forgot-password-continue-btn"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="admin-forgot-password-footer">
            <p>
              Remember your password? <Link to="/admin-auth/login">Sign In</Link>
            </p>
            <p className="admin-forgot-password-switch">
              <Link to="/auth/login">User Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;

