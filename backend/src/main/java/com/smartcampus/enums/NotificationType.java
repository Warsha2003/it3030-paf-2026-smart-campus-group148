package com.smartcampus.enums;

/**
 * Represents the type/category of a notification.
 * This helps the frontend display appropriate icons and filter notifications.
 *
 * - BOOKING: Notification related to room/resource booking approval or rejection
 * - TICKET: Notification about changes in ticket status (open, in-progress, resolved)
 * - COMMENT: Notification when someone adds a comment to a ticket
 * - SYSTEM: General system-level notifications (e.g., maintenance alerts)
 *
 * Member 4 - Notification System
 */
public enum NotificationType {
    BOOKING,
    TICKET,
    COMMENT,
    SYSTEM
}
