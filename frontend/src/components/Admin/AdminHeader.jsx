import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAuthAPI } from '../../services/api';
import { createSocket, getSocketToken } from '../../utils/socket';
import { formatRelativeTime } from '../../utils/timeUtils';
import { playNotificationSound } from '../../utils/notificationSound';

const AdminHeader = ({ userName = 'Admin User', userAvatar = null, userEmail = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const socketRef = useRef(null);
  const notificationRefs = useRef(new Map()); // Store notification instances
  const originalTitleRef = useRef(document.title);

  // Check browser notification support and permission status
  useEffect(() => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      setNotificationPermission('unsupported');
      return;
    }

    // Check current permission status
    setNotificationPermission(Notification.permission);

    // Store original title
    originalTitleRef.current = document.title || 'DigitalAssets Admin';

    // Request permission if not already requested
    const permissionAsked = localStorage.getItem('notificationPermissionAsked');
    if (!permissionAsked && Notification.permission === 'default') {
      // Don't auto-request, wait for user interaction
      // Permission will be requested when first notification arrives or user clicks
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      setNotificationPermission('denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      localStorage.setItem('notificationPermissionAsked', 'true');
      
      if (permission === 'granted') {
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Show browser push notification
  const showBrowserNotification = (notification) => {
    // Check if notifications are supported and permitted
    if (!('Notification' in window)) {
      return;
    }

    // Request permission if not granted
    if (Notification.permission === 'default') {
      // Request permission on first notification
      requestNotificationPermission().then((granted) => {
        if (granted) {
          // Retry showing notification after permission granted
          showBrowserNotification(notification);
        }
      });
      return;
    }

    if (Notification.permission !== 'granted') {
      return; // Permission denied, silently fail
    }

    try {
      // Create notification options
      const notificationOptions = {
        body: notification.message || notification.title,
        icon: '/favicon.ico', // Use app icon or default
        badge: '/favicon.ico',
        tag: notification.id, // Group similar notifications
        requireInteraction: false,
        silent: false, // Allow system sound
        data: {
          link: notification.link || '/admin/dashboard',
          notificationId: notification.id,
        },
      };

      // Show notification
      const browserNotification = new Notification(notification.title, notificationOptions);

      // Handle notification click
      browserNotification.onclick = (event) => {
        event.preventDefault();
        window.focus(); // Focus the window
        
        // Mark notification as read
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );

        // Navigate to relevant page
        if (notification.link) {
          navigate(notification.link);
        }

        // Close the notification
        browserNotification.close();
      };

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Store notification reference
      notificationRefs.current.set(notification.id, browserNotification);
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  };

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('adminNotifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
  }, [notifications]);

  // Connect to Socket.io for real-time notifications
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      return;
    }

    const token = getSocketToken();
    if (!token) {
      return;
    }

    const socket = createSocket(token);
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    // Listen for new user registration
    socket.on('new-user-registered', (notification) => {
      console.log('📢 New user registration notification:', notification);
      const newNotification = {
        id: `user-${Date.now()}-${Math.random()}`,
        ...notification,
        isRead: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      
      // Show browser notification
      showBrowserNotification(newNotification);
      
      // Play sound
      playNotificationSound();
    });

    // Listen for new withdrawal request
    socket.on('new-withdrawal-request', (notification) => {
      console.log('📢 New withdrawal request notification:', notification);
      const newNotification = {
        id: `withdrawal-${Date.now()}-${Math.random()}`,
        ...notification,
        isRead: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      
      // Show browser notification
      showBrowserNotification(newNotification);
      
      // Play sound
      playNotificationSound();
    });

    // Listen for new chat message
    socket.on('new-chat-message', (notification) => {
      console.log('📢 New chat message notification:', notification);
      const newNotification = {
        id: `chat-${Date.now()}-${Math.random()}`,
        ...notification,
        isRead: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      
      // Show browser notification
      showBrowserNotification(newNotification);
      
      // Play sound
      playNotificationSound();
    });

    socket.on('connect', () => {
      console.log('✅ AdminHeader - Socket connected for notifications');
    });

    socket.on('disconnect', () => {
      console.log('❌ AdminHeader - Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ AdminHeader - Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-user-registered');
        socketRef.current.off('new-withdrawal-request');
        socketRef.current.off('new-chat-message');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Get notification icon based on type
  const getNotificationIcon = (iconType) => {
    const iconMap = {
      'user-registered': (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      'withdrawal-request': (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      'chat-message': (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    };

    // If it's already a React element (SVG), return it
    if (typeof iconType === 'object' || (typeof iconType === 'string' && iconType.startsWith('<'))) {
      return iconType;
    }

    // Return mapped icon or default bell icon
    return iconMap[iconType] || (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    );
  };

  // Calculate unread notification count
  const notificationCount = notifications.filter((n) => !n.isRead).length;

  // Update document title with badge count
  useEffect(() => {
    if (notificationCount > 0) {
      document.title = `(${notificationCount}) ${originalTitleRef.current}`;
    } else {
      document.title = originalTitleRef.current;
    }

    // Cleanup on unmount
    return () => {
      document.title = originalTitleRef.current;
    };
  }, [notificationCount]);

  // Mark notifications as read when dropdown is opened
  useEffect(() => {
    if (showNotifications && notificationCount > 0) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    }
  }, [showNotifications, notificationCount]);

  // Handle notification click - navigate to relevant page
  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );

    if (notification.link) {
      navigate(notification.link);
      setShowNotifications(false);
    }
  };

  const handleLogout = () => {
    // Clear admin token
    adminAuthAPI.logout();
    // Close user menu
    setShowUserMenu(false);
    // Redirect to admin login
    navigate('/admin-auth/login', { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return; // Don't search if query is empty
    }

    console.log('🔍 AdminHeader - Search triggered:', {
      query: searchQuery,
      currentPath: location.pathname,
      timestamp: new Date().toISOString()
    });

    // Determine which page to navigate to based on current route or search query
    const currentPath = location.pathname;
    let targetPath = '/admin/users'; // Default to users page

    // If already on a specific page, stay on that page
    if (currentPath.startsWith('/admin/users')) {
      targetPath = '/admin/users';
    } else if (currentPath.startsWith('/admin/properties')) {
      targetPath = '/admin/properties';
    } else if (currentPath.startsWith('/admin/withdrawals')) {
      targetPath = '/admin/withdrawals';
    } else {
      // If on dashboard or other pages, try to detect search intent
      const query = searchQuery.toLowerCase();
      if (query.includes('user') || query.includes('@') || /^\d{10}$/.test(query.replace(/\D/g, ''))) {
        targetPath = '/admin/users';
      } else if (query.includes('property') || query.includes('listing')) {
        targetPath = '/admin/properties';
      } else if (query.includes('withdrawal') || query.includes('transaction')) {
        targetPath = '/admin/withdrawals';
      }
      // Default to users page
    }

    // If we're already on the target page, just update the search state
    // Otherwise, navigate to the target page
    if (currentPath === targetPath) {
      // Trigger search on current page by dispatching a custom event
      // The page component will listen for this event
      window.dispatchEvent(new CustomEvent('adminSearch', {
        detail: { searchQuery: searchQuery.trim() }
      }));
      console.log('🔍 AdminHeader - Dispatched search event for current page');
    } else {
      // Navigate to the target page with search query in state
      navigate(targetPath, {
        state: { searchQuery: searchQuery.trim() }
      });
      console.log('🔍 AdminHeader - Navigating to:', targetPath);
    }

    // Clear search input after search
    setSearchQuery('');
  };

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        {/* User Menu - Moved to left */}
        <div className="admin-header__user">
          <button
            className="admin-header__user-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
          >
            <div className="admin-header__user-avatar">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span>{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="admin-header__user-info-inline">
              <span className="admin-header__user-name">{userName}</span>
              {userEmail && (
                <span className="admin-header__user-email-inline">{userEmail}</span>
              )}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {showUserMenu && (
            <div className="admin-header__user-dropdown">
              <div className="admin-header__user-info">
                <div className="admin-header__user-avatar admin-header__user-avatar--large">
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt={userName}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span>{userName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="admin-header__user-name-full">{userName}</p>
                  <p className="admin-header__user-email">{userEmail || 'admin@digitalassets.in'}</p>
                </div>
              </div>
              <div className="admin-header__user-menu-divider"></div>
              <button 
                className="admin-header__user-menu-item"
                onClick={() => navigate('/admin/profile')}
              >
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
            onClick={() => {
              setShowNotifications(!showNotifications);
              // Request permission if not granted when user clicks notification button
              if (Notification.permission === 'default' && !showNotifications) {
                requestNotificationPermission();
              }
            }}
            aria-label="Notifications"
            title={
              notificationPermission === 'denied'
                ? 'Notification permission denied. Enable in browser settings.'
                : notificationPermission === 'default'
                ? 'Click to enable browser notifications'
                : 'Notifications'
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notificationCount > 0 && (
              <span className="admin-header__notifications-badge">{notificationCount}</span>
            )}
            {notificationPermission === 'denied' && (
              <span className="admin-header__notifications-warning" title="Notifications disabled">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="admin-header__notifications-dropdown">
              <div className="admin-header__notifications-header">
                <h3>Notifications</h3>
                <button onClick={() => setShowNotifications(false)}>✕</button>
              </div>
              <div className="admin-header__notifications-list">
                {notifications.length === 0 ? (
                  <div className="admin-header__notification-item">
                    <div className="admin-header__notification-content">
                      <p className="admin-header__notification-title" style={{ textAlign: 'center', color: '#64748b' }}>
                        No notifications
                      </p>
                    </div>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`admin-header__notification-item ${!notification.isRead ? 'admin-header__notification-item--unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                      style={{ cursor: notification.link ? 'pointer' : 'default' }}
                    >
                      <div className="admin-header__notification-icon">
                        {getNotificationIcon(notification.icon || notification.type)}
                      </div>
                      <div className="admin-header__notification-content">
                        <p className="admin-header__notification-title">{notification.title}</p>
                        {notification.message && (
                          <p className="admin-header__notification-message" style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {notification.message}
                          </p>
                        )}
                        <p className="admin-header__notification-time">
                          {formatRelativeTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="admin-header__notifications-footer">
                  <button
                    onClick={() => {
                      setNotifications([]);
                      localStorage.removeItem('adminNotifications');
                    }}
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
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

