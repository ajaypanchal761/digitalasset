import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { adminAuthAPI } from "../../../services/api.js";
import "./AdminProfileSettings.css";

const AdminProfileSettings = () => {
  const navigate = useNavigate();
  const { user: authUser, refreshUser } = useAuth();
  const { showToast } = useToast();

  // Extract country code from phone if it exists
  const extractCountryCode = (phone) => {
    if (!phone) return "+91";
    if (phone.startsWith("+")) {
      if (phone.startsWith("+91")) {
        return "+91";
      }
      const match = phone.match(/^\+(\d{1,2})/);
      return match ? `+${match[1]}` : "+91";
    }
    return "+91";
  };

  // Extract phone number without country code
  const extractPhoneNumber = (phone) => {
    if (!phone) return "";
    if (phone.startsWith("+91")) {
      return phone.replace(/^\+91\s?/, "");
    }
    if (phone.startsWith("+")) {
      return phone.replace(/^\+\d{1,2}\s?/, "");
    }
    return phone;
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+91",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Update form data when authUser loads
  useEffect(() => {
    if (authUser) {
      const countryCode = extractCountryCode(authUser.phone);
      const phoneNumber = extractPhoneNumber(authUser.phone);

      setFormData({
        name: authUser.name || "",
        email: authUser.email || "",
        phone: phoneNumber || authUser.phone || "",
        countryCode: countryCode,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [authUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!authUser) {
      showToast("Please log in to update your profile", "error");
      navigate("/admin-auth/login");
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      showToast("Name is required", "error");
      return;
    }

    if (!formData.email.trim()) {
      showToast("Email is required", "error");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    // If password section is shown, validate password fields
    if (showPasswordSection) {
      if (formData.newPassword && formData.newPassword.length < 6) {
        showToast("New password must be at least 6 characters long", "error");
        return;
      }

      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        showToast("New password and confirm password do not match", "error");
        return;
      }

      if (formData.newPassword && !formData.currentPassword) {
        showToast("Current password is required to change password", "error");
        return;
      }
    }

    try {
      setSaving(true);

      // Prepare data for backend
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.countryCode + formData.phone.replace(/\D/g, ""),
      };

      // Add password fields only if password is being changed
      if (showPasswordSection && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await adminAuthAPI.updateProfile(updateData);

      if (response.success) {
        showToast("Profile updated successfully!", "success");
        // Refresh user data from backend
        await refreshUser();
        // Reset password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setShowPasswordSection(false);
      } else {
        showToast(response.message || "Failed to update profile", "error");
      }
    } catch (error) {
      showToast(error.message || "Failed to update profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/admin/dashboard");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="admin-profile-settings">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!authUser || authUser.role !== "admin") {
    return (
      <div className="admin-profile-settings">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Please log in as admin to edit your profile.</p>
          <button
            onClick={() => navigate("/admin-auth/login")}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile-settings">
      {/* Header */}
      <header className="admin-profile-settings__header">
        <button
          type="button"
          className="admin-profile-settings__back-btn"
          onClick={handleBack}
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19L5 12L12 5" />
          </svg>
        </button>
        <h1 className="admin-profile-settings__title">Profile Settings</h1>
        <button
          type="button"
          className="admin-profile-settings__save-btn"
          onClick={handleSave}
          aria-label="Save changes"
          disabled={saving}
        >
          {saving ? (
            <span>Saving...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17L4 12" />
              </svg>
              <span>Save</span>
            </>
          )}
        </button>
      </header>

      {/* Form Fields */}
      <div className="admin-profile-settings__form">
        <div className="admin-profile-settings__field">
          <label htmlFor="name" className="admin-profile-settings__label">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="admin-profile-settings__input"
            placeholder="Enter your name"
          />
        </div>

        <div className="admin-profile-settings__field">
          <label htmlFor="email" className="admin-profile-settings__label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="admin-profile-settings__input"
            placeholder="Enter your email"
          />
        </div>

        <div className="admin-profile-settings__field">
          <label htmlFor="phone" className="admin-profile-settings__label">
            Phone Number
          </label>
          <div className="admin-profile-settings__phone-wrapper">
            <select
              name="countryCode"
              value={formData.countryCode}
              onChange={handleInputChange}
              className="admin-profile-settings__country-code"
            >
              <option value="+91">+91</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+86">+86</option>
              <option value="+971">+971</option>
              <option value="+65">+65</option>
              <option value="+60">+60</option>
            </select>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="admin-profile-settings__input admin-profile-settings__input--phone"
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        {/* Password Section */}
        <div className="admin-profile-settings__section">
          <div className="admin-profile-settings__section-header">
            <h2 className="admin-profile-settings__section-title">Change Password</h2>
            <button
              type="button"
              className="admin-profile-settings__toggle-btn"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              {showPasswordSection ? "Hide" : "Show"}
            </button>
          </div>

          {showPasswordSection && (
            <div className="admin-profile-settings__password-fields">
              <div className="admin-profile-settings__field">
                <label htmlFor="currentPassword" className="admin-profile-settings__label">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="admin-profile-settings__input"
                  placeholder="Enter current password"
                />
              </div>

              <div className="admin-profile-settings__field">
                <label htmlFor="newPassword" className="admin-profile-settings__label">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="admin-profile-settings__input"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div className="admin-profile-settings__field">
                <label htmlFor="confirmPassword" className="admin-profile-settings__label">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="admin-profile-settings__input"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfileSettings;

