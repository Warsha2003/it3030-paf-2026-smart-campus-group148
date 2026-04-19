/**
 * AdminNotificationsPage.jsx
 * Admin view of ALL campus notifications.
 *
 * Layout: Sidebar (left) + content (right)
 *
 * Features:
 *   - Table of all notifications with type, title, message, time, read-status
 *   - Filter tabs: All / Unread / By type (BOOKING, TICKET, COMMENT, SYSTEM)
 *   - Sort: Newest / Oldest
 *   - Mark individual notification as read
 *   - Delete individual notification
 *   - Loading skeletons & empty state
 *   - Result count summary
 *
 * APIs:
 *   GET    /api/notifications         → adminGetAllNotifications()
 *   PATCH  /api/notifications/{id}/read → adminMarkNotifRead()
 *   DELETE /api/notifications/{id}    → adminDeleteNotif()
 *
 * Member 4 – Admin Notifications Page
 */

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import {
  adminGetAllNotifications,
  adminMarkNotifRead,
  adminDeleteNotif,
} from '../services/adminApi';
import { formatDistanceToNow } from '../utils/dateUtils';
import toast from 'react-hot-toast';

/* ── constants ────────────────────────────────────────── */
const TYPE_ICON  = { BOOKING: '🗓️', TICKET: '🎫', COMMENT: '💬', SYSTEM: '🔔' };
const TYPE_COLOR = {
  BOOKING: { accent: '#6366f1', bg: '#eef2ff' },
  TICKET:  { accent: '#f59e0b', bg: '#fffbeb' },
  COMMENT: { accent: '#10b981', bg: '#f0fdf4' },
  SYSTEM:  { accent: '#64748b', bg: '#f8fafc' },
};

const FILTERS     = ['ALL', 'UNREAD', 'BOOKING', 'TICKET', 'COMMENT', 'SYSTEM'];
const SORT_OPTIONS = [
  { value: 'newest', label: '↓ Newest first' },
  { value: 'oldest', label: '↑ Oldest first' },
];

/* ── component ────────────────────────────────────────── */
export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState('ALL');
  const [sortOrder,     setSortOrder]     = useState('newest');

  /* Fetch on mount */
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await adminGetAllNotifications();
      if (res.success) setNotifications(res.data);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  /* Mark as read */
  const handleMarkRead = async (id) => {
    try {
      await adminMarkNotifRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      toast.success('Marked as read.');
    } catch {
      toast.error('Failed to mark as read.');
    }
  };

  /* Delete */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await adminDeleteNotif(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification deleted.');
    } catch {
      toast.error('Failed to delete notification.');
    }
  };

  /* Derived list */
  const filtered = useMemo(() => {
    let list = notifications;
    if (activeFilter === 'UNREAD')     list = list.filter((n) => !n.isRead);
    else if (activeFilter !== 'ALL')   list = list.filter((n) => n.type === activeFilter);
    return sortOrder === 'newest'
      ? [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [notifications, activeFilter, sortOrder]);

  const unreadTotal = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="adm-layout">
      <Sidebar />

      <main className="adm-content">

        {/* ── Page header ────────────────── */}
        <header className="adm-page-header">
          <div>
            <h1 className="adm-page-header__title">
              🔔 Notifications
              {unreadTotal > 0 && (
                <span className="adm-unread-badge" id="notif-unread-total">
                  {unreadTotal} unread
                </span>
              )}
            </h1>
            <p className="adm-page-header__sub">
              Showing all campus notifications &mdash; {notifications.length} total
            </p>
          </div>
          <div className="adm-page-header__actions">
            <select
              id="notif-sort"
              className="adm-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              aria-label="Sort notifications"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button className="btn btn--ghost" onClick={fetchNotifications} title="Refresh">
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* ── Filter tabs ─────────────────── */}
        <div className="adm-filter-tabs" role="tablist">
          {FILTERS.map((f) => {
            const label = f === 'UNREAD'
              ? `Unread${unreadTotal > 0 ? ` (${unreadTotal})` : ''}`
              : f.charAt(0) + f.slice(1).toLowerCase();
            return (
              <button
                key={f}
                id={`tab-${f.toLowerCase()}`}
                role="tab"
                aria-selected={activeFilter === f}
                className={`adm-filter-tab ${activeFilter === f ? 'adm-filter-tab--active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {TYPE_ICON[f] && <span>{TYPE_ICON[f]}</span>}
                {label}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        {!loading && (
          <p className="adm-results-count">
            Showing <strong>{filtered.length}</strong> notification{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* ── Notification table ──────────── */}
        {loading && (
          <div className="skeleton-list">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton-item" />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-state__icon">🔕</span>
            <h3>No notifications found</h3>
            <p>
              {activeFilter === 'UNREAD'
                ? 'All notifications have been read.'
                : `No ${activeFilter === 'ALL' ? '' : activeFilter.toLowerCase() + ' '}notifications yet.`}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="adm-table-wrapper">
            <table className="adm-table" aria-label="Notifications table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => {
                  const colors = TYPE_COLOR[n.type] || TYPE_COLOR.SYSTEM;
                  return (
                    <tr
                      key={n.id}
                      id={`notif-row-${n.id}`}
                      className={`adm-table__row ${!n.isRead ? 'adm-table__row--unread' : ''}`}
                    >
                      {/* Type badge */}
                      <td>
                        <span
                          className="adm-type-badge"
                          style={{ background: colors.bg, color: colors.accent }}
                        >
                          {TYPE_ICON[n.type] || '🔔'}&nbsp;{n.type}
                        </span>
                      </td>

                      {/* Title */}
                      <td>
                        <p className="adm-table__cell-title">{n.title}</p>
                      </td>

                      {/* Message */}
                      <td>
                        <p className="adm-table__cell-msg">{n.message}</p>
                      </td>

                      {/* Time */}
                      <td className="adm-table__cell-time">
                        {formatDistanceToNow(n.createdAt)}
                      </td>

                      {/* Read status */}
                      <td>
                        <span className={`status-badge ${n.isRead ? 'status-badge--active' : 'status-badge--inactive'}`}>
                          {n.isRead ? '✓ Read' : '● Unread'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="adm-table__actions">
                          {!n.isRead && (
                            <button
                              id={`mark-read-${n.id}`}
                              className="btn btn--sm btn--success-ghost"
                              onClick={() => handleMarkRead(n.id)}
                              title="Mark as read"
                            >
                              ✓ Read
                            </button>
                          )}
                          <button
                            id={`delete-${n.id}`}
                            className="btn btn--sm btn--danger-ghost"
                            onClick={() => handleDelete(n.id)}
                            title="Delete"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="adm-footer">
          Smart Campus Admin Panel &nbsp;·&nbsp; Notification Centre
        </footer>
      </main>
    </div>
  );
}
