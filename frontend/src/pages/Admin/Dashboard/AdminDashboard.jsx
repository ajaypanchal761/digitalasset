import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, propertyAPI } from '../../../services/api.js';
import { formatCurrency, formatRelativeTime } from '../../../utils/formatters.js';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvestments: 0,
    activeProperties: 0,
    pendingWithdrawals: 0,
    totalPayouts: 0,
    totalRevenue: 0,
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [dashboardStats, usersRes, propertiesRes, withdrawalsRes, payoutsRes] = await Promise.all([
        adminAPI.getDashboardStats().catch(() => ({ success: false, data: {} })),
        adminAPI.getUsers({ limit: 1000 }).catch(() => ({ success: false, data: [] })),
        propertyAPI.getAll().catch(() => ({ success: false, data: [] })),
        adminAPI.getWithdrawals({ limit: 1000 }).catch(() => ({ success: false, data: [] })),
        adminAPI.getPayouts({ limit: 1000 }).catch(() => ({ success: false, data: [] })),
      ]);

      // Extract data
      const dashboardData = dashboardStats.success ? dashboardStats.data : {};
      const users = usersRes.success 
        ? (Array.isArray(usersRes.data) ? usersRes.data : (Array.isArray(usersRes) ? usersRes : []))
        : [];
      const properties = propertiesRes.success
        ? (Array.isArray(propertiesRes.data) ? propertiesRes.data : (Array.isArray(propertiesRes) ? propertiesRes : []))
        : [];
      const withdrawals = withdrawalsRes.success
        ? (Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : (Array.isArray(withdrawalsRes) ? withdrawalsRes : []))
        : [];
      const payouts = payoutsRes.success
        ? (Array.isArray(payoutsRes.data) ? payoutsRes.data : (Array.isArray(payoutsRes) ? payoutsRes : []))
        : [];

      // Calculate statistics
      const totalUsers = Array.isArray(users) ? users.length : (dashboardData.totalUsers || 0);
      const totalInvestments = dashboardData.totalInvestments || 0;
      const activeProperties = Array.isArray(properties)
        ? properties.filter(p => p.status === 'active').length
        : (dashboardData.totalProperties || 0);
      const pendingWithdrawals = Array.isArray(withdrawals)
        ? withdrawals.filter(w => w.status === 'pending').length
        : (dashboardData.pendingWithdrawals || 0);
      const totalPayouts = Array.isArray(payouts)
        ? payouts.filter(p => p.status === 'processed' || p.status === 'completed').length
        : 0;
      const totalRevenue = dashboardData.totalInvestmentAmount || 0;

      setStats({
        totalUsers,
        totalInvestments,
        activeProperties,
        pendingWithdrawals,
        totalPayouts,
        totalRevenue,
      });

      // Create activity feed
      const activityFeed = createActivityFeed(users, withdrawals, properties, payouts);
      setActivities(activityFeed);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const createActivityFeed = (users, withdrawals, properties, payouts) => {
    const activities = [];

    // Recent user registrations (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    if (Array.isArray(users)) {
      users
        .filter(user => new Date(user.createdAt || user.registrationDate) > oneDayAgo)
        .slice(0, 5)
        .forEach(user => {
          activities.push({
            id: `user-${user._id || user.id}`,
            type: 'user_registration',
            title: 'New User Registered',
            description: `${user.name || user.email} registered`,
            timestamp: user.createdAt || user.registrationDate,
            link: `/admin/users/${user._id || user.id}`,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            ),
          });
        });
    }

    // Pending withdrawal requests
    if (Array.isArray(withdrawals)) {
      withdrawals
        .filter(w => w.status === 'pending')
        .slice(0, 5)
        .forEach(withdrawal => {
          activities.push({
            id: `withdrawal-${withdrawal._id || withdrawal.id}`,
            type: 'withdrawal_request',
            title: 'New Withdrawal Request',
            description: `${formatCurrency(withdrawal.amount)} withdrawal requested`,
            timestamp: withdrawal.createdAt || withdrawal.requestDate,
            link: `/admin/withdrawals`,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            ),
          });
        });
    }

    // Recent investments (from properties or holdings)
    if (Array.isArray(properties)) {
      properties
        .filter(p => p.totalInvested > 0)
        .slice(0, 3)
        .forEach(property => {
          activities.push({
            id: `property-${property._id || property.id}`,
            type: 'investment',
            title: 'New Investment',
            description: `Investment in ${property.title}`,
            timestamp: property.updatedAt || property.createdAt,
            link: `/admin/properties`,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            ),
          });
        });
    }

    // Recent payouts
    if (Array.isArray(payouts)) {
      payouts
        .filter(p => p.status === 'processed' || p.status === 'completed')
        .slice(0, 3)
        .forEach(payout => {
          activities.push({
            id: `payout-${payout._id || payout.id}`,
            type: 'payout',
            title: 'Payout Processed',
            description: `${formatCurrency(payout.amount)} payout completed`,
            timestamp: payout.processedAt || payout.createdAt,
            link: `/admin/payouts`,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ),
          });
        });
    }

    // Sort by timestamp (most recent first) and limit to 10
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'add-property':
        navigate('/admin/properties');
        // Trigger add property form (you may need to add state management for this)
        break;
      case 'pending-withdrawals':
        navigate('/admin/withdrawals');
        break;
      case 'pending-payouts':
        navigate('/admin/payouts');
        break;
      case 'view-users':
        navigate('/admin/users');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__loading">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__error">
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Error: {error}</p>
          <button
            onClick={fetchDashboardData}
            className="admin-dashboard__retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Page Header */}
      <div className="admin-dashboard__header">
        <div>
          <h1 className="admin-dashboard__title">Dashboard Overview</h1>
          <p className="admin-dashboard__subtitle">Welcome back! Here's what's happening with your platform.</p>
        </div>
      </div>

      {/* Metrics Cards Section */}
      <div className="admin-dashboard__metrics">
        <div className="admin-dashboard__metric-card">
          <div className="admin-dashboard__metric-icon" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="admin-dashboard__metric-content">
            <h3 className="admin-dashboard__metric-label">Total Users</h3>
            <p className="admin-dashboard__metric-value">{stats.totalUsers.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="admin-dashboard__metric-card">
          <div className="admin-dashboard__metric-icon" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div className="admin-dashboard__metric-content">
            <h3 className="admin-dashboard__metric-label">Total Investments</h3>
            <p className="admin-dashboard__metric-value">{stats.totalInvestments.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="admin-dashboard__metric-card">
          <div className="admin-dashboard__metric-icon" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="admin-dashboard__metric-content">
            <h3 className="admin-dashboard__metric-label">Active Properties</h3>
            <p className="admin-dashboard__metric-value">{stats.activeProperties}</p>
          </div>
        </div>

        <div className="admin-dashboard__metric-card">
          <div className="admin-dashboard__metric-icon" style={{ backgroundColor: '#fed7aa', color: '#9a3412' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="admin-dashboard__metric-content">
            <h3 className="admin-dashboard__metric-label">Pending Withdrawals</h3>
            <p className="admin-dashboard__metric-value">{stats.pendingWithdrawals}</p>
          </div>
        </div>

        <div className="admin-dashboard__metric-card">
          <div className="admin-dashboard__metric-icon" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="admin-dashboard__metric-content">
            <h3 className="admin-dashboard__metric-label">Total Payouts</h3>
            <p className="admin-dashboard__metric-value">{stats.totalPayouts}</p>
          </div>
        </div>

        <div className="admin-dashboard__metric-card">
          <div className="admin-dashboard__metric-icon" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="admin-dashboard__metric-content">
            <h3 className="admin-dashboard__metric-label">Total Revenue</h3>
            <p className="admin-dashboard__metric-value">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Charts Section - Keep for future implementation */}
      <div className="admin-dashboard__charts" style={{ display: 'none' }}>
        <div className="admin-dashboard__charts-row">
          <div className="admin-dashboard__chart-card">
            {/* Chart will go here */}
          </div>
          <div className="admin-dashboard__chart-card">
            {/* Chart will go here */}
          </div>
        </div>
        <div className="admin-dashboard__charts-row">
          <div className="admin-dashboard__chart-card">
            {/* Chart will go here */}
          </div>
          <div className="admin-dashboard__chart-card">
            {/* Chart will go here */}
          </div>
        </div>
      </div>

      {/* Bottom Section: Activity Feed & Quick Actions */}
      <div className="admin-dashboard__bottom">
        {/* Recent Activity Feed */}
        <div className="admin-dashboard__activity">
          <h2 className="admin-dashboard__section-title">Recent Activity</h2>
          {activities.length === 0 ? (
            <p className="admin-dashboard__empty-state">No recent activity</p>
          ) : (
            <div className="admin-dashboard__activity-list">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="admin-dashboard__activity-item"
                  onClick={() => activity.link && navigate(activity.link)}
                  style={{ cursor: activity.link ? 'pointer' : 'default' }}
                >
                  <div className="admin-dashboard__activity-icon">
                    {typeof activity.icon === 'string' ? (
                      <span>{activity.icon}</span>
                    ) : (
                      activity.icon
                    )}
                  </div>
                  <div className="admin-dashboard__activity-content">
                    <h4 className="admin-dashboard__activity-title">{activity.title}</h4>
                    <p className="admin-dashboard__activity-description">{activity.description}</p>
                    <span className="admin-dashboard__activity-time">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="admin-dashboard__quick-actions">
          <h2 className="admin-dashboard__section-title">Quick Actions</h2>
          <div className="admin-dashboard__quick-actions-list">
            <button
              className="admin-dashboard__quick-action-btn"
              onClick={() => handleQuickAction('add-property')}
            >
              <span className="admin-dashboard__quick-action-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </span>
              <span className="admin-dashboard__quick-action-text">Add New Property</span>
            </button>
            <button
              className="admin-dashboard__quick-action-btn"
              onClick={() => handleQuickAction('pending-withdrawals')}
            >
              <span className="admin-dashboard__quick-action-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </span>
              <span className="admin-dashboard__quick-action-text">View Pending Withdrawals</span>
            </button>
            <button
              className="admin-dashboard__quick-action-btn"
              onClick={() => handleQuickAction('pending-payouts')}
            >
              <span className="admin-dashboard__quick-action-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              <span className="admin-dashboard__quick-action-text">View Pending Payouts</span>
            </button>
            <button
              className="admin-dashboard__quick-action-btn"
              onClick={() => handleQuickAction('view-users')}
            >
              <span className="admin-dashboard__quick-action-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span className="admin-dashboard__quick-action-text">View All Users</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

