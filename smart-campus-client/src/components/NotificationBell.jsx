/**
 * NotificationBell.jsx
 * The bell icon shown in the navbar with an unread-count badge.
 * Toggles the NotificationPanel dropdown on click.
 * 
 * Member 4 - Notification UI
 */

import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="notif-bell-wrapper">
      <button
        id="notification-bell-btn"
        className="notif-bell"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        title="Notifications"
      >
        {/* Bell SVG icon */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="notif-bell__badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
