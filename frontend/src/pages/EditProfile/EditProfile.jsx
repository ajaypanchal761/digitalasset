import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { profileAPI, uploadAPI } from "../../services/api.js";
import Select from "../../components/common/Select";
import "./EditProfile.css";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user: authUser, refreshUser } = useAuth();
  const { showToast } = useToast();

  // Generate username from email (username is derived from email, not stored separately)
  const generateUsername = (email) => {
    if (!email) return "";
    return `@${email.split("@")[0]}`;
  };

  // Extract country code from phone if it exists
  const extractCountryCode = (phone) => {
    if (!phone) return "+91";
    // If phone starts with country code, extract it
    if (phone.startsWith("+")) {
      // Handle India (+91) specifically first
      if (phone.startsWith("+91")) {
        return "+91";
      }
      // For other country codes, match 1-2 digits (not 3 to avoid matching +917, +918, etc.)
      const match = phone.match(/^\+(\d{1,2})/);
      return match ? `+${match[1]}` : "+91";
    }
    return "+91"; // Default to +91 for India
  };

  // Extract phone number without country code
  const extractPhoneNumber = (phone) => {
    if (!phone) return "";
    
    // Remove country code - handle India (+91) specifically first
    if (phone.startsWith("+91")) {
      return phone.replace(/^\+91\s?/, "");
    }
    // For other country codes, remove 1-2 digits (not 3 to avoid matching +917, +918, etc.)
    if (phone.startsWith("+")) {
      return phone.replace(/^\+\d{1,2}\s?/, "");
    }
    
    // If no country code, return as is
    return phone;
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    countryCode: "+91",
  });

  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null); // Store the actual file for upload
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Update form data when authUser loads
  useEffect(() => {
    if (authUser) {
      const username = generateUsername(authUser.email);
      const countryCode = extractCountryCode(authUser.phone);
      const phoneNumber = extractPhoneNumber(authUser.phone);

      setFormData({
        name: authUser.name || "",
        email: authUser.email || "",
        username: username,
        phone: phoneNumber || authUser.phone || "",
        countryCode: countryCode,
      });
      setAvatarPreview(authUser.avatarUrl || "");
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }

      // Store the file for upload
      setAvatarFile(file);
      
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!authUser) {
      showToast("Please log in to update your profile", "error");
      navigate("/auth/login");
      return;
    }

    try {
      setSaving(true);

      // Prepare data for backend (username is not stored, it's derived from email)
      const updateData = {
        name: formData.name,
        phone: formData.countryCode + formData.phone.replace(/\D/g, ""), // Combine country code and phone
        // Note: email cannot be changed, username is derived from email
      };

      // If avatar was changed, upload it first
      if (avatarFile) {
        try {
          const uploadResponse = await uploadAPI.uploadImage(avatarFile);
          
          if (uploadResponse.success && uploadResponse.data?.url) {
            updateData.avatarUrl = uploadResponse.data.url;
          } else {
            throw new Error(uploadResponse.message || 'Failed to upload avatar');
          }
        } catch (uploadError) {
          showToast('Failed to upload profile picture. Please try again.', 'error');
          setSaving(false);
          return;
        }
      } else if (avatarPreview && !avatarPreview.startsWith('data:') && avatarPreview !== authUser.avatarUrl) {
        // If avatarPreview is a URL (not base64) and different from current, use it
        // This handles cases where user might have set a URL directly
        updateData.avatarUrl = avatarPreview;
      }

      // Save to backend
      const response = await profileAPI.update(updateData);

      if (response.success) {
        // Refresh user data from backend
        await refreshUser();
        // Navigate back to profile page
        navigate("/profile");
      } else {
        showToast(response.message || "Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast(error.message || "Failed to update profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/profile");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="edit-profile">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!authUser) {
    return (
      <div className="edit-profile">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Please log in to edit your profile.</p>
          <button
            onClick={() => navigate("/auth/login")}
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
    <div className="edit-profile">
      {/* Header */}
      <header className="edit-profile__header">
        <button type="button" className="edit-profile__back-btn" onClick={handleBack} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19L5 12L12 5" />
          </svg>
        </button>
        <h1 className="edit-profile__title">Edit Profile</h1>
        <button 
          type="button" 
          className="edit-profile__save-btn" 
          onClick={handleSave} 
          aria-label="Save changes"
          disabled={saving}
        >
          {saving ? (
            <span>Saving...</span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17L4 12" />
            </svg>
          )}
        </button>
      </header>

      {/* Profile Picture */}
      <div className="edit-profile__avatar-section">
        <div className="edit-profile__avatar-wrapper">
          {avatarPreview ? (
            <img 
              src={avatarPreview} 
              alt={formData.name} 
              className="edit-profile__avatar"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="edit-profile__avatar-fallback">
              {formData.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
          <label htmlFor="avatar-upload" className="edit-profile__camera-btn" aria-label="Change profile picture">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </label>
        </div>
      </div>

      {/* Form Fields */}
      <div className="edit-profile__form">
        <div className="edit-profile__field">
          <label htmlFor="name" className="edit-profile__label">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="edit-profile__input"
            placeholder="Enter your name"
          />
        </div>

        <div className="edit-profile__field">
          <label htmlFor="email" className="edit-profile__label">
            E mail address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="edit-profile__input"
            placeholder="Enter your email"
            readOnly
            style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
          />
          <span className="edit-profile__hint">Email cannot be changed (used for OTP verification)</span>
        </div>

        <div className="edit-profile__field">
          <label htmlFor="username" className="edit-profile__label">
            User name
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="edit-profile__input"
            placeholder="Enter your username"
          />
        </div>

        <div className="edit-profile__field">
          <label htmlFor="phone" className="edit-profile__label">
            Phone number
          </label>
          <div className="edit-profile__phone-wrapper">
            <Select
              name="countryCode"
              value={formData.countryCode}
              onChange={handleInputChange}
              options={[
                { value: '+91', label: '+91' },
                { value: '+1', label: '+1' },
                { value: '+44', label: '+44' },
                { value: '+86', label: '+86' },
                { value: '+971', label: '+971' },
                { value: '+65', label: '+65' },
                { value: '+60', label: '+60' },
              ]}
              className="edit-profile__country-code"
            />
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="edit-profile__input edit-profile__input--phone"
              placeholder="Enter your phone number"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;

