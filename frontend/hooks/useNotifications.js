// src/hooks/useNotifications.js
// Module D – Notification state hook

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    deleteNotification,
    getUnreadCount,
    getUnreadNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '../api/notificationApi';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_MS = 30_000; // poll every 30 seconds

/**
 * Manages unread notification state and exposes mutation helpers.
 *
 * Features:
 *  - Polls GET /api/notifications/unread/count every 30 s for the badge.
 *  - Lazy-loads the panel items only when the user opens the bell.
 *  - Provides markRead, markAllRead, and remove helpers.
 */
export const useNotifications = () => {
    const { isAuthenticated } = useAuth();

    const [unreadCount,   setUnreadCount]   = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [panelLoading,  setPanelLoading]  = useState(false);
    const [panelOpen,     setPanelOpen]     = useState(false);

    const intervalRef = useRef(null);

    // ── Badge polling ─────────────────────────────────────────────────────
    const fetchCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await getUnreadCount();
            setUnreadCount(res.data.data.count ?? 0);
        } catch (_) { /* silently ignore */ }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            return;
        }
        fetchCount();
        intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);
        return () => clearInterval(intervalRef.current);
    }, [isAuthenticated, fetchCount]);

    // ── Panel open/close ──────────────────────────────────────────────────
    const openPanel = useCallback(async () => {
        setPanelOpen(true);
        setPanelLoading(true);
        try {
            const res = await getUnreadNotifications();
            setNotifications(res.data.data ?? []);
        } catch (_) {
            setNotifications([]);
        } finally {
            setPanelLoading(false);
        }
    }, []);

    const closePanel = useCallback(() => setPanelOpen(false), []);

    // ── Mark one read ─────────────────────────────────────────────────────
    const markRead = useCallback(async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (_) { /* ignore */ }
    }, []);

    // ── Mark all read ─────────────────────────────────────────────────────
    const markAllRead = useCallback(async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (_) { /* ignore */ }
    }, []);

    // ── Delete one ────────────────────────────────────────────────────────
    const remove = useCallback(async (id) => {
        try {
            await deleteNotification(id);
            setNotifications((prev) => {
                const removed = prev.find((n) => n.id === id);
                if (removed && !removed.read) {
                    setUnreadCount((c) => Math.max(0, c - 1));
                }
                return prev.filter((n) => n.id !== id);
            });
        } catch (_) { /* ignore */ }
    }, []);

    return {
        unreadCount,
        notifications,
        panelLoading,
        panelOpen,
        openPanel,
        closePanel,
        markRead,
        markAllRead,
        remove,
        refreshCount: fetchCount,
    };
};