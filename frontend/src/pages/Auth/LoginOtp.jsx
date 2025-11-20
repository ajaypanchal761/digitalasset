import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./VerifyOtp.css";

const LoginOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  
  const phone = location.state?.phone || "+91 000 000 0000";
  const phoneNumber = location.state?.phoneNumber || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  
  // Request cancellation and duplicate prevention
  const abortControllerRef = useRef(null);
  const isRequestInProgressRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);

  useEffect(() => {
    // Redirect to login if phone number is missing
    if (!phoneNumber) {
      navigate("/auth/login", { replace: true });
      return;
    }
    // Focus first input on mount
    inputRefs[0].current?.focus();
    // Enable resend after 30 seconds
    setTimeout(() => setCanResend(true), 30000);
  }, [phoneNumber, navigate]);

  // Auto-submit when all 6 digits are entered
  const autoSubmitRef = useRef(false);
  const autoSubmitTimerRef = useRef(null);
  
  useEffect(() => {
    const otpString = otp.join("");
    
    // Clear any existing timer
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    
    if (otpString.length === 6 && !isSubmitting && !autoSubmitRef.current && !isRequestInProgressRef.current) {
      // Prevent multiple auto-submits
      autoSubmitRef.current = true;
      
      // Small delay to ensure state is updated and prevent rapid triggers
      autoSubmitTimerRef.current = setTimeout(() => {
        // Double-check conditions before submitting
        if (!isSubmitting && !isRequestInProgressRef.current && otp.join("").length === 6) {
          const form = document.querySelector('.verify-otp-form');
          if (form) {
            // Trigger form submission - the form's onSubmit handler will call handleSubmit
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }
        autoSubmitRef.current = false;
      }, 500); // Increased delay to prevent rapid submissions
      
      return () => {
        if (autoSubmitTimerRef.current) {
          clearTimeout(autoSubmitTimerRef.current);
          autoSubmitTimerRef.current = null;
        }
      };
    } else if (otpString.length < 6) {
      autoSubmitRef.current = false;
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
        autoSubmitTimerRef.current = null;
      }
    }
  }, [otp, isSubmitting]);

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
    try {
      setIsSubmitting(true);
      // Resend OTP via API
      const response = await authAPI.sendOTP({
        phone: phoneNumber,
        purpose: 'login',
      });

      if (response.success) {
        setOtp(["", "", "", "", "", ""]);
        inputRefs[0].current?.focus();
        // Enable resend after 30 seconds
        setTimeout(() => setCanResend(true), 30000);
      } else {
        setErrors(response.message || "Failed to resend OTP. Please try again.");
        setTimeout(() => setCanResend(true), 5000);
      }
    } catch (err) {
      // Safely extract error message
      let errorMessage = "Failed to resend OTP. Please try again.";
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
      setTimeout(() => setCanResend(true), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Prevent multiple submissions - check both state and ref
    if (isSubmitting || isRequestInProgressRef.current) {
      console.log('⏸️ LoginOtp - Submission already in progress, skipping');
      return;
    }
    
    // Debounce: prevent rapid submissions (within 2 seconds)
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 2000) {
      console.log('⏸️ LoginOtp - Too soon after last submission, skipping');
      return;
    }
    lastSubmitTimeRef.current = now;
    
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

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const currentAbortController = abortControllerRef.current;

    try {
      setIsSubmitting(true);
      isRequestInProgressRef.current = true;
      autoSubmitRef.current = true; // Prevent auto-submit during request
      
      console.log('📡 LoginOtp - Submitting OTP login request');
      
      // Login with OTP
      const loginResponse = await authAPI.loginWithOTP({
        phone: phoneNumber,
        otp: otpString,
      });

      // Check if request was aborted
      if (currentAbortController.signal.aborted) {
        console.log('⚠️ LoginOtp - Request was aborted');
        return;
      }

      if (loginResponse.success && loginResponse.token) {
        console.log('✅ LoginOtp - Login successful');
        // Token is already set by loginWithOTP
        // Refresh user data in AuthContext
        await refreshUser();
        // Navigate to dashboard
        navigate("/dashboard", { replace: true });
      } else {
        setErrors(loginResponse.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      // Check if request was aborted
      if (currentAbortController.signal.aborted) {
        console.log('⚠️ LoginOtp - Request was aborted');
        return;
      }
      
      // Safely extract error message
      let errorMessage = "Unable to verify OTP. Please try again.";
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
      
      // Don't show error if it's a rate limit - user already knows
      if (errorMessage.includes('Too many') || errorMessage.includes('429')) {
        errorMessage = "Too many authentication attempts. Please wait a moment and try again.";
      }
      
      setErrors(errorMessage);
      console.error('❌ LoginOtp - Error:', errorMessage);
    } finally {
      setIsSubmitting(false);
      isRequestInProgressRef.current = false;
      autoSubmitRef.current = false;
      
      // Clear abort controller after a delay
      setTimeout(() => {
        if (abortControllerRef.current === currentAbortController) {
          abortControllerRef.current = null;
        }
      }, 1000);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
    };
  }, []);

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

