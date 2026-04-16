package com.smartcampus.model;

/**
 * Categories of system-generated notifications.
 * Used for icon rendering and filtering on the front-end.
 */
public enum NotificationType {
    /** Booking approved by admin */
    BOOKING_APPROVED,

    /** Booking rejected by admin */
    BOOKING_REJECTED,

    /** A booking the user made has been cancelled */
    BOOKING_CANCELLED,

    /** Ticket status changed (OPEN → IN_PROGRESS, etc.) */
    TICKET_STATUS_CHANGED,

    /** A new comment was posted on a ticket the user owns */
    TICKET_COMMENT_ADDED,

    /** Technician assigned to a ticket */
    TICKET_ASSIGNED,

    /** Ticket resolved */
    TICKET_RESOLVED,

    /** General system announcement */
    SYSTEM
}