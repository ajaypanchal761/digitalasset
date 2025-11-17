import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import AdminHeader from '../components/Admin/AdminHeader';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview', icon: '📊' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/properties', label: 'Properties', icon: '🏢' },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: '💰' },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <AdminHeader userName="Admin User" />
        <div className="admin-content__main">
          <Outlet />
        </div>
      </section>
    </div>
  );
};

export default AdminLayout;

