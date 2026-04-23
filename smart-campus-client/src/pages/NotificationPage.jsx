/**
 * NotificationPage.jsx
 * Full-page view of all user notifications.
 * 
 * Features:
 * - Filter tabs: All / Unread / By type
 * - Mark as read on click
 * - Delete individual notifications
 * - Mark all as read button
 * - Notification type badges with colors
 * - Empty state
 * - Loading skeleton
 * 
 * Member 4 - Notification UI
 */

import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from '../utils/dateUtils';

const TYPE_ICONS = { BOOKING: '🗓️', TICKET: '🎫', COMMENT: '💬', SYSTEM: '🔔' };
const TYPE_COLORS = {
  BOOKING: { bg: '#eef2ff', text: '#4f46e5' },
  TICKET:  { bg: '#fffbeb', text: '#d97706' },
  COMMENT: { bg: '#f0fdf4', text: '#16a34a' },
  SYSTEM:  { bg: '#f8fafc', text: '#475569' },
};

const FILTERS = ['ALL', 'UNREAD', 'BOOKING', 'TICKET', 'COMMENT', 'SYSTEM'];

export default function NotificationPage() {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'UNREAD') return !n.isRead;
    return n.type === activeFilter;
  });

  const unreadTotal = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notif-page">
      {/* Page header */}
      <div className="notif-page__header">
        <div>
          <h1 className="notif-page__title">Notifications</h1>
          <p className="notif-page__subtitle">
            {unreadTotal > 0 ? `${unreadTotal} unread notification${unreadTotal > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadTotal > 0 && (
          <button id="mark-all-read-btn" className="btn btn--primary" onClick={markAllAsRead}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="notif-page__filters" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={activeFilter === f}
            className={`filter-tab ${activeFilter === f ? 'filter-tab--active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f === 'UNREAD' && unreadTotal > 0
              ? `Unread (${unreadTotal})`
              : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="notif-page__list">
        {loading && (
          <div className="skeleton-list">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-item" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-state__icon">🔕</span>
            <h3>No notifications found</h3>
            <p>
              {activeFilter === 'UNREAD'
                ? 'You have no unread notifications.'
                : `No ${activeFilter.toLowerCase()} notifications yet.`}
            </p>
          </div>
        )}

        {!loading &&
          filtered.map((n) => {
            const colors = TYPE_COLORS[n.type] || TYPE_COLORS.SYSTEM;
            return (
              <div
                key={n.id}
                id={`notif-${n.id}`}
                className={`notif-card ${!n.isRead ? 'notif-card--unread' : ''}`}
              >
                {/* Type icon */}
                <div
                  className="notif-card__icon"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {TYPE_ICONS[n.type] || '🔔'}
                </div>

                {/* Content */}
                <div className="notif-card__body">
                  <div className="notif-card__top">
                    <h3 className="notif-card__title">{n.title}</h3>
                    <span
                      className="notif-card__badge"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {n.type}
                    </span>
                  </div>
                  <p className="notif-card__msg">{n.message}</p>
                  <div className="notif-card__meta">
                    <span className="notif-card__time">
                      🕐 {formatDistanceToNow(n.createdAt)}
                    </span>
                    {!n.isRead && (
                      <span className="notif-card__unread-dot" title="Unread" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="notif-card__actions">
                  {!n.isRead && (
                    <button
                      className="notif-card__action-btn notif-card__action-btn--read"
                      onClick={() => markAsRead(n.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="notif-card__action-btn notif-card__action-btn--delete"
                    onClick={() => deleteNotification(n.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
