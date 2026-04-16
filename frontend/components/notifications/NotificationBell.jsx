// src/components/notifications/NotificationBell.jsx
// Module D – Notification bell icon with unread badge

import React, { useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';
import './Notifications.css';

/**
 * Renders the bell icon in the Navbar.
 *
 * Behaviour:
 *  - Shows a red badge with the unread count (capped at 99+).
 *  - Clicking opens/closes <NotificationPanel />.
 *  - Clicking outside the panel closes it.
 */
const NotificationBell = () => {
    const {
        unreadCount,
        notifications,
        panelLoading,
        panelOpen,
        openPanel,
        closePanel,
        markRead,
        markAllRead,
        remove,
    } = useNotifications();

    const containerRef = useRef(null);

    // Close panel on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                closePanel();
            }
        };
        if (panelOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [panelOpen, closePanel]);

    const handleBellClick = () => {
        if (panelOpen) closePanel();
        else openPanel();
    };

    const badgeLabel = unreadCount > 99 ? '99+' : unreadCount;

    return (
        <div className="notification-bell-container" ref={containerRef}>
            <button
                className="notification-bell-btn"
                onClick={handleBellClick}
                aria-label={`Notifications – ${unreadCount} unread`}
                aria-expanded={panelOpen}
                aria-haspopup="true"
            >
                {/* Bell SVG */}
                <svg
                    className="bell-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span className="notification-badge" aria-hidden="true">
                        {badgeLabel}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {panelOpen && (
                <NotificationPanel
                    notifications={notifications}
                    loading={panelLoading}
                    onMarkRead={markRead}
                    onMarkAllRead={markAllRead}
                    onRemove={remove}
                    onClose={closePanel}
                />
            )}
        </div>
    );
};

export default NotificationBell;