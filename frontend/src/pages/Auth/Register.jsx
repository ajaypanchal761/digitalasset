import { useState } from "react";
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
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);

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
        setSuccess(true);
        setTimeout(() => {
          navigate("/kyc", { replace: true });
        }, 600);
      }
    } catch (err) {
      setErrors({ form: "Unable to register right now. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

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
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {errors.form ? <div className="auth-error">{errors.form}</div> : null}
        {success ? (
          <div className="auth-success">Account created. Redirecting</div>
        ) : null}

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
    </AuthCard>
  );
};

export default Register;
