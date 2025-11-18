import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhone(value);
      setErrors("");
    }
  };

  const formatPhone = (value) => {
    if (value.length === 0) return "";
    if (value.length <= 3) return value;
    if (value.length <= 6) return `${value.slice(0, 3)} ${value.slice(3)}`;
    return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors("");

    if (!phone.trim()) {
      setErrors("Phone number is required");
      return;
    }

    if (phone.length !== 10) {
      setErrors("Enter a valid 10-digit phone number");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors("");

      // Send OTP via API
      const response = await authAPI.sendOTP({
        phone: phone,
        purpose: 'login',
      });

      if (response.success) {
        // Navigate to login OTP verification page with phone number
        navigate("/auth/login-otp", {
          state: { 
            phone: `+91 ${formatPhone(phone)}`,
            phoneNumber: phone,
          }
        });
      } else {
        setErrors(response.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      // Safely extract error message
      let errorMessage = "Failed to send OTP. Please try again.";
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

  const isValid = phone.length === 10;

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Illustration */}
        <div className="login-illustration">
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
        <div className="login-content">
          <h1 className="login-title">Sign in</h1>
          <p className="login-subtitle">Enter your phone number to verify your account</p>

          <form className="login-form" onSubmit={handleSubmit}>
            {errors && <div className="login-error">{errors}</div>}

            {/* Phone Input */}
            <div className="login-phone-input">
              <div className="phone-input-wrapper">
                <span className="phone-code">+91</span>
                <input
                  type="tel"
                  className="phone-input"
                  placeholder="Enter the number"
                  value={formatPhone(phone)}
                  onChange={handlePhoneChange}
                  maxLength={12}
                />
                {isValid && (
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
              className="login-continue-btn"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? "Sending..." : "Continue"}
            </button>
          </form>

          <p className="login-footer">
            Don't have an account? <Link to="/auth/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
