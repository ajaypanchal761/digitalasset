import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { adminAuthAPI } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import logoImage from "../../../assets/logo1.png";
import "./AdminVerifyOtp.css";

const AdminVerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  
  const phone = location.state?.phone || "+91 000 000 0000";
  const phoneNumber = location.state?.phoneNumber || "";
  const email = location.state?.email || "";
  const name = location.state?.name || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    const isRegistration = name && email && phoneNumber;
    
    if (!isRegistration) {
      navigate("/admin-auth/register", { replace: true });
      return;
    }
    inputRefs[0].current?.focus();
    setTimeout(() => setCanResend(true), 30000);
  }, [name, email, phoneNumber, navigate]);

  const autoSubmitRef = useRef(false);
  
  useEffect(() => {
    const otpString = otp.join("");
    if (otpString.length === 6 && !isSubmitting && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      const timer = setTimeout(() => {
        const form = document.querySelector('.admin-verify-otp-form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 300);
      return () => {
        clearTimeout(timer);
        autoSubmitRef.current = false;
      };
    } else if (otpString.length < 6) {
      autoSubmitRef.current = false;
    }
  }, [otp, isSubmitting]);

  const handleOtpChange = (index, value) => {
    const numValue = value.replace(/\D/g, "");
    if (numValue.length > 1) {
      const digits = numValue.slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs[nextIndex].current?.focus();
    } else if (numValue.length === 1) {
      const newOtp = [...otp];
      newOtp[index] = numValue;
      setOtp(newOtp);
      if (index < 5) {
        inputRefs[index + 1].current?.focus();
      }
    } else {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
    setErrors("");
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setErrors("");
    try {
      setIsSubmitting(true);
      const response = await adminAuthAPI.sendOTP({
        email: email,
        phone: phoneNumber,
        purpose: 'registration',
      });

      if (response.success) {
        if (response.otp) {
          console.log(`Admin Test OTP: ${response.otp}`);
          alert(`Admin Test OTP: ${response.otp}`);
        }
        setOtp(["", "", "", "", "", ""]);
        inputRefs[0].current?.focus();
        setTimeout(() => setCanResend(true), 30000);
      } else {
        setErrors(response.message || "Failed to resend OTP. Please try again.");
        setTimeout(() => setCanResend(true), 5000);
      }
    } catch (err) {
      let errorMessage = "Failed to resend OTP. Please try again.";
      try {
        if (err instanceof Error) {
          errorMessage = err.message;
        }
      } catch (e) {
        // Use default
      }
      setErrors(errorMessage);
      setTimeout(() => setCanResend(true), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (isSubmitting) {
      return;
    }
    
    setErrors("");

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setErrors("Please enter the complete 6-digit code");
      return;
    }

    if (!/^\d{6}$/.test(otpString)) {
      setErrors("Please enter a valid 6-digit code");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Register admin with OTP (backend will verify OTP and set role to admin)
      const registerResponse = await adminAuthAPI.register({
        name: name,
        email: email,
        phone: phoneNumber,
        otp: otpString,
      });

      if (registerResponse.success && registerResponse.token) {
        // Token is already set by register
        await refreshUser();
        // Navigate to admin dashboard
        navigate("/admin/dashboard", { 
          replace: true,
        });
      } else {
        setErrors(registerResponse.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      let errorMessage = "Unable to complete registration. Please try again.";
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
      autoSubmitRef.current = false;
    }
  };

  return (
    <div className="admin-verify-otp-page">
      <div className="admin-verify-otp-container">
        {/* Illustration */}
        <div className="admin-verify-otp-illustration">
          <img
            src={logoImage}
            alt="DigitalAssets Logo"
            style={{ width: '140px', height: 'auto' }}
          />
        </div>

        {/* Content */}
        <div className="admin-verify-otp-content">
          <h1 className="admin-verify-otp-title">Admin Sign Up</h1>
          <p className="admin-verify-otp-subtitle">
            Enter the code sent to {email ? <span className="admin-phone-number">{email}</span> : <span className="admin-phone-number">{phone}</span>}
          </p>

          <form className="admin-verify-otp-form" onSubmit={handleSubmit}>
            {errors && <div className="admin-verify-otp-error">{errors}</div>}

            {/* OTP Input Fields */}
            <div className="admin-otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="tel"
                  className="admin-otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  inputMode="numeric"
                />
              ))}
            </div>

            {/* Resend Code */}
            <div className="admin-resend-code">
              <span className="admin-resend-text">I Didn't Receive the Code! </span>
              <button
                type="button"
                className="admin-resend-link"
                onClick={handleResend}
                disabled={!canResend}
              >
                Resend Code
              </button>
            </div>

            <button 
              type="submit" 
              className="admin-verify-otp-btn"
              disabled={isSubmitting || otp.join("").length !== 6}
            >
              {isSubmitting ? "Verifying..." : "Verify & Register"}
            </button>
          </form>

          <div className="admin-verify-otp-footer">
            <p>
              Already have an admin account? <Link to="/admin-auth/login">Sign in</Link>
            </p>
            <p className="admin-verify-otp-switch">
              <Link to="/admin-auth/register">Change details</Link> | <Link to="/auth/register">User Registration</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVerifyOtp;





