import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard.jsx";
import { UserIcon, MailIcon, PhoneIcon, LockIcon } from "../../components/common/AuthIcons.jsx";
import AuthInput from "../../components/forms/AuthInput.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    contact: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.contact.trim()) {
      nextErrors.contact = "Phone or email is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!form.acceptTerms) {
      nextErrors.acceptTerms = "You must accept the terms and conditions.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowEmailVerification(false);
    setVerificationSuccess(false);

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      const result = await signUp({
        fullName: form.fullName,
        contact: form.contact,
        email: form.email,
        password: form.password,
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
          name="contact"
          placeholder="Phone or Email"
          value={form.contact}
          onChange={handleChange}
          autoComplete="tel"
        />
        {errors.contact ? <span className="auth-error-text">{errors.contact}</span> : null}

        <AuthInput
          icon={<MailIcon />}
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
        />
        {errors.email ? <span className="auth-error-text">{errors.email}</span> : null}

        <AuthInput
          icon={<LockIcon />}
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
        />
        {errors.password ? <span className="auth-error-text">{errors.password}</span> : null}

        <AuthInput
          icon={<LockIcon />}
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />
        {errors.confirmPassword ? (
          <span className="auth-error-text">{errors.confirmPassword}</span>
        ) : null}

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
        {errors.acceptTerms ? <span className="auth-error-text">{errors.acceptTerms}</span> : null}

        <button type="submit" className="auth-primary-btn" disabled={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>
      )}
    </AuthCard>
  );
};

export default Register;
