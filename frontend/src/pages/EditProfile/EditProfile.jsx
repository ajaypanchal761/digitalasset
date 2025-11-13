import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import "./EditProfile.css";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user: appUser, updateUser } = useAppState();
  const { user: authUser } = useAuth();

  // Merge user data from both contexts
  const initialUser = {
    ...appUser,
    email: authUser?.email || appUser?.email || "",
    phone: appUser?.phone || authUser?.phone || "",
    username: appUser?.username || (authUser?.email ? `@${authUser.email.split("@")[0]}` : `@${appUser.name.toLowerCase().replace(/\s+/g, "")}`),
    countryCode: appUser?.countryCode || "+91",
  };

  const [formData, setFormData] = useState({
    name: initialUser.name || "",
    email: initialUser.email || "",
    username: initialUser.username || "",
    phone: initialUser.phone || "",
    countryCode: initialUser.countryCode || "+91",
  });

  const [avatarPreview, setAvatarPreview] = useState(initialUser.avatarUrl || "");

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
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Update user in AppStateContext
    updateUser({
      ...appUser,
      name: formData.name,
      username: formData.username,
      phone: formData.phone,
      countryCode: formData.countryCode,
      avatarUrl: avatarPreview || appUser.avatarUrl,
      avatarInitials: avatarPreview ? appUser.avatarInitials : appUser.avatarInitials,
    });
    
    // TODO: Save profile changes to backend
    console.log("Saving profile:", { ...formData, avatarUrl: avatarPreview });
    
    // Navigate back to profile page
    navigate("/profile");
  };

  const handleBack = () => {
    navigate("/profile");
  };

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
        <button type="button" className="edit-profile__save-btn" onClick={handleSave} aria-label="Save changes">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17L4 12" />
          </svg>
        </button>
      </header>

      {/* Profile Picture */}
      <div className="edit-profile__avatar-section">
        <div className="edit-profile__avatar-wrapper">
          {avatarPreview ? (
            <img src={avatarPreview} alt={formData.name} className="edit-profile__avatar" />
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
            <select
              name="countryCode"
              value={formData.countryCode}
              onChange={handleInputChange}
              className="edit-profile__country-code"
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

