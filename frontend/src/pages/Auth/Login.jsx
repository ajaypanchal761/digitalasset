import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard.jsx";
import { MailIcon, LockIcon } from "../../components/common/AuthIcons.jsx";
import AuthInput from "../../components/forms/AuthInput.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const DEFAULT_CREDENTIALS = {
  email: "demo@digitalassets.in",
  password: "Demo@123",
};

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [form, setForm] = useState(DEFAULT_CREDENTIALS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await signIn(form);

      if (!result.success) {
        setError(result.error || "Unable to sign in. Please try again.");
        setSubmitting(false);
        return;
      }

      navigate("/kyc", { replace: true });
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
        <AuthInput
          icon={<MailIcon />}
          type="email"
          name="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          autoFocus
        />
        <AuthInput
          icon={<LockIcon />}
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
        />
        <div className="auth-meta">
          <Link to="/auth/forgot-password">Forgot password?</Link>
        </div>
        <button type="submit" className="auth-primary-btn" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in & Continue"}
        </button>
      </form>
    </AuthCard>
  );
};

export default Login;
