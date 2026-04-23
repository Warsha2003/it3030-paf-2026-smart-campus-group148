import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

const ROLE_COLORS = {
  ADMIN: '#ef4444',
  ROLE_ADMIN: '#ef4444',
  TECHNICIAN: '#f59e0b',
  ROLE_TECHNICIAN: '#f59e0b',
  USER: '#10b981',
  ROLE_USER: '#10b981',
};

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/tickets', label: 'Tickets' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/resources', label: 'Resources' },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) {
    return null;
  }

  const isActive = (path) => location.pathname === path;
  const firstName = user.name?.split(' ')[0] || 'User';

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar__brand">
        <span className="navbar__brand-icon">SC</span>
        <span className="navbar__brand-name">Smart Campus</span>
      </Link>

      <div className="navbar__links">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`navbar__link ${isActive(link.to) ? 'navbar__link--active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
        {isAdmin && (
          <Link to="/admin/dashboard" className="navbar__link navbar__link--admin">
            Admin Panel
          </Link>
        )}
      </div>

      <div className="navbar__right">
        <NotificationBell />

        <div className="navbar__user">
          <img
            src={
              user.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366f1&color=fff&size=40`
            }
            alt={user.name || 'User Avatar'}
            className="navbar__avatar"
            onError={(event) => {
              event.target.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect fill='%236366f1' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Arial' font-size='16' fill='%23fff'%3E" +
                firstName.charAt(0).toUpperCase() +
                '%3C/text%3E%3C/svg%3E';
            }}
          />
          <div className="navbar__user-info">
            <span className="navbar__user-name">{firstName}</span>
            <span
              className="navbar__role-badge"
              style={{ backgroundColor: ROLE_COLORS[user.role] || '#64748b' }}
            >
              {user.role}
            </span>
          </div>
        </div>

        <button id="logout-btn" className="navbar__logout" onClick={logout} title="Logout">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="20"
            height="20"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
