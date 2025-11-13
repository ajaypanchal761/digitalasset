import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard.jsx";
import { UserIcon, MailIcon, PhoneIcon } from "../../components/common/AuthIcons.jsx";
import AuthInput from "../../components/forms/AuthInput.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    otp: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    // Only allow numbers for phone and OTP
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "phone" || name === "otp") {
      const numericValue = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateBasicInfo = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      nextErrors.phone = "Enter a valid 10-digit phone number.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.acceptTerms) {
      nextErrors.acceptTerms = "You must accept the terms and conditions.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateOtp = () => {
    const nextErrors = {};

    if (!form.otp.trim()) {
      nextErrors.otp = "OTP is required.";
    } else if (form.otp.length !== 6 || !/^[0-9]{6}$/.test(form.otp.trim())) {
      nextErrors.otp = "OTP must be 6 digits.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSendOtp = async () => {
    setErrors({});
    if (!validateBasicInfo()) {
      return;
    }

    try {
      setSendingOtp(true);
      // Simulate OTP sending - in real app, call API to send OTP
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOtpSent(true);
      setErrors({});
    } catch (err) {
      setErrors({ form: "Failed to send OTP. Please try again." });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowEmailVerification(false);
    setVerificationSuccess(false);

    if (!otpSent) {
      handleSendOtp();
      return;
    }

    if (!validateOtp()) {
      return;
    }

    try {
      setSubmitting(true);
      const result = await signUp({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        otp: form.otp,
      });

      if (result.success) {
        setUserEmail(form.email);
        setShowEmailVerification(true);
        // Scroll verification banner into view on mobile
        setTimeout(() => {
          const bannerElement = document.getElementById("email-verification-banner");
          if (bannerElement) {
            const isMobile = window.matchMedia("(max-width: 640px)").matches;
            if (isMobile) {
              const wrapperElement = document.querySelector(".auth-container");
              if (wrapperElement) {
                const wrapperRect = wrapperElement.getBoundingClientRect();
                const bannerRect = bannerElement.getBoundingClientRect();
                const scrollTop = wrapperElement.scrollTop;
                const targetScroll = scrollTop + (bannerRect.top - wrapperRect.top) - 20;
                wrapperElement.scrollTo({
                  top: targetScroll,
                  behavior: "smooth",
                });
              }
            }
          }
        }, 100);
      }
    } catch (err) {
      setErrors({ form: "Unable to register right now. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-verify after 5 seconds and redirect to KYC
  useEffect(() => {
    if (showEmailVerification && !verificationSuccess) {
      const timer = setTimeout(() => {
        setVerificationSuccess(true);
        setTimeout(() => {
          navigate("/kyc", { 
            replace: true
          });
        }, 2000);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showEmailVerification, verificationSuccess, navigate]);

  return (
    <AuthCard
      title="Create Your Account"
      subtitle="Invest in high-potential digital properties with confidence"
      footer={
        <p>
          Already have an account? <Link to="/auth/login">Sign in</Link>
        </p>
      }
    >
      {showEmailVerification && (
        <div className="auth-verification-banner" id="email-verification-banner">
          {verificationSuccess ? (
            <div className="verification-success">
              <div className="verification-icon">✓</div>
              <div className="verification-content">
                <h3>Email Verified Successfully!</h3>
                <p>Your email has been verified. Redirecting to login...</p>
              </div>
            </div>
          ) : (
            <div className="verification-pending">
              <div className="verification-icon">✉</div>
              <div className="verification-content">
                <h3>Verify Your Email</h3>
                <p>
                  We've sent a verification link to <strong>{userEmail}</strong>
                </p>
                <p className="verification-instruction">
                  Please check your email and click on the verification link to complete your registration.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {!showEmailVerification && (
        <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {errors.form ? <div className="auth-error">{errors.form}</div> : null}

        <AuthInput
          icon={<UserIcon />}
          name="fullName"
          placeholder="Full name"
          value={form.fullName}
          onChange={handleChange}
          autoComplete="name"
        />
        {errors.fullName ? <span className="auth-error-text">{errors.fullName}</span> : null}

        <AuthInput
          icon={<PhoneIcon />}
          type="tel"
          name="phone"
          placeholder="Phone number"
          value={form.phone}
          onChange={handleChange}
          autoComplete="tel"
          disabled={otpSent}
        />
        {errors.phone ? <span className="auth-error-text">{errors.phone}</span> : null}

        <AuthInput
          icon={<MailIcon />}
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          disabled={otpSent}
        />
        {errors.email ? <span className="auth-error-text">{errors.email}</span> : null}

        {otpSent && (
          <>
            <AuthInput
              icon={<MailIcon />}
              type="text"
              name="otp"
              placeholder="Enter 6-digit OTP"
              value={form.otp}
              onChange={handleChange}
              autoComplete="one-time-code"
              maxLength={6}
            />
            {errors.otp ? <span className="auth-error-text">{errors.otp}</span> : null}
            <div className="auth-meta">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f8fafc",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                  fontSize: "0.95rem",
                }}
              >
                {sendingOtp ? "Sending..." : "Resend OTP"}
              </button>
            </div>
          </>
        )}

        {!otpSent && (
          <label className="auth-terms">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={handleChange}
            />
            <span>
              I agree to the <Link to="/legal/terms">Terms & Conditions</Link>
            </span>
          </label>
        )}
        {errors.acceptTerms ? <span className="auth-error-text">{errors.acceptTerms}</span> : null}

        <button type="submit" className="auth-primary-btn" disabled={submitting || sendingOtp}>
          {submitting
            ? "Creating account..."
            : otpSent
              ? "Verify OTP & Sign up"
              : sendingOtp
                ? "Sending OTP..."
                : "Send OTP"}
        </button>
      </form>
      )}
    </AuthCard>
  );
};

export default Register;
