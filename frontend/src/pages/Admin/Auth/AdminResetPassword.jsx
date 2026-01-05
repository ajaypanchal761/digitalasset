import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { adminAuthAPI } from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import "./AdminResetPassword.css";

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      setErrors("Invalid reset link. Please request a new password reset.");
      showToast("Invalid reset link. Please request a new password reset.", "error");
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors("");
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors("");

    // Validation
    if (!formData.password.trim()) {
      setErrors("Password is required");
      return;
    }

    if (!validatePassword(formData.password)) {
      setErrors("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors("Passwords do not match");
      return;
    }

    if (!token) {
      setErrors("Invalid reset token. Please request a new password reset.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors("");

      const response = await adminAuthAPI.resetPassword(token, formData.password);

      if (response && response.success) {
        showToast(response.message || "Password reset successfully!", "success");
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/admin-auth/login", { replace: true });
        }, 2000);
      } else {
        const errorMsg = response?.message || "Failed to reset password. Please try again.";
        setErrors(errorMsg);
        showToast(errorMsg, "error");
      }
    } catch (err) {
      let errorMessage = "Failed to reset password. Please try again.";
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

  const isValid = 
    formData.password.trim() && 
    validatePassword(formData.password) && 
    formData.password === formData.confirmPassword &&
    token;

  return (
    <div className="admin-reset-password-page">
      <div className="admin-reset-password-container">
        {/* Illustration */}
        <div className="admin-reset-password-illustration">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              {/* Key icon */}
              <rect x="80" y="90" width="40" height="60" rx="5" fill="#6366F1" opacity="0.2"/>
              <rect x="85" y="95" width="30" height="45" rx="3" fill="#6366F1"/>
              <circle cx="100" cy="115" r="8" fill="#FFFFFF"/>
              <path d="M70 100 L85 100" stroke="#6366F1" strokeWidth="6" strokeLinecap="round"/>
              <circle cx="70" cy="100" r="12" fill="#6366F1"/>
            </g>
          </svg>
        </div>

        {/* Content */}
        <div className="admin-reset-password-content">
          <h1 className="admin-reset-password-title">Reset Password</h1>
          <p className="admin-reset-password-subtitle">
            Enter your new password below.
          </p>

          <form 
            className="admin-reset-password-form" 
            onSubmit={handleSubmit}
            noValidate
          >
            {errors && <div className="admin-reset-password-error">{errors}</div>}

            {/* Password Input */}
            <div className="admin-reset-password-field">
              <label htmlFor="password">New Password</label>
              <div className="admin-reset-password-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="admin-reset-password-input"
                  placeholder="Enter new password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="admin-reset-password-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#6b7280" strokeWidth="1.5"/>
                      <path d="M2.01675 10C3.22575 6.25 6.29925 3.75 10 3.75C13.7008 3.75 16.7742 6.25 17.9832 10C16.7742 13.75 13.7008 16.25 10 16.25C6.29925 16.25 3.22575 13.75 2.01675 10Z" stroke="#6b7280" strokeWidth="1.5"/>
                      <path d="M2.5 2.5L17.5 17.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#6b7280" strokeWidth="1.5"/>
                      <path d="M2.01675 10C3.22575 6.25 6.29925 3.75 10 3.75C13.7008 3.75 16.7742 6.25 17.9832 10C16.7742 13.75 13.7008 16.25 10 16.25C6.29925 16.25 3.22575 13.75 2.01675 10Z" stroke="#6b7280" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="admin-reset-password-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="admin-reset-password-password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="admin-reset-password-input"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="admin-reset-password-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#6b7280" strokeWidth="1.5"/>
                      <path d="M2.01675 10C3.22575 6.25 6.29925 3.75 10 3.75C13.7008 3.75 16.7742 6.25 17.9832 10C16.7742 13.75 13.7008 16.25 10 16.25C6.29925 16.25 3.22575 13.75 2.01675 10Z" stroke="#6b7280" strokeWidth="1.5"/>
                      <path d="M2.5 2.5L17.5 17.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#6b7280" strokeWidth="1.5"/>
                      <path d="M2.01675 10C3.22575 6.25 6.29925 3.75 10 3.75C13.7008 3.75 16.7742 6.25 17.9832 10C16.7742 13.75 13.7008 16.25 10 16.25C6.29925 16.25 3.22575 13.75 2.01675 10Z" stroke="#6b7280" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="admin-reset-password-continue-btn"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="admin-reset-password-footer">
            <p>
              Remember your password? <Link to="/admin-auth/login">Sign In</Link>
            </p>
            {/* <p className="admin-reset-password-switch">
              <Link to="/auth/login">User Login</Link>
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;

