/**
 * useNotifications.js
 * Custom hook for all notification state and operations.
 * 
 * Manages: list of notifications, unread count, loading state, and actions.
 * 
 * Member 4 - Notifications Hook
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDelete,
} from '../services/notificationApi';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /** Fetch all notifications and unread count */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      if (notifRes.success) setNotifications(notifRes.data);
      if (countRes.success) setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Auto-fetch on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /** Mark a single notification as read */
  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to mark notification as read.');
    }
  }, []);

  /** Mark all notifications as read */
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all as read.');
    }
  }, []);

  /** Delete a notification */
  const handleDelete = useCallback(async (id) => {
    try {
      const notif = notifications.find((n) => n.id === id);
      await apiDelete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notif && !notif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted.');
    } catch {
      toast.error('Failed to delete notification.');
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
  };
}
