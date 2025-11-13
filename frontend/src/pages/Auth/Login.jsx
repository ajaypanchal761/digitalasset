import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard.jsx";
import { MailIcon, PhoneIcon } from "../../components/common/AuthIcons.jsx";
import AuthInput from "../../components/forms/AuthInput.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const DEFAULT_CREDENTIALS = {
  phoneOrEmail: "demo@digitalassets.in",
  otp: "",
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [form, setForm] = useState(DEFAULT_CREDENTIALS);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    // Only allow numbers for OTP
    if (name === "otp") {
      const numericValue = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSendOtp = async () => {
    setError("");

    if (!form.phoneOrEmail.trim()) {
      setError("Please enter phone number or email.");
      return;
    }

    try {
      setSendingOtp(true);
      // Simulate OTP sending - in real app, call API to send OTP
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOtpSent(true);
      setSuccessMessage("OTP has been sent to your phone/email.");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!otpSent) {
      handleSendOtp();
      return;
    }

    if (!form.otp.trim()) {
      setError("Please enter OTP.");
      return;
    }

    if (form.otp.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await signIn({
        phoneOrEmail: form.phoneOrEmail,
        otp: form.otp,
      });

      if (!result.success) {
        setError(result.error || "Invalid OTP. Please try again.");
        setSubmitting(false);
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Unexpected error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Hello, Sign in!"
      subtitle="Enter your credentials to continue with your KYC verification"
      footer={
        <p>
          Dont have an account? <Link to="/auth/register">Sign up</Link>
        </p>
      }
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {error ? <div className="auth-error">{error}</div> : null}
        {successMessage ? (
          <div className="auth-success">{successMessage}</div>
        ) : null}
        <AuthInput
          icon={<PhoneIcon />}
          type="text"
          name="phoneOrEmail"
          placeholder="Enter phone number or email"
          value={form.phoneOrEmail}
          onChange={handleChange}
          autoComplete="username"
          autoFocus
          disabled={otpSent}
        />
        {otpSent && (
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
        )}
        {otpSent && (
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
        )}
        <button type="submit" className="auth-primary-btn" disabled={submitting || sendingOtp}>
          {submitting
            ? "Signing in..."
            : otpSent
              ? "Verify OTP & Sign in"
              : sendingOtp
                ? "Sending OTP..."
                : "Send OTP"}
        </button>
      </form>
    </AuthCard>
  );
};

export default Login;
