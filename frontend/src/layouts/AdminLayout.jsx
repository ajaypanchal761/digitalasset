import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminHeader from '../components/Admin/AdminHeader';

const adminLinks = [
  { 
    to: '/admin/dashboard', 
    label: 'Overview', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    )
  },
  { 
    to: '/admin/users', 
    label: 'Users', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    )
  },
  { 
    to: '/admin/properties', 
    label: 'Properties', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    )
  },
  { 
    to: '/admin/withdrawals', 
    label: 'Withdrawals', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    )
  },
  { 
    to: '/admin/payouts', 
    label: 'Payouts', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    )
  },
  { 
    to: '/admin/chat', 
    label: 'Chat', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    )
  },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const { user, isAuthenticated, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin and redirect if not
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🏛️ AdminLayout - useEffect triggered:', {
        hasToken: !!token,
        hasUser: !!user,
        userRole: user?.role,
        loading,
        isAuthenticated,
      });
    }
    
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ AdminLayout: No adminToken found, redirecting to login');
      }
      navigate('/admin-auth/login', { replace: true });
      return;
    }

    // If we have a token but user is not loaded yet, wait a bit and trigger refresh
    if (token && !user && !loading) {
      setWaitingForUser(true);
      
      // Trigger user refresh
      refreshUser();
      
      const timeout = setTimeout(() => {
        setWaitingForUser(false);
      }, 10000);
      
      return () => clearTimeout(timeout);
    }

    // Only check after loading is complete and we have user data
    if (!loading && user) {
      if (user.role !== 'admin') {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ AdminLayout: User is not admin, redirecting to login');
        }
        navigate('/admin-auth/login', { replace: true });
      } else {
        setWaitingForUser(false);
      }
    }
  }, [user, isAuthenticated, loading, navigate, refreshUser]);

  // Show loading while checking authentication or if we have token but user not loaded yet
  const token = localStorage.getItem('adminToken');
  
  if (loading || waitingForUser || (token && !user)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render admin panel if not authenticated or not admin (will redirect)
  if (!token || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-shell">
      {/* Mobile Menu Toggle */}
      <button 
        className="admin-mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-brand">
          <NavLink to="/admin/dashboard" onClick={() => setSidebarOpen(false)}>
            <span className="admin-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </span>
            <span className="admin-brand-text">DigitalAssets Admin</span>
          </NavLink>
        </div>
        <nav className="admin-nav">
          {adminLinks.map(({ to, label, icon }) => (
            <NavLink 
              key={to} 
              to={to} 
              className={({ isActive }) => `admin-link ${isActive ? 'admin-link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-link-icon">
                {typeof icon === 'string' ? <span>{icon}</span> : icon}
              </span>
              <span className="admin-link-text">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="admin-content">
        <AdminHeader 
          userName={user?.name || "Admin User"} 
          userEmail={user?.email || null}
          userAvatar={user?.avatarUrl || null}
        />
        <div className="admin-content__main">
          <Outlet />
        </div>
      </section>
    </div>
  );
};

export default AdminLayout;

