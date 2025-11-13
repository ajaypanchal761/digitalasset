import { NavLink, Outlet } from 'react-router-dom';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/properties', label: 'Properties' },
  { to: '/admin/kyc', label: 'KYC Review' },
  { to: '/admin/withdrawals', label: 'Withdrawals' },
];

const AdminLayout = () => {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <NavLink to="/admin/dashboard">DigitalAssets Admin</NavLink>
        </div>
        <nav className="admin-nav">
          {adminLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className="admin-link">
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;

