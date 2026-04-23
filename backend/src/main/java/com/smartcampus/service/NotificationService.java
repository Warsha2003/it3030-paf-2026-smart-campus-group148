package com.smartcampus.service;

import com.smartcampus.dto.CreateNotificationRequest;
import com.smartcampus.dto.NotificationResponseDto;
import com.smartcampus.enums.NotificationType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.model.Notification;
import com.smartcampus.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Notification Service - the central hub for all notification operations.
 *
 * =====================================================================
 * INTEGRATION POINT FOR OTHER TEAM MEMBERS:
 * =====================================================================
 * This service is designed to be REUSABLE by other modules.
 *
 * How to use from Booking module (Member 1/2):
 *   @Autowired NotificationService notificationService;
 *   notificationService.createNotification(userId, "Booking Approved",
 *       "Your booking for Room A101 has been approved.", NotificationType.BOOKING, bookingId);
 *
 * How to use from Ticket module (Member 3):
 *   notificationService.createNotification(userId, "Ticket Updated",
 *       "Your ticket status changed to: IN_PROGRESS", NotificationType.TICKET, ticketId);
 *   notificationService.createNotification(userId, "New Comment",
 *       "A new comment was added to your ticket.", NotificationType.COMMENT, ticketId);
 * =====================================================================
 *
 * Member 4 - Notification System
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // =================== REUSABLE METHODS FOR OTHER MODULES ===================

    /**
     * Create a notification for a user.
     * PRIMARY integration method - other modules call this.
     *
     * @param userId          ID of the user to notify
     * @param title           Short notification title
     * @param message         Detailed notification message
     * @param type            BOOKING, TICKET, COMMENT, or SYSTEM
     * @param relatedEntityId ID of the related booking/ticket (optional, can be null)
     */
    public NotificationResponseDto createNotification(String userId, String title, String message,
                                                       NotificationType type, String relatedEntityId) {
        Notification notification = new Notification(
                userId,
                title,
                message,
                type,
                relatedEntityId,
                false // New notifications are always unread
        );

        Notification saved = notificationRepository.save(notification);
        return mapToDto(saved);
    }

    /**
     * Overloaded method for creating notifications from DTOs (used by the REST endpoint).
     */
    public NotificationResponseDto createNotification(CreateNotificationRequest request) {
        return createNotification(
                request.getUserId(),
                request.getTitle(),
                request.getMessage(),
                request.getType(),
                request.getRelatedEntityId()
        );
    }

    // =================== USER-FACING OPERATIONS ===================

    /**
     * Get all notifications for a specific user (newest first).
     * Used by GET /api/notifications
     */
    public List<NotificationResponseDto> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get count of unread notifications for a user.
     * Used for the badge number on the notification bell icon.
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark a specific notification as read.
     * Validates the notification belongs to the requesting user.
     */
    public NotificationResponseDto markAsRead(String notificationId, String userId) {
        Notification notification = getNotificationForUser(notificationId, userId);
        notification.setRead(true);
        return mapToDto(notificationRepository.save(notification));
    }

    /**
     * Mark ALL of a user's notifications as read at once.
     * Useful for "Mark all as read" button.
     */
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread); // Batch save for efficiency
    }

    /**
     * Delete a specific notification.
     * Validates the notification belongs to the requesting user.
     */
    public void deleteNotification(String notificationId, String userId) {
        Notification notification = getNotificationForUser(notificationId, userId);
        notificationRepository.delete(notification);
    }

    // =================== PRIVATE HELPERS ===================

    /**
     * Fetch a notification by ID and verify it belongs to the userId.
     * Throws ResourceNotFoundException (404) if not found.
     * Throws UnauthorizedException (403) if it belongs to another user.
     */
    private Notification getNotificationForUser(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        // Security check: users can only modify their own notifications
        if (!notification.getUserId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to modify this notification.");
        }

        return notification;
    }

    private NotificationResponseDto mapToDto(Notification notification) {
        return new NotificationResponseDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getRelatedEntityId(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
