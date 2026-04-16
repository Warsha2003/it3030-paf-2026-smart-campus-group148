// src/components/notifications/NotificationPanel.jsx
// Module D – Notification dropdown panel

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './Notifications.css';

/**
 * TYPE_META maps each NotificationType to an emoji icon and a colour class,
 * giving the panel visual cues without extra dependencies.
 */
const TYPE_META = {
    BOOKING_APPROVED:      { icon: '✅', colorClass: 'notif-green'  },
    BOOKING_REJECTED:      { icon: '❌', colorClass: 'notif-red'    },
    BOOKING_CANCELLED:     { icon: '🚫', colorClass: 'notif-orange' },
    TICKET_STATUS_CHANGED: { icon: '🔄', colorClass: 'notif-blue'   },
    TICKET_COMMENT_ADDED:  { icon: '💬', colorClass: 'notif-purple' },
    TICKET_ASSIGNED:       { icon: '👷', colorClass: 'notif-blue'   },
    TICKET_RESOLVED:       { icon: '🎉', colorClass: 'notif-green'  },
    SYSTEM:                { icon: '📢', colorClass: 'notif-gray'   },
};

const NotificationItem = ({ notification, onMarkRead, onRemove }) => {
    const navigate = useNavigate();
    const meta = TYPE_META[notification.type] || { icon: '🔔', colorClass: 'notif-gray' };

    const handleClick = () => {
        if (!notification.read) onMarkRead(notification.id);
        if (notification.link) navigate(notification.link);
    };

    const timeAgo = notification.createdAt
        ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
        : '';

    return (
        <li
            className={`notification-item ${notification.read ? 'is-read' : 'is-unread'}`}
            role="listitem"
        >
            <button className="notification-item-body" onClick={handleClick}>
                <span className={`notification-icon ${meta.colorClass}`} aria-hidden="true">
                    {meta.icon}
                </span>
                <div className="notification-text">
                    <p className="notification-title">{notification.title}</p>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">{timeAgo}</span>
                </div>
                {!notification.read && (
                    <span className="unread-dot" aria-label="Unread" />
                )}
            </button>
            <button
                className="notification-delete-btn"
                onClick={(e) => { e.stopPropagation(); onRemove(notification.id); }}
                aria-label="Delete notification"
                title="Delete"
            >
                ✕
            </button>
        </li>
    );
};

/**
 * The dropdown panel rendered by <NotificationBell />.
 *
 * Props:
 *   notifications  – array of NotificationDTO objects
 *   loading        – boolean; shows skeleton when true
 *   onMarkRead     – (id) => void
 *   onMarkAllRead  – () => void
 *   onRemove       – (id) => void
 *   onClose        – () => void
 */
const NotificationPanel = ({
    notifications,
    loading,
    onMarkRead,
    onMarkAllRead,
    onRemove,
    onClose,
}) => {
    const navigate = useNavigate();

    const handleViewAll = () => {
        navigate('/notifications');
        onClose();
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="notification-panel" role="dialog" aria-label="Notifications">
            {/* Header */}
            <div className="notification-panel-header">
                <h3 className="notification-panel-title">
                    Notifications
                    {unreadCount > 0 && (
                        <span className="panel-unread-count">{unreadCount} new</span>
                    )}
                </h3>
                {unreadCount > 0 && (
                    <button
                        className="btn-mark-all"
                        onClick={onMarkAllRead}
                        title="Mark all as read"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="notification-panel-body">
                {loading ? (
                    /* Skeleton rows */
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="notification-skeleton">
                            <div className="skeleton-icon" />
                            <div className="skeleton-lines">
                                <div className="skeleton-line long" />
                                <div className="skeleton-line short" />
                            </div>
                        </div>
                    ))
                ) : notifications.length === 0 ? (
                    <div className="notification-empty">
                        <span aria-hidden="true">🔕</span>
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    <ul className="notification-list" role="list">
                        {notifications.map((n) => (
                            <NotificationItem
                                key={n.id}
                                notification={n}
                                onMarkRead={onMarkRead}
                                onRemove={onRemove}
                            />
                        ))}
                    </ul>
                )}
            </div>

            {/* Footer */}
            <div className="notification-panel-footer">
                <button className="btn-view-all" onClick={handleViewAll}>
                    View all notifications →
                </button>
            </div>
        </div>
    );
};

export default NotificationPanel;