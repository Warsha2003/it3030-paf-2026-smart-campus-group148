import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import {
  adminGetAllUsers,
  adminGetAllNotifications,
  adminGetResourceAnalytics,
  adminGetUnreadCount,
} from '../services/adminApi';
import { getAllBookings } from '../services/bookingApi';
import ticketApi from '../services/ticketApi';
import { formatDistanceToNow } from '../utils/dateUtils';

const TYPE_ICON = {
  BOOKING: 'BK',
  TICKET: 'TK',
  COMMENT: 'CM',
  SYSTEM: 'NT',
};

const TYPE_COLOR = {
  BOOKING: '#6366f1',
  TICKET: '#f59e0b',
  COMMENT: '#10b981',
  SYSTEM: '#64748b',
};

const QUICK_ACTIONS = [
  {
    id: 'qa-users',
    to: '/admin/users',
    icon: 'UM',
    label: 'User Management',
    desc: 'View users, assign and update roles',
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    id: 'qa-resources',
    to: '/admin/resources',
    icon: 'RS',
    label: 'Facilities and Assets',
    desc: 'Manage the campus resource catalogue',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    id: 'qa-bookings',
    to: '/admin/bookings',
    icon: 'BK',
    label: 'Booking Management',
    desc: 'Review and manage booking requests',
    color: '#0ea5e9',
    bg: '#e0f2fe',
  },
  {
    id: 'qa-tickets',
    to: '/tickets',
    icon: 'TK',
    label: 'Support Tickets',
    desc: 'Review maintenance and incident tickets',
    color: '#10b981',
    bg: '#f0fdf4',
  },
  {
    id: 'qa-notifications',
    to: '/admin/notifications',
    icon: 'NT',
    label: 'Notifications',
    desc: 'Monitor all campus notifications',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [resourceAnalytics, setResourceAnalytics] = useState({
    topResources: [],
    peakBookingHours: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          usersResponse,
          notificationsResponse,
          unreadResponse,
          analyticsResponse,
          bookingsResponse,
          ticketsResponse,
        ] = await Promise.all([
          adminGetAllUsers(),
          adminGetAllNotifications(),
          adminGetUnreadCount(),
          adminGetResourceAnalytics(),
          getAllBookings(),
          ticketApi.getAllTickets(),
        ]);

        if (usersResponse.success) {
          setUsers(usersResponse.data || []);
        }
        if (notificationsResponse.success) {
          setNotifications(notificationsResponse.data || []);
        }
        if (unreadResponse.success) {
          setUnreadCount(unreadResponse.data?.count ?? 0);
        }
        if (analyticsResponse.success) {
          setResourceAnalytics(analyticsResponse.data || { topResources: [], peakBookingHours: [] });
        }
        if (bookingsResponse.success) {
          setBookings(bookingsResponse.data || []);
        }

        setTickets(Array.isArray(ticketsResponse.data) ? ticketsResponse.data : []);
      } catch (error) {
        console.error('Admin dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const recentNotifs = [...notifications]
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
    .slice(0, 6);

  const topResources = resourceAnalytics?.topResources || [];
  const peakHours = resourceAnalytics?.peakBookingHours || [];
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const formatHourRange = (hour) => {
    const start = String(hour).padStart(2, '0');
    const end = String((hour + 1) % 24).padStart(2, '0');
    return `${start}:00-${end}:00`;
  };

  return (
    <div className="adm-layout">
      <Sidebar />

      <main className="adm-content">
        <header className="adm-banner">
          <div className="adm-banner__text">
            <h1 className="adm-banner__title">Admin Dashboard</h1>
            <p className="adm-banner__sub">
              Welcome back, <strong>{firstName}</strong> - here is your campus overview.
            </p>
          </div>
          <img
            src={
              user?.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=ffffff&color=4f46e5&size=80`
            }
            alt={user?.name || 'Admin Avatar'}
            className="adm-banner__avatar"
            onError={(event) => {
              event.target.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23ffffff' stroke='%234f46e5' stroke-width='2' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Arial' font-size='32' fill='%234f46e5'%3E" +
                firstName.charAt(0).toUpperCase() +
                '%3C/text%3E%3C/svg%3E';
            }}
          />
        </header>

        <section className="adm-stats" aria-label="Overview statistics">
          <StatCard icon="UM" label="Total Users" value={users.length} color="#6366f1" loading={loading} />
          <StatCard
            icon="NT"
            label="Total Notifications"
            value={notifications.length}
            color="#f59e0b"
            loading={loading}
          />
          <StatCard
            icon="UR"
            label="Unread Notifications"
            value={unreadCount}
            color="#ef4444"
            loading={loading}
          />
          <StatCard icon="BK" label="Room Bookings" value={bookings.length} color="#0ea5e9" loading={loading} />
          <StatCard icon="TK" label="Support Tickets" value={tickets.length} color="#10b981" loading={loading} />
        </section>

        <section className="adm-section">
          <div className="adm-section__header">
            <h2 className="adm-section__title">Quick Actions</h2>
          </div>
          <div className="adm-actions-grid">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.id}
                id={action.id}
                to={action.to}
                className="adm-action-card"
                style={{ background: action.bg, borderColor: `${action.color}33` }}
              >
                <span className="adm-action-card__icon" style={{ color: action.color }}>
                  {action.icon}
                </span>
                <div>
                  <p className="adm-action-card__label" style={{ color: action.color }}>
                    {action.label}
                  </p>
                  <p className="adm-action-card__desc">{action.desc}</p>
                </div>
                <span className="adm-action-card__arrow" style={{ color: action.color }}>
                  {'->'}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="adm-section">
          <div className="adm-section__header">
            <h2 className="adm-section__title">Usage Analytics</h2>
          </div>

          <div className="adm-analytics-grid">
            <div className="adm-analytics-card">
              <div className="adm-analytics-card__header">
                <h3 className="adm-analytics-card__title">Top Resources</h3>
                <p className="adm-analytics-card__sub">By highest capacity among active resources</p>
              </div>

              {loading && (
                <div className="skeleton-list">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="skeleton-item" />
                  ))}
                </div>
              )}

              {!loading && topResources.length === 0 && (
                <div className="empty-state empty-state--compact">
                  <span className="empty-state__icon">RS</span>
                  <h3>No resources yet</h3>
                  <p>Add resources to see the most capable spaces.</p>
                </div>
              )}

              {!loading && topResources.length > 0 && (
                <div className="adm-analytics-list">
                  {topResources.map((resource, index) => (
                    <div key={resource.id || `${resource.name}-${index}`} className="adm-analytics-row">
                      <span className="adm-analytics-rank">{index + 1}</span>
                      <div className="adm-analytics-main">
                        <p className="adm-analytics-title">{resource.name || 'Unnamed resource'}</p>
                        <p className="adm-analytics-sub">{resource.location || 'No location'}</p>
                      </div>
                      <span className="adm-analytics-metric">{resource.capacity ?? 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="adm-analytics-card">
              <div className="adm-analytics-card__header">
                <h3 className="adm-analytics-card__title">Peak Booking Hours</h3>
                <p className="adm-analytics-card__sub">Based on configured availability windows</p>
              </div>

              {loading && (
                <div className="skeleton-list">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="skeleton-item" />
                  ))}
                </div>
              )}

              {!loading && peakHours.length === 0 && (
                <div className="empty-state empty-state--compact">
                  <span className="empty-state__icon">TM</span>
                  <h3>No availability data</h3>
                  <p>Add availability windows to resources to surface peak hours.</p>
                </div>
              )}

              {!loading && peakHours.length > 0 && (
                <div className="adm-analytics-list">
                  {peakHours.map((hour) => (
                    <div key={hour.hour} className="adm-analytics-row">
                      <div className="adm-analytics-main">
                        <p className="adm-analytics-title">{formatHourRange(hour.hour)}</p>
                        <p className="adm-analytics-sub">Resources available</p>
                      </div>
                      <span className="adm-analytics-metric">{hour.resourceCount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="adm-section">
          <div className="adm-section__header">
            <h2 className="adm-section__title">Recent Activity</h2>
            <Link to="/admin/notifications" className="adm-section__see-all" id="see-all-notifs">
              View all {'->'}
            </Link>
          </div>

          {loading && (
            <div className="skeleton-list">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="skeleton-item" />
              ))}
            </div>
          )}

          {!loading && recentNotifs.length === 0 && (
            <div className="empty-state">
              <span className="empty-state__icon">NT</span>
              <h3>No notifications yet</h3>
              <p>Nothing to show right now.</p>
            </div>
          )}

          {!loading && recentNotifs.length > 0 && (
            <div className="adm-activity-list">
              {recentNotifs.map((notification) => {
                const color = TYPE_COLOR[notification.type] || TYPE_COLOR.SYSTEM;

                return (
                  <div
                    key={notification.id}
                    id={`activity-${notification.id}`}
                    className={`adm-activity-row ${!notification.isRead ? 'adm-activity-row--unread' : ''}`}
                  >
                    <span className="adm-activity-row__icon" style={{ background: `${color}1a`, color }}>
                      {TYPE_ICON[notification.type] || 'NT'}
                    </span>

                    <div className="adm-activity-row__body">
                      <p className="adm-activity-row__title">{notification.title}</p>
                      <p className="adm-activity-row__msg">{notification.message}</p>
                    </div>

                    <div className="adm-activity-row__meta">
                      <span className="adm-activity-row__badge" style={{ background: `${color}1a`, color }}>
                        {notification.type}
                      </span>
                      <span className="adm-activity-row__time">
                        {formatDistanceToNow(notification.createdAt)}
                      </span>
                    </div>

                    {!notification.isRead && <span className="adm-unread-dot" title="Unread" />}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="adm-footer">Smart Campus Admin Panel | Role: ADMIN | Auth: OAuth 2.0</footer>
      </main>
    </div>
  );
}
