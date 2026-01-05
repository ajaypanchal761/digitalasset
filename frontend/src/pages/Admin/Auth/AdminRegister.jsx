import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminAuthAPI } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import "./AdminRegister.css";

const AdminRegister = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "phone") {
      const phoneValue = value.replace(/\D/g, "");
      if (phoneValue.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: phoneValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors("");
  };

  const formatPhone = (value) => {
    if (value.length === 0) return "";
    if (value.length <= 3) return value;
    if (value.length <= 6) return `${value.slice(0, 3)} ${value.slice(3)}`;
    return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // At least 6 characters
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors("");

    // Validation
    if (!formData.name.trim()) {
      setErrors("Full name is required");
      return;
    }

    if (!formData.email.trim()) {
      setErrors("Email is required");
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrors("Please enter a valid email address");
      return;
    }

    if (!formData.phone.trim()) {
      setErrors("Phone number is required");
      return;
    }

    if (formData.phone.length !== 10) {
      setErrors("Enter a valid 10-digit phone number");
      return;
    }

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

    try {
      setIsSubmitting(true);
      setErrors("");
      
      // Register admin directly with password
      const response = await adminAuthAPI.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone,
        password: formData.password,
      });

      if (response.success && response.token) {
        // Refresh user data in AuthContext (it will use admin API since we're on admin-auth route)
        await refreshUser();
        
        // Wait a moment for state to update, then navigate
        // The AdminLayout will handle loading state while user data is fetched
        setTimeout(() => {
          navigate("/admin/dashboard", { replace: true });
        }, 300);
      } else {
        setErrors(response.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      let errorMessage = "Registration failed. Please try again.";
      try {
        if (err instanceof Error) {
          const msg = err.message;
          if (typeof msg === 'string' && msg && !msg.includes('query')) {
            errorMessage = msg;
          }
        }
      } catch (e) {
        // Use default message
      }
      setErrors(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-register-page">
      <div className="admin-register-container">
        {/* Illustration */}
        <div className="admin-register-illustration">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              {/* Shield/Admin icon */}
              <path d="M100 40 L120 50 L120 80 C120 100 110 115 100 120 C90 115 80 100 80 80 L80 50 Z" fill="#6366F1" opacity="0.2"/>
              <path d="M100 50 L115 58 L115 82 C115 98 107 110 100 114 C93 110 85 98 85 82 L85 58 Z" fill="#6366F1"/>
              <circle cx="100" cy="75" r="8" fill="#FFFFFF"/>
              <path d="M100 70 L100 80 M95 75 L105 75" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
            </g>
          </svg>
        </div>

        {/* Content */}
        <div className="admin-register-content">
          <h1 className="admin-register-title">Admin Sign Up</h1>
          <p className="admin-register-subtitle">Create your admin account to manage the platform</p>

          <form className="admin-register-form" onSubmit={handleSubmit}>
            {errors && <div className="admin-register-error">{errors}</div>}

            {/* Name Input */}
            <div className="admin-register-field">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="admin-register-input"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email Input */}
            <div className="admin-register-field">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="admin-register-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Phone Input */}
            <div className="admin-register-field">
              <label htmlFor="phone">Phone Number</label>
              <div className="admin-register-phone-wrapper">
                <span className="admin-register-phone-code">+91</span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="admin-register-phone-input"
                  placeholder="Enter 10-digit number"
                  value={formatPhone(formData.phone)}
                  onChange={handleChange}
                  maxLength={12}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="admin-register-field">
              <label htmlFor="password">Password</label>
              <div className="admin-register-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="admin-register-input"
                  placeholder="Enter your password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="admin-register-password-toggle"
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
            <div className="admin-register-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="admin-register-password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="admin-register-input"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="admin-register-password-toggle"
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
              className="admin-register-continue-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="admin-register-footer">
            <p>
              Already have an admin account? <Link to="/admin-auth/login">Sign in</Link>
            </p>
            {/* <p className="admin-register-switch">
              <Link to="/auth/register">User Registration</Link>
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
