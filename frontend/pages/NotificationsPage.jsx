// src/pages/NotificationsPage.jsx
// Module D – Full notification history page

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    deleteNotification,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '../api/notificationApi';
import './NotificationsPage.css';

const TYPE_META = {
    BOOKING_APPROVED:      { icon: '✅', label: 'Booking Approved'  },
    BOOKING_REJECTED:      { icon: '❌', label: 'Booking Rejected'  },
    BOOKING_CANCELLED:     { icon: '🚫', label: 'Cancelled'         },
    TICKET_STATUS_CHANGED: { icon: '🔄', label: 'Ticket Updated'    },
    TICKET_COMMENT_ADDED:  { icon: '💬', label: 'New Comment'       },
    TICKET_ASSIGNED:       { icon: '👷', label: 'Ticket Assigned'   },
    TICKET_RESOLVED:       { icon: '🎉', label: 'Resolved'          },
    SYSTEM:                { icon: '📢', label: 'System'            },
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const NotificationsPage = () => {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState('');
    const [page,          setPage]          = useState(0);
    const [totalPages,    setTotalPages]    = useState(1);
    const [filter,        setFilter]        = useState('ALL'); // 'ALL' | 'UNREAD'

    const SIZE = 15;

    const fetchNotifications = useCallback(async (p = 0) => {
        setLoading(true);
        setError('');
        try {
            const res = await getNotifications(p, SIZE);
            const data = res.data.data;
            setNotifications(data.content);
            setTotalPages(data.totalPages);
            setPage(data.page);
        } catch {
            setError('Failed to load notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotifications(0); }, [fetchNotifications]);

    // ── Actions ─────────────────────────────────────────────────────────────

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        } catch { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch { /* ignore */ }
    };

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch { /* ignore */ }
    };

    const handleItemClick = (notification) => {
        if (!notification.read) handleMarkRead(notification.id);
        if (notification.link) navigate(notification.link);
    };

    // ── Derived ──────────────────────────────────────────────────────────────

    const displayed = filter === 'UNREAD'
        ? notifications.filter((n) => !n.read)
        : notifications;

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="notif-page">
            {/* Page header */}
            <div className="notif-page-header">
                <div>
                    <h1 className="notif-page-title">Notifications</h1>
                    {unreadCount > 0 && (
                        <p className="notif-page-sub">{unreadCount} unread</p>
                    )}
                </div>
                <div className="notif-page-actions">
                    {/* Filter toggle */}
                    <div className="notif-filter-group" role="group" aria-label="Filter">
                        <button
                            className={`notif-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setFilter('ALL')}
                        >
                            All
                        </button>
                        <button
                            className={`notif-filter-btn ${filter === 'UNREAD' ? 'active' : ''}`}
                            onClick={() => setFilter('UNREAD')}
                        >
                            Unread {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                    </div>
                    {/* Mark all read */}
                    {unreadCount > 0 && (
                        <button className="btn-primary-sm" onClick={handleMarkAllRead}>
                            ✓ Mark all read
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="notif-error" role="alert">
                    {error}
                    <button onClick={() => fetchNotifications(page)}>Retry</button>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="notif-skeleton-list">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="notif-skeleton-row">
                            <div className="sk sk-icon" />
                            <div className="sk-content">
                                <div className="sk sk-line long" />
                                <div className="sk sk-line short" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : displayed.length === 0 ? (
                <div className="notif-empty-state">
                    <span>🔕</span>
                    <p>{filter === 'UNREAD' ? 'No unread notifications.' : 'No notifications yet.'}</p>
                </div>
            ) : (
                <>
                    <ul className="notif-full-list" role="list">
                        {displayed.map((n) => {
                            const meta = TYPE_META[n.type] || { icon: '🔔', label: n.type };
                            return (
                                <li
                                    key={n.id}
                                    className={`notif-row ${n.read ? 'read' : 'unread'}`}
                                    role="listitem"
                                >
                                    <button
                                        className="notif-row-body"
                                        onClick={() => handleItemClick(n)}
                                    >
                                        <span className="notif-row-icon">{meta.icon}</span>
                                        <div className="notif-row-content">
                                            <div className="notif-row-top">
                                                <strong className="notif-row-title">{n.title}</strong>
                                                <span className="notif-row-type">{meta.label}</span>
                                            </div>
                                            <p className="notif-row-msg">{n.message}</p>
                                            <span className="notif-row-time">{formatDate(n.createdAt)}</span>
                                        </div>
                                        {!n.read && <span className="notif-unread-dot" aria-label="Unread" />}
                                    </button>

                                    <div className="notif-row-actions">
                                        {!n.read && (
                                            <button
                                                className="notif-action-btn"
                                                title="Mark as read"
                                                onClick={() => handleMarkRead(n.id)}
                                            >
                                                ✓
                                            </button>
                                        )}
                                        <button
                                            className="notif-action-btn danger"
                                            title="Delete"
                                            onClick={() => handleDelete(n.id)}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="notif-pagination">
                            <button
                                className="pagination-btn"
                                disabled={page === 0}
                                onClick={() => fetchNotifications(page - 1)}
                            >
                                ← Previous
                            </button>
                            <span className="pagination-info">
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                className="pagination-btn"
                                disabled={page + 1 >= totalPages}
                                onClick={() => fetchNotifications(page + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NotificationsPage;