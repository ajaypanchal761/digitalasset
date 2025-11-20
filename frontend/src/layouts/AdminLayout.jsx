import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminHeader from '../components/Admin/AdminHeader';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview', icon: '📊' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/properties', label: 'Properties', icon: '🏢' },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: '💰' },
  { to: '/admin/chat', label: 'Chat', icon: '💬' },
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
            <span className="admin-brand-icon">🏛️</span>
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
              <span className="admin-link-icon">{icon}</span>
              <span className="admin-link-text">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="admin-content">
        <AdminHeader userName={user?.name || "Admin User"} />
        <div className="admin-content__main">
          <Outlet />
        </div>
      </section>
    </div>
  );
};

export default AdminLayout;

