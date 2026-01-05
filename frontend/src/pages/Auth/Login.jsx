import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import logoImage from "../../assets/logo1.png";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to dashboard if already authenticated
  // Also ensure admin token doesn't interfere with user login
  useEffect(() => {
    // On user login page, we should only check for user token, not admin token
    // Admin token should not prevent user from logging in
    const userToken = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");

    if (adminToken && !userToken) {
      // Admin token exists but no user token - this is fine, allow user to login
      // Don't do anything, just let the login flow proceed
      console.log("ℹ️ Login - Admin token exists but allowing user login flow");
    }

    if (!loading && isAuthenticated && userToken) {
      // Only redirect if user is actually authenticated with user token
      console.log("✅ Login - User already authenticated, redirecting to home");
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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
        purpose: "login",
      });

      if (response.success) {
        // Navigate to login OTP verification page with phone number
        navigate("/auth/login-otp", {
          state: {
            phone: `+91 ${formatPhone(phone)}`,
            phoneNumber: phone,
          },
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
          if (typeof msg === "string" && msg && !msg.includes("query")) {
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
      {/* Decorative floating squares - desktop only */}
      <div className="auth-bg-decoration">
        <div className="auth-square auth-square-1"></div>
        <div className="auth-square auth-square-2"></div>
      </div>
      
      <div className="login-container">
        {/* Illustration */}
        <div className="login-illustration">
          <img
            src={logoImage}
            alt="DigitalAssets Logo"
            style={{ width: '140px', height: 'auto' }}
          />
        </div>

        {/* Content */}
        <div className="login-content">
          <h1 className="login-title">Sign in</h1>
          <p className="login-subtitle">
            Enter your phone number to verify your account
          </p>

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
                      <circle cx="8" cy="8" r="8" fill="#10B981" />
                      <path
                        d="M5 8 L7 10 L11 6"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
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

          <div className="login-footer">
            <p>
              Don't have an account? <Link to="/auth/register">Sign up</Link>
            </p>
            {/* <p className="login-switch">
              <Link to="/admin-auth/login">Admin Login</Link>
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
