import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { uploadAPI, profileAPI } from "../../services/api.js";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, signOut, loading: authLoading, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  
  // Use user from AuthContext (fetched from backend)
  const user = authUser || {
    name: "Loading...",
    email: "",
    avatarInitials: "U",
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleLogout = () => {
    signOut();
    // Clear any other app state
    localStorage.clear();
    // Navigate to login
    navigate("/auth/login", { replace: true });
  };

  const handleClearCache = () => {
    // Clear cache logic
    if (window.confirm("Are you sure you want to clear cache?")) {
      localStorage.clear();
      showToast("Cache cleared successfully", "success");
    }
  };

  const handleClearHistory = () => {
    // Clear history logic
    if (window.confirm("Are you sure you want to clear history?")) {
      // Clear browsing history if needed
      showToast("History cleared successfully", "success");
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

    try {
      setUploading(true);

      // Upload image to Cloudinary
      const uploadResponse = await uploadAPI.uploadImage(file);

      if (uploadResponse.success && uploadResponse.data?.url) {
        // Update profile with new avatar URL
        const updateResponse = await profileAPI.update({
          avatarUrl: uploadResponse.data.url,
        });

        if (updateResponse.success) {
          // Refresh user data to show new avatar
          await refreshUser();
          showToast('Profile picture updated successfully!', 'success');
        } else {
          showToast(updateResponse.message || 'Failed to update profile picture', 'error');
        }
      } else {
        showToast(uploadResponse.message || 'Failed to upload image', 'error');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showToast(error.message || 'Failed to upload profile picture. Please try again.', 'error');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const menuItems = [
    {
      id: "kyc",
      label: "KYC Verification",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      onClick: () => navigate("/kyc"),
      badge: user?.kycStatus === "pending" ? "Pending" : user?.kycStatus === "approved" ? "Verified" : user?.kycStatus === "rejected" ? "Rejected" : null,
    },
    {
      id: "investments",
      label: "My Investments",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => navigate("/invest"),
    },
    {
      id: "wallet",
      label: "Wallet",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 7.5C4 6.67157 4.67157 6 5.5 6H18.5C19.3284 6 20 6.67157 20 7.5V16.5C20 17.3284 19.3284 18 18.5 18H5.5C4.67157 18 4 17.3284 4 16.5V7.5Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 9H15C14.1716 9 13.5 9.67157 13.5 10.5C13.5 11.3284 14.1716 12 15 12H20" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => navigate("/wallet"),
    },
    {
      id: "sell",
      label: "Sell Property",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 10H21M7 15H12M16 19H21M3 5H21M3 15H21M3 19H12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => navigate("/withdraw-info"),
    },
    {
      id: "language",
      label: "Language",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12H22" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => showToast("Language settings coming soon", "info"),
    },
    {
      id: "location",
      label: "Location",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="9" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => showToast("Location settings coming soon", "info"),
    },
    {
      id: "clear-cache",
      label: "Clear cache",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 6H5H21" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11V17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 11V17" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: handleClearCache,
    },
    {
      id: "clear-history",
      label: "Clear history",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 6V12L16 14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: handleClearHistory,
    },
    {
      id: "logout",
      label: "Log out",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 17L21 12L16 7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: handleLogout,
      isDestructive: true,
    },
  ];

  // Generate username from email or name
  const username = user.email
    ? `@${user.email.split("@")[0]}`
    : user.name
    ? `@${user.name.toLowerCase().replace(/\s+/g, "")}`
    : "@user";

  // Show loading state
  if (authLoading) {
    return (
      <div className="profile-page">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show message
  if (!authUser) {
    return (
      <div className="profile-page">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Please log in to view your profile.</p>
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
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <button type="button" className="profile-header__back" onClick={handleBack} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="profile-header__title">My Profile</h1>
        <div className="profile-header__spacer"></div>
      </header>

      {/* Profile Information */}
      <div className="profile-info">
        <div className="profile-picture-wrapper">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="profile-picture"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="profile-picture-fallback">
              {user.avatarInitials || user.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          <button
            type="button"
            className="profile-picture__camera"
            aria-label="Change profile picture"
            onClick={handleAvatarClick}
            disabled={uploading}
            title={uploading ? "Uploading..." : "Change profile picture"}
          >
            {uploading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite" />
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite" />
                </circle>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
        <div className="profile-details">
          <div className="profile-details__row">
            <div className="profile-details__name-section">
              <h2 className="profile-name">{user.name}</h2>
              <p className="profile-username">{username}</p>
            </div>
            <button type="button" className="profile-edit-btn" onClick={() => navigate("/profile/edit")}>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="profile-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`profile-menu__item ${item.isDestructive ? "profile-menu__item--destructive" : ""}`}
            onClick={item.onClick}
          >
            <span className="profile-menu__icon">{item.icon}</span>
            <span className="profile-menu__label">{item.label}</span>
            {item.badge && (
              <span className={`profile-menu__badge profile-menu__badge--${user?.kycStatus || 'pending'}`}>
                {item.badge}
              </span>
            )}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="profile-menu__arrow"
            >
              <path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Profile;
