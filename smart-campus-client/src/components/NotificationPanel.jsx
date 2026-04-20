/**
 * NotificationPanel.jsx
 * Dropdown panel showing recent notifications in the navbar.
 * 
 * Features:
 * - Shows last ~8 notifications
 * - Mark as read on click
 * - Delete individual notifications
 * - Mark all as read button
 * - Link to full notifications page
 * - Empty state illustration
 * 
 * Member 4 - Notification UI
 */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from '../utils/dateUtils';

// Notification type → emoji icon map
const TYPE_ICONS = {
  BOOKING: '🗓️',
  TICKET:  '🎫',
  COMMENT: '💬',
  SYSTEM:  '🔔',
};

export default function NotificationPanel({ onClose }) {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const recent = notifications.slice(0, 8);

  return (
    <div className="notif-panel" ref={panelRef}>
      {/* Header */}
      <div className="notif-panel__header">
        <h3 className="notif-panel__title">Notifications</h3>
        {notifications.some((n) => !n.isRead) && (
          <button className="notif-panel__mark-all" onClick={markAllAsRead}>
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="notif-panel__body">
        {loading && <p className="notif-panel__empty">Loading…</p>}

        {!loading && recent.length === 0 && (
          <div className="notif-panel__empty">
            <span className="notif-panel__empty-icon">🔕</span>
            <p>No notifications yet</p>
          </div>
        )}

        {!loading &&
          recent.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${!n.isRead ? 'notif-item--unread' : ''}`}
            >
              <span className="notif-item__icon">{TYPE_ICONS[n.type] || '🔔'}</span>

              <div
                className="notif-item__content"
                onClick={() => !n.isRead && markAsRead(n.id)}
                style={{ cursor: n.isRead ? 'default' : 'pointer' }}
              >
                <p className="notif-item__title">{n.title}</p>
                <p className="notif-item__msg">{n.message}</p>
                <span className="notif-item__time">
                  {formatDistanceToNow(n.createdAt)}
                </span>
              </div>

              <button
                className="notif-item__delete"
                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="notif-panel__footer">
        <Link to="/notifications" className="notif-panel__view-all" onClick={onClose}>
          View all notifications →
        </Link>
      </div>
    </div>
  );
}
