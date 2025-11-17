import { useState } from 'react';

const AdminHeader = ({ userName = 'Admin User', userAvatar = null }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy notification count
  const notificationCount = 5;

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout clicked');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search:', searchQuery);
  };

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <form onSubmit={handleSearch} className="admin-header__search">
          <input
            type="text"
            placeholder="Search users, properties, transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-header__search-input"
          />
          <button type="submit" className="admin-header__search-button" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </form>
      </div>

      <div className="admin-header__right">
        {/* Notifications */}
        <div className="admin-header__notifications">
          <button
            className="admin-header__notifications-button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notificationCount > 0 && (
              <span className="admin-header__notifications-badge">{notificationCount}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="admin-header__notifications-dropdown">
              <div className="admin-header__notifications-header">
                <h3>Notifications</h3>
                <button onClick={() => setShowNotifications(false)}>✕</button>
              </div>
              <div className="admin-header__notifications-list">
                <div className="admin-header__notification-item">
                  <div className="admin-header__notification-icon">🔔</div>
                  <div className="admin-header__notification-content">
                    <p className="admin-header__notification-title">New user registered</p>
                    <p className="admin-header__notification-time">2 minutes ago</p>
                  </div>
                </div>
                <div className="admin-header__notification-item">
                  <div className="admin-header__notification-icon">💰</div>
                  <div className="admin-header__notification-content">
                    <p className="admin-header__notification-title">Withdrawal request pending</p>
                    <p className="admin-header__notification-time">15 minutes ago</p>
                  </div>
                </div>
                <div className="admin-header__notification-item">
                  <div className="admin-header__notification-icon">👤</div>
                  <div className="admin-header__notification-content">
                    <p className="admin-header__notification-title">New user registered</p>
                    <p className="admin-header__notification-time">1 hour ago</p>
                  </div>
                </div>
              </div>
              <div className="admin-header__notifications-footer">
                <button>View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="admin-header__user">
          <button
            className="admin-header__user-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
          >
            <div className="admin-header__user-avatar">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} />
              ) : (
                <span>{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="admin-header__user-name">{userName}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {showUserMenu && (
            <div className="admin-header__user-dropdown">
              <div className="admin-header__user-info">
                <div className="admin-header__user-avatar admin-header__user-avatar--large">
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} />
                  ) : (
                    <span>{userName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="admin-header__user-name-full">{userName}</p>
                  <p className="admin-header__user-email">admin@digitalassets.in</p>
                </div>
              </div>
              <div className="admin-header__user-menu-divider"></div>
              <button className="admin-header__user-menu-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile Settings
              </button>
              <button className="admin-header__user-menu-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
                </svg>
                Preferences
              </button>
              <div className="admin-header__user-menu-divider"></div>
              <button className="admin-header__user-menu-item admin-header__user-menu-item--danger" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div
          className="admin-header__overlay"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default AdminHeader;

