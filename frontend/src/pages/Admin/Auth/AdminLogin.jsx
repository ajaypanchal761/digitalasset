import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminAuthAPI } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import "./AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { refreshUser, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if admin is already logged in
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    console.log('🔍 AdminLogin - useEffect: Checking for existing adminToken:', {
      hasToken: !!adminToken,
      tokenLength: adminToken?.length,
      hasUser: !!user,
      userRole: user?.role,
      loading,
      timestamp: new Date().toISOString()
    });

    if (!adminToken) {
      // No token, stay on login page
      return;
    }

    // If we have a token and user is loaded and is admin, redirect to dashboard
    if (!loading && user && user.role === 'admin') {
      console.log('✅ AdminLogin - User already logged in as admin, redirecting to dashboard');
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    // If we have a token but user is not loaded yet, try to fetch user
    if (!loading && !user && adminToken) {
      console.log('🔄 AdminLogin - Token exists but no user, fetching user data...');
      refreshUser();
    }
  }, [user, loading, navigate, refreshUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors("");
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors("");

    // Check initial token state
    const initialToken = localStorage.getItem('adminToken');
    console.log('🔐 AdminLogin - Form submitted, initial state:', {
      hasToken: !!initialToken,
      tokenLength: initialToken?.length,
      email: formData.email.trim(),
      timestamp: new Date().toISOString()
    });

    // Validation
    if (!formData.email.trim()) {
      setErrors("Email is required");
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrors("Please enter a valid email address");
      return;
    }

    if (!formData.password.trim()) {
      setErrors("Password is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors("");

      console.log('🔐 AdminLogin - Calling adminAuthAPI.login...');
      const response = await adminAuthAPI.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      console.log('📥 AdminLogin - Response received:', {
        success: response?.success,
        hasToken: !!response?.token,
        hasUser: !!response?.user,
        message: response?.message,
        fullResponse: response
      });

      // Check if response is valid
      if (!response) {
        console.error('❌ AdminLogin - No response from server');
        setErrors("No response from server. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Check for token in response
      const token = response?.token;
      console.log('🔍 AdminLogin - Token check:', {
        hasResponse: !!response,
        responseSuccess: response?.success,
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? token.substring(0, 50) + '...' : 'null'
      });

      if (response && response.success && token) {
        console.log('✅ AdminLogin - Login successful, verifying adminToken...');

        // Verify adminToken was saved
        const savedToken = localStorage.getItem('adminToken');
        console.log('🔍 AdminLogin - Token verification:', {
          hasSavedToken: !!savedToken,
          tokenMatches: savedToken === token,
          savedTokenLength: savedToken?.length,
          responseTokenLength: token?.length,
          savedTokenPreview: savedToken ? savedToken.substring(0, 50) + '...' : 'null',
          responseTokenPreview: token ? token.substring(0, 50) + '...' : 'null'
        });

        if (!savedToken || savedToken !== token) {
          console.error('❌ AdminLogin - CRITICAL: Token mismatch or not saved!');
          console.error('Expected token:', token ? token.substring(0, 50) + '...' : 'null');
          console.error('Saved token:', savedToken ? savedToken.substring(0, 50) + '...' : 'null');
          setErrors("Failed to save authentication token. Please try again.");
          setIsSubmitting(false);
          return;
        }

        console.log('✅ AdminLogin - Token verified, refreshing user then navigating...');
        // Refresh user data first, then navigate
        try {
          await refreshUser();
          console.log('✅ AdminLogin - User refreshed, navigating to dashboard...');
          // Small delay to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 100));
          navigate("/admin/dashboard", { replace: true });
        } catch (refreshError) {
          console.error('❌ AdminLogin - Error refreshing user, navigating anyway:', refreshError);
          // Navigate anyway - AdminLayout will handle it
          navigate("/admin/dashboard", { replace: true });
        }
      } else {
        const errorMsg = response?.message || response?.error || "Invalid credentials. Please try again.";
        console.error('❌ AdminLogin - Login failed:', errorMsg);
        console.error('❌ AdminLogin - Response details:', {
          success: response?.success,
          hasToken: !!response?.token,
          message: response?.message,
          error: response?.error
        });
        setErrors(errorMsg);
      }
    } catch (err) {
      console.error('❌ AdminLogin - Exception during login:', err);
      console.error('❌ AdminLogin - Error details:', {
        message: err?.message,
        stack: err?.stack,
        name: err?.name
      });

      let errorMessage = "Failed to login. Please try again.";
      if (err instanceof Error) {
        const msg = err.message;
        if (typeof msg === 'string' && msg && msg.trim()) {
          errorMessage = msg.trim();
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setErrors(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.email.trim() && validateEmail(formData.email) && formData.password.trim();

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        {/* Illustration */}
        <div className="admin-login-illustration">
          <img
            src="/logo1.png"
            alt="Logo"
            style={{ width: '80px', height: 'auto' }}
          />
        </div>

        {/* Content */}
        <div className="admin-login-content">
          <h1 className="admin-login-title">Admin Sign In</h1>
          <p className="admin-login-subtitle">Enter your email and password to access the admin panel</p>

          <form
            className="admin-login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {errors && <div className="admin-login-error">{errors}</div>}

            {/* Email Input */}
            <div className="admin-login-field">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="admin-login-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password Input */}
            <div className="admin-login-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                <Link
                  to="/admin-auth/forgot-password"
                  style={{
                    fontSize: '0.875rem',
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="admin-login-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="admin-login-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="admin-login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#6b7280" strokeWidth="1.5" />
                      <path d="M2.01675 10C3.22575 6.25 6.29925 3.75 10 3.75C13.7008 3.75 16.7742 6.25 17.9832 10C16.7742 13.75 13.7008 16.25 10 16.25C6.29925 16.25 3.22575 13.75 2.01675 10Z" stroke="#6b7280" strokeWidth="1.5" />
                      <path d="M2.5 2.5L17.5 17.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#6b7280" strokeWidth="1.5" />
                      <path d="M2.01675 10C3.22575 6.25 6.29925 3.75 10 3.75C13.7008 3.75 16.7742 6.25 17.9832 10C16.7742 13.75 13.7008 16.25 10 16.25C6.29925 16.25 3.22575 13.75 2.01675 10Z" stroke="#6b7280" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="admin-login-continue-btn"
              disabled={isSubmitting || !isValid}
              onClick={(e) => {
                // Additional safety check
                if (!isValid || isSubmitting) {
                  e.preventDefault();
                }
              }}
            >
              {isSubmitting ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <div className="admin-login-footer">
            <p>
              Don't have an admin account? <Link to="/admin-auth/register">Sign up</Link>
            </p>
            {/* <p className="admin-login-switch">
              <Link to="/auth/login">User Login</Link>
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
