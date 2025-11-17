import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./VerifyOtp.css";

const LoginOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  
  const phone = location.state?.phone || "+91 000 000 0000";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    // Focus first input on mount
    inputRefs[0].current?.focus();
    // Enable resend after 30 seconds
    setTimeout(() => setCanResend(true), 30000);
  }, []);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    const numValue = value.replace(/\D/g, "");
    if (numValue.length > 1) {
      // If pasting multiple digits
      const digits = numValue.slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      // Focus next empty input or last input
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs[nextIndex].current?.focus();
    } else if (numValue.length === 1) {
      const newOtp = [...otp];
      newOtp[index] = numValue;
      setOtp(newOtp);
      // Move to next input
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
    // Simulate resend OTP
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setOtp(["", "", "", "", "", ""]);
    inputRefs[0].current?.focus();
    // Enable resend after 30 seconds
    setTimeout(() => setCanResend(true), 30000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      // Verify OTP and sign in
      const phoneNumber = phone.replace(/\D/g, "");
      const result = await signIn({
        phoneOrEmail: phoneNumber,
        otp: otpString,
      });

      if (result.success) {
        // Navigate to dashboard
        navigate("/dashboard", { replace: true });
      } else {
        setErrors(result.error || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setErrors("Unable to verify OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="verify-otp-page">
      <div className="verify-otp-container">
        {/* Illustration */}
        <div className="verify-otp-illustration">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <div className="verify-otp-content">
          <h1 className="verify-otp-title">Sign in</h1>
          <p className="verify-otp-subtitle">
            Enter the Code sent to <span className="phone-number">{phone}</span>
          </p>

          <form className="verify-otp-form" onSubmit={handleSubmit}>
            {errors && <div className="verify-otp-error">{errors}</div>}

            {/* OTP Input Fields */}
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="tel"
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  inputMode="numeric"
                />
              ))}
            </div>

            {/* Resend Code */}
            <div className="resend-code">
              <span className="resend-text">I Didn't Receive the Code! </span>
              <button
                type="button"
                className="resend-link"
                onClick={handleResend}
                disabled={!canResend}
              >
                Resend Code
              </button>
            </div>

            <button 
              type="submit" 
              className="verify-otp-btn"
              disabled={isSubmitting || otp.join("").length !== 6}
            >
              {isSubmitting ? "Verifying..." : "Verify"}
            </button>
          </form>

          <p className="verify-otp-footer">
            Don't have an account? <Link to="/auth/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginOtp;

