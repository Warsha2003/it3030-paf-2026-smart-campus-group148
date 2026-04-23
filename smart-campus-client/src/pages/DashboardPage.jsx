import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { formatDate } from '../utils/dateUtils';
import { getMyBookings } from '../services/bookingApi';
import ticketApi from '../services/ticketApi';

const TYPE_ICONS = {
  BOOKING: 'BK',
  TICKET: 'TK',
  COMMENT: 'CM',
  SYSTEM: 'NT',
};

const TYPE_COLORS = {
  BOOKING: '#6366f1',
  TICKET: '#f59e0b',
  COMMENT: '#10b981',
  SYSTEM: '#64748b',
};

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [bookingCount, setBookingCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);

  const recentNotifs = notifications.slice(0, 5);
  const firstName = user?.name?.split(' ')[0] || 'User';

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      try {
        const bookingResponse = await getMyBookings();
        if (active && bookingResponse?.success) {
          setBookingCount(bookingResponse.data?.length ?? 0);
        }
      } catch (error) {
        console.error('Dashboard booking load error:', error);
      }

      try {
        const ticketResponse = isAdmin
          ? await ticketApi.getAllTickets()
          : await ticketApi.getMyTickets(user?.id);

        if (active) {
          setTicketCount(Array.isArray(ticketResponse?.data) ? ticketResponse.data.length : 0);
        }
      } catch (error) {
        console.error('Dashboard ticket load error:', error);
      }
    };

    if (user?.id || isAdmin) {
      loadSummary();
    }

    return () => {
      active = false;
    };
  }, [isAdmin, user?.id]);

  return (
    <div className="dashboard">
      <div className="dashboard__banner">
        <div className="dashboard__banner-text">
          <h1 className="dashboard__welcome">
            Welcome back, <span>{firstName}</span>
          </h1>
          <p className="dashboard__subtitle">
            {isAdmin
              ? 'You have full administrator access to the Smart Campus system.'
              : 'Access your bookings, tickets, and campus resources below.'}
          </p>
        </div>
        <img
          src={
            user?.profilePicture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff&size=80`
          }
          alt={user?.name || 'User Avatar'}
          className="dashboard__avatar"
          onError={(event) => {
            event.target.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%236366f1' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Arial' font-size='32' fill='%23fff'%3E" +
              firstName.charAt(0).toUpperCase() +
              '%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>

      <div className="dashboard__stats">
        <div className="stat-card stat-card--blue">
          <span className="stat-card__icon">NT</span>
          <div>
            <p className="stat-card__value">{unreadCount}</p>
            <p className="stat-card__label">Unread Notifications</p>
          </div>
        </div>
        <div className="stat-card stat-card--green">
          <span className="stat-card__icon">RL</span>
          <div>
            <p className="stat-card__value">{user?.role}</p>
            <p className="stat-card__label">Your Role</p>
          </div>
        </div>
        <div className="stat-card stat-card--purple">
          <span className="stat-card__icon">AU</span>
          <div>
            <p className="stat-card__value">OAuth 2.0</p>
            <p className="stat-card__label">Auth Provider</p>
          </div>
        </div>
        <div className="stat-card stat-card--blue">
          <span className="stat-card__icon">BK</span>
          <div>
            <p className="stat-card__value">{bookingCount}</p>
            <p className="stat-card__label">My Bookings</p>
          </div>
        </div>
        <div className="stat-card stat-card--amber">
          <span className="stat-card__icon">TK</span>
          <div>
            <p className="stat-card__value">{ticketCount}</p>
            <p className="stat-card__label">{isAdmin ? 'All Tickets' : 'My Tickets'}</p>
          </div>
        </div>
      </div>

      <div className="dashboard__section">
        <h2 className="dashboard__section-title">Quick Actions</h2>
        <div className="dashboard__actions">
          <Link to="/notifications" className="action-card action-card--violet">
            <span>NT</span>
            <span>My Notifications</span>
          </Link>
          {isAdmin && (
            <Link to="/admin/users" className="action-card action-card--red">
              <span>UM</span>
              <span>Manage Users</span>
            </Link>
          )}
          <Link to="/bookings" className="action-card action-card--teal">
            <span>BK</span>
            <span>Manage Bookings</span>
          </Link>
          <Link to="/tickets" className="action-card action-card--amber">
            <span>TK</span>
            <span>Support Tickets</span>
          </Link>
        </div>
      </div>

      <div className="dashboard__section">
        <div className="dashboard__section-header">
          <h2 className="dashboard__section-title">Recent Notifications</h2>
          <Link to="/notifications" className="dashboard__see-all">
            See all {'->'}
          </Link>
        </div>

        {recentNotifs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">NT</span>
            <p>No notifications yet. You are all caught up.</p>
          </div>
        ) : (
          <div className="dashboard__notif-list">
            {recentNotifs.map((notification) => {
              const color = TYPE_COLORS[notification.type] || TYPE_COLORS.SYSTEM;
              const icon = TYPE_ICONS[notification.type] || TYPE_ICONS.SYSTEM;

              return (
                <div
                  key={notification.id}
                  className={`dashboard__notif-item ${!notification.isRead ? 'dashboard__notif-item--unread' : ''}`}
                >
                  <span
                    className="dashboard__notif-icon"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {icon}
                  </span>
                  <div className="dashboard__notif-body">
                    <p className="dashboard__notif-title">{notification.title}</p>
                    <p className="dashboard__notif-msg">{notification.message}</p>
                  </div>
                  <span className="dashboard__notif-date">{formatDate(notification.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
