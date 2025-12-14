import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    try {
      setIsSubmitting(true);
      setErrors(""); // Clear previous errors
      
      // Send OTP via API
      const response = await authAPI.sendOTP({
        email: formData.email.trim(),
        phone: formData.phone,
        purpose: 'registration',
      });

      if (response.success) {
        // Navigate to OTP verification page with user data
        navigate("/auth/verify-otp", {
          state: {
            name: formData.name,
            email: formData.email.trim(),
            phone: `+91 ${formatPhone(formData.phone)}`,
            phoneNumber: formData.phone,
          },
        });
      } else {
        setErrors(response.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      // NEVER access error object - completely avoid touching it
      // The error might have getters that access read-only properties
      // Just use the error message from the Error object if it's a simple Error
      // Otherwise use generic message
      
      let errorMessage = "Failed to send OTP. Please try again.";
      
      // Only try to get message if it's a simple Error instance
      // Don't access any other properties
      try {
        if (err instanceof Error) {
          // Error.message is usually safe to access on Error instances
          // But wrap in try-catch just in case
          const msg = err.message;
          if (typeof msg === 'string' && msg && !msg.includes('query')) {
            errorMessage = msg;
          }
        }
      } catch (e) {
        // If we can't access, use default
        errorMessage = "Failed to send OTP. Please try again.";
      }
      
      console.error('Registration error');
      setErrors(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    formData.name.trim() &&
    formData.email.trim() &&
    validateEmail(formData.email) &&
    formData.phone.length === 10;

  return (
    <div className="register-page">
      {/* Decorative floating squares - desktop only */}
      <div className="auth-bg-decoration">
        <div className="auth-square auth-square-1"></div>
        <div className="auth-square auth-square-2"></div>
      </div>
      
      <div className="register-container">
        {/* Illustration */}
        <div className="register-illustration">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Hand holding phone illustration */}
            <g>
              {/* Cloud shapes */}
              <ellipse cx="50" cy="80" rx="30" ry="20" fill="#E5E7EB" opacity="0.5"/>
              <ellipse cx="150" cy="100" rx="25" ry="15" fill="#E5E7EB" opacity="0.5"/>
              <ellipse cx="80" cy="140" rx="20" ry="12" fill="#E5E7EB" opacity="0.5"/>
              
              {/* Stars */}
              <circle cx="40" cy="60" r="2" fill="#FFFFFF"/>
              <circle cx="160" cy="80" r="2" fill="#FFFFFF"/>
              <circle cx="70" cy="120" r="2" fill="#FFFFFF"/>
              
              {/* Hand */}
              <path d="M100 120 L90 140 L95 145 L105 145 L110 140 L100 120 Z" fill="#F3D2C1"/>
              
              {/* Phone */}
              <rect x="95" y="60" width="30" height="50" rx="4" fill="#374151"/>
              <rect x="98" y="63" width="24" height="35" rx="2" fill="#FFFFFF"/>
              
              {/* Checkmark circle on phone screen */}
              <circle cx="110" cy="80" r="12" fill="#6366F1"/>
              <path d="M105 80 L108 83 L115 76" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </g>
          </svg>
        </div>

        {/* Content */}
        <div className="register-content">
          <h1 className="register-title">Registration</h1>
          <p className="register-subtitle">Enter your details to create your account</p>

          <form className="register-form" onSubmit={handleSubmit}>
            {errors && <div className="register-error">{errors}</div>}

            {/* Full Name Input */}
            <div className="register-input-group">
              <input
                type="text"
                name="name"
                className="register-input"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email Input */}
            <div className="register-input-group">
              <input
                type="email"
                name="email"
                className="register-input"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Phone Input */}
            <div className="register-phone-input">
              <div className="phone-input-wrapper">
                <span className="phone-code">+91</span>
                <input
                  type="tel"
                  name="phone"
                  className="phone-input"
                  placeholder="Enter the number"
                  value={formatPhone(formData.phone)}
                  onChange={handleChange}
                  maxLength={12}
                  required
                />
                {formData.phone.length === 10 && (
                  <div className="phone-checkmark">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="#10B981"/>
                      <path d="M5 8 L7 10 L11 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="register-continue-btn"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? "Sending OTP..." : "Continue"}
            </button>
          </form>

          <div className="register-footer">
            <p>
              Already have an account? <Link to="/auth/login">Sign in</Link>
            </p>
            <p className="register-switch">
              <Link to="/admin-auth/register">Admin Registration</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
