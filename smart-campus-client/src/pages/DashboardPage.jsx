/**
 * DashboardPage.jsx
 * The main home page after login.
 * Shows different content for USER vs ADMIN roles.
 * 
 * Member 4 - Dashboard UI
 */

import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';

const TYPE_ICONS = { BOOKING: '🗓️', TICKET: '🎫', COMMENT: '💬', SYSTEM: '🔔' };
const TYPE_COLORS = { BOOKING: '#6366f1', TICKET: '#f59e0b', COMMENT: '#10b981', SYSTEM: '#64748b' };

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { notifications, unreadCount } = useNotifications();

  const recentNotifs = notifications.slice(0, 5);

  return (
    <div className="dashboard">
      {/* Welcome banner */}
      <div className="dashboard__banner">
        <div className="dashboard__banner-text">
          <h1 className="dashboard__welcome">
            Welcome back, <span>{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="dashboard__subtitle">
            {isAdmin
              ? 'You have full administrator access to the Smart Campus system.'
              : 'Access your bookings, tickets, and campus resources below.'}
          </p>
        </div>
        <img
          src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff&size=80`}
          alt={user?.name || 'User Avatar'}
          className="dashboard__avatar"
          onError={(e) => {
            // Fallback if ui-avatars fails
            e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%236366f1' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Arial' font-size='32' fill='%23fff'%3E${(user?.name || 'U').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
          }}
        />
      </div>

      {/* Stats row */}
      <div className="dashboard__stats">
        <div className="stat-card stat-card--blue">
          <span className="stat-card__icon">🔔</span>
          <div>
            <p className="stat-card__value">{unreadCount}</p>
            <p className="stat-card__label">Unread Notifications</p>
          </div>
        </div>
        <div className="stat-card stat-card--green">
          <span className="stat-card__icon">👤</span>
          <div>
            <p className="stat-card__value">{user?.role}</p>
            <p className="stat-card__label">Your Role</p>
          </div>
        </div>
        <div className="stat-card stat-card--purple">
          <span className="stat-card__icon">🔒</span>
          <div>
            <p className="stat-card__value">OAuth 2.0</p>
            <p className="stat-card__label">Auth Provider</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="dashboard__section">
        <h2 className="dashboard__section-title">Quick Actions</h2>
        <div className="dashboard__actions">
          <Link to="/notifications" className="action-card action-card--violet">
            <span>🔔</span>
            <span>My Notifications</span>
          </Link>
          {isAdmin && (
            <Link to="/admin/users" className="action-card action-card--red">
              <span>👥</span>
              <span>Manage Users</span>
            </Link>
          )}
          <div className="action-card action-card--teal" style={{ cursor: 'default' }}>
            <span>🗓️</span>
            <span>Room Bookings</span>
          </div>
          <div className="action-card action-card--amber" style={{ cursor: 'default' }}>
            <span>🎫</span>
            <span>Support Tickets</span>
          </div>
        </div>
      </div>

      {/* Recent notifications preview */}
      <div className="dashboard__section">
        <div className="dashboard__section-header">
          <h2 className="dashboard__section-title">Recent Notifications</h2>
          <Link to="/notifications" className="dashboard__see-all">See all →</Link>
        </div>

        {recentNotifs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">🔕</span>
            <p>No notifications yet. You're all caught up!</p>
          </div>
        ) : (
          <div className="dashboard__notif-list">
            {recentNotifs.map((n) => (
              <div key={n.id} className={`dashboard__notif-item ${!n.isRead ? 'dashboard__notif-item--unread' : ''}`}>
                <span
                  className="dashboard__notif-icon"
                  style={{ backgroundColor: TYPE_COLORS[n.type] + '20', color: TYPE_COLORS[n.type] }}
                >
                  {TYPE_ICONS[n.type]}
                </span>
                <div className="dashboard__notif-body">
                  <p className="dashboard__notif-title">{n.title}</p>
                  <p className="dashboard__notif-msg">{n.message}</p>
                </div>
                <span className="dashboard__notif-date">{formatDate(n.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
