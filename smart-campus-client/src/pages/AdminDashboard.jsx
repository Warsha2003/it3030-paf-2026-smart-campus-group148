/**
 * AdminDashboard.jsx
 * Main admin overview page — accessible by ROLE_ADMIN only.
 *
 * Layout:  Sidebar (left) + content (right) — full-width, no top Navbar
 *
 * Sections:
 *   1. Gradient welcome banner with admin avatar
 *   2. Stat cards  – Total Users · Total Notifications · Unread count
 *   3. Quick actions – links to User Mgmt & Notification Mgmt pages
 *   4. Recent Activity – latest 6 notifications in a card list
 *
 * Data:
 *   adminGetAllUsers()           → GET /api/admin/users
 *   adminGetAllNotifications()   → GET /api/notifications
 *   adminGetUnreadCount()        → GET /api/notifications/unread-count
 *
 * Member 4 – Admin Dashboard Page
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import {
  adminGetAllUsers,
  adminGetAllNotifications,
  adminGetUnreadCount,
} from '../services/adminApi';
import { formatDistanceToNow } from '../utils/dateUtils';

/* ── helpers ──────────────────────────────────────────── */
const TYPE_ICON  = { BOOKING: '🗓️', TICKET: '🎫', COMMENT: '💬', SYSTEM: '🔔' };
const TYPE_COLOR = { BOOKING: '#6366f1', TICKET: '#f59e0b', COMMENT: '#10b981', SYSTEM: '#64748b' };

const QUICK_ACTIONS = [
  {
    id: 'qa-users',
    to: '/admin/users',
    icon: '👥',
    label: 'User Management',
    desc: 'View users, assign & update roles',
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    id: 'qa-notifications',
    to: '/admin/notifications',
    icon: '🔔',
    label: 'Notifications',
    desc: 'Monitor all campus notifications',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    id: 'qa-bookings',
    to: '#',
    icon: '🗓️',
    label: 'Room Bookings',
    desc: 'Coming soon',
    color: '#0ea5e9',
    bg: '#e0f2fe',
    disabled: true,
  },
  {
    id: 'qa-tickets',
    to: '#',
    icon: '🎫',
    label: 'Support Tickets',
    desc: 'Coming soon',
    color: '#10b981',
    bg: '#f0fdf4',
    disabled: true,
  },
];

/* ── component ────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();

  const [users,        setUsers]        = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, nRes, cRes] = await Promise.all([
          adminGetAllUsers(),
          adminGetAllNotifications(),
          adminGetUnreadCount(),
        ]);
        if (uRes.success) setUsers(uRes.data);
        if (nRes.success) setNotifications(nRes.data);
        if (cRes.success) setUnreadCount(cRes.data?.count ?? 0);
      } catch (err) {
        console.error('Admin dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const recentNotifs = [...notifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div className="adm-layout">
      {/* ── Sidebar ───────────────────────── */}
      <Sidebar />

      {/* ── Main content ──────────────────── */}
      <main className="adm-content">

        {/* Welcome banner */}
        <header className="adm-banner">
          <div className="adm-banner__text">
            <h1 className="adm-banner__title">Admin Dashboard</h1>
            <p className="adm-banner__sub">
              Welcome back, <strong>{user?.name?.split(' ')[0]}</strong> — here's your campus overview.
            </p>
          </div>
          <img
            src={
              user?.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=ffffff&color=4f46e5&size=80`
            }
            alt={user?.name || 'Admin Avatar'}
            className="adm-banner__avatar"
            onError={(e) => {
              // Fallback if ui-avatars fails
              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23ffffff' stroke='%234f46e5' stroke-width='2' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Arial' font-size='32' fill='%234f46e5'%3E${(user?.name || 'A').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
            }}
          />
        </header>

        {/* ── Stat cards ──────────────────── */}
        <section className="adm-stats" aria-label="Overview statistics">
          <StatCard icon="👥" label="Total Users"           value={users.length}         color="#6366f1" loading={loading} />
          <StatCard icon="🔔" label="Total Notifications"   value={notifications.length}  color="#f59e0b" loading={loading} />
          <StatCard icon="📬" label="Unread Notifications"  value={unreadCount}           color="#ef4444" loading={loading} />
          <StatCard icon="🗓️" label="Room Bookings"         value="—"                    color="#0ea5e9" />
        </section>

        {/* ── Quick Actions ───────────────── */}
        <section className="adm-section">
          <div className="adm-section__header">
            <h2 className="adm-section__title">⚡ Quick Actions</h2>
          </div>
          <div className="adm-actions-grid">
            {QUICK_ACTIONS.map((action) =>
              action.disabled ? (
                <div
                  key={action.id}
                  className="adm-action-card adm-action-card--disabled"
                  style={{ background: action.bg, borderColor: action.color + '33' }}
                >
                  <span className="adm-action-card__icon" style={{ color: action.color }}>{action.icon}</span>
                  <div>
                    <p className="adm-action-card__label" style={{ color: action.color }}>{action.label}</p>
                    <p className="adm-action-card__desc">{action.desc}</p>
                  </div>
                  <span className="adm-action-card__pill">Soon</span>
                </div>
              ) : (
                <Link
                  key={action.id}
                  id={action.id}
                  to={action.to}
                  className="adm-action-card"
                  style={{ background: action.bg, borderColor: action.color + '33' }}
                >
                  <span className="adm-action-card__icon" style={{ color: action.color }}>{action.icon}</span>
                  <div>
                    <p className="adm-action-card__label" style={{ color: action.color }}>{action.label}</p>
                    <p className="adm-action-card__desc">{action.desc}</p>
                  </div>
                  <span className="adm-action-card__arrow" style={{ color: action.color }}>→</span>
                </Link>
              )
            )}
          </div>
        </section>

        {/* ── Recent Activity ─────────────── */}
        <section className="adm-section">
          <div className="adm-section__header">
            <h2 className="adm-section__title">🕐 Recent Activity</h2>
            <Link to="/admin/notifications" className="adm-section__see-all" id="see-all-notifs">
              View all →
            </Link>
          </div>

          {loading && (
            <div className="skeleton-list">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-item" />)}
            </div>
          )}

          {!loading && recentNotifs.length === 0 && (
            <div className="empty-state">
              <span className="empty-state__icon">🔕</span>
              <h3>No notifications yet</h3>
              <p>Nothing to show — campus is quiet!</p>
            </div>
          )}

          {!loading && recentNotifs.length > 0 && (
            <div className="adm-activity-list">
              {recentNotifs.map((n) => {
                const color = TYPE_COLOR[n.type] || TYPE_COLOR.SYSTEM;
                return (
                  <div
                    key={n.id}
                    id={`activity-${n.id}`}
                    className={`adm-activity-row ${!n.isRead ? 'adm-activity-row--unread' : ''}`}
                  >
                    {/* Icon */}
                    <span
                      className="adm-activity-row__icon"
                      style={{ background: color + '1a', color }}
                    >
                      {TYPE_ICON[n.type] || '🔔'}
                    </span>

                    {/* Body */}
                    <div className="adm-activity-row__body">
                      <p className="adm-activity-row__title">{n.title}</p>
                      <p className="adm-activity-row__msg">{n.message}</p>
                    </div>

                    {/* Meta */}
                    <div className="adm-activity-row__meta">
                      <span
                        className="adm-activity-row__badge"
                        style={{ background: color + '1a', color }}
                      >
                        {n.type}
                      </span>
                      <span className="adm-activity-row__time">
                        {formatDistanceToNow(n.createdAt)}
                      </span>
                    </div>

                    {!n.isRead && <span className="adm-unread-dot" title="Unread" />}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="adm-footer">
          Smart Campus Admin Panel &nbsp;·&nbsp; Role: ADMIN &nbsp;·&nbsp; Auth: OAuth 2.0
        </footer>
      </main>
    </div>
  );
}
