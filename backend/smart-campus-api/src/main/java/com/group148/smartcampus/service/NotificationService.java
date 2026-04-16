package com.smartcampus.service;

import com.smartcampus.dto.NotificationDTO;
import com.smartcampus.dto.PagedResponse;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.model.Notification;
import com.smartcampus.model.NotificationType;
import com.smartcampus.model.User;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Core service for Module D – Notifications.
 *
 * Other services (BookingService, TicketService) call the
 * {@link #notify(Long, String, String, NotificationType, String, Long)} helper
 * to create notifications without coupling to this service directly.
 *
 * The NotificationController exposes the READ / MARK-READ operations
 * to authenticated users via REST.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;

    // ────────────────────────────────────────────────────────────────────────
    //  CREATE  (called internally by other services)
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Create and persist a notification for a single user.
     *
     * @param userId      Recipient user ID
     * @param title       Short title (shown in panel header)
     * @param message     Full notification message
     * @param type        {@link NotificationType} enum value
     * @param link        Optional deep-link path (e.g. "/bookings/12")
     * @param referenceId Optional entity ID (bookingId, ticketId, …)
     */
    @Transactional
    public NotificationDTO notify(Long userId,
                                  String title,
                                  String message,
                                  NotificationType type,
                                  String link,
                                  Long referenceId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .referenceId(referenceId)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.debug("Notification created [type={}, userId={}]", type, userId);
        return toDTO(saved);
    }

    // ── Convenience wrappers used by Booking / Ticket services ────────────

    /** Booking approved by admin */
    public void notifyBookingApproved(Long userId, Long bookingId, String resourceName) {
        notify(userId,
               "Booking Approved",
               "Your booking for '" + resourceName + "' has been approved.",
               NotificationType.BOOKING_APPROVED,
               "/bookings/" + bookingId,
               bookingId);
    }

    /** Booking rejected by admin */
    public void notifyBookingRejected(Long userId, Long bookingId,
                                      String resourceName, String reason) {
        notify(userId,
               "Booking Rejected",
               "Your booking for '" + resourceName + "' was rejected. Reason: " + reason,
               NotificationType.BOOKING_REJECTED,
               "/bookings/" + bookingId,
               bookingId);
    }

    /** Booking cancelled */
    public void notifyBookingCancelled(Long userId, Long bookingId, String resourceName) {
        notify(userId,
               "Booking Cancelled",
               "Your booking for '" + resourceName + "' has been cancelled.",
               NotificationType.BOOKING_CANCELLED,
               "/bookings/" + bookingId,
               bookingId);
    }

    /** Ticket status changed */
    public void notifyTicketStatusChanged(Long userId, Long ticketId,
                                          String newStatus, String ticketTitle) {
        notify(userId,
               "Ticket Status Updated",
               "Your ticket '" + ticketTitle + "' is now " + newStatus + ".",
               NotificationType.TICKET_STATUS_CHANGED,
               "/tickets/" + ticketId,
               ticketId);
    }

    /** New comment on the user's ticket */
    public void notifyTicketComment(Long userId, Long ticketId, String ticketTitle) {
        notify(userId,
               "New Comment on Your Ticket",
               "A new comment was added to ticket: '" + ticketTitle + "'.",
               NotificationType.TICKET_COMMENT_ADDED,
               "/tickets/" + ticketId,
               ticketId);
    }

    /** Ticket assigned to a technician */
    public void notifyTicketAssigned(Long userId, Long ticketId,
                                     String ticketTitle, String technicianName) {
        notify(userId,
               "Ticket Assigned",
               "Ticket '" + ticketTitle + "' has been assigned to " + technicianName + ".",
               NotificationType.TICKET_ASSIGNED,
               "/tickets/" + ticketId,
               ticketId);
    }

    /** Ticket resolved */
    public void notifyTicketResolved(Long userId, Long ticketId, String ticketTitle) {
        notify(userId,
               "Ticket Resolved",
               "Your ticket '" + ticketTitle + "' has been resolved.",
               NotificationType.TICKET_RESOLVED,
               "/tickets/" + ticketId,
               ticketId);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  READ  (exposed via REST)
    // ────────────────────────────────────────────────────────────────────────

    /** Paginated notification list for the current user */
    @Transactional(readOnly = true)
    public PagedResponse<NotificationDTO> getNotifications(Long userId, int page, int size) {
        Page<Notification> results = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(
                        userId,
                        PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return PagedResponse.of(results.map(this::toDTO));
    }

    /** Unread notification list (used on initial load for the badge + panel) */
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnread(Long userId) {
        return notificationRepository
                .findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream().map(this::toDTO).toList();
    }

    /** Badge count – number of unread notifications */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  MARK READ
    // ────────────────────────────────────────────────────────────────────────

    /** Mark a single notification as read; throws if not found or not owned */
    @Transactional
    public void markRead(Long notificationId, Long userId) {
        int updated = notificationRepository.markReadByIdAndUserId(notificationId, userId);
        if (updated == 0) {
            throw new ResourceNotFoundException(
                    "Notification not found or not owned by user: " + notificationId);
        }
    }

    /** Mark all of the user's unread notifications as read */
    @Transactional
    public int markAllRead(Long userId) {
        return notificationRepository.markAllReadByUserId(userId);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  DELETE
    // ────────────────────────────────────────────────────────────────────────

    /** Delete a single notification; only the owner may delete their own */
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification", "id", notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You can only delete your own notifications.");
        }
        notificationRepository.delete(notification);
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .link(n.getLink())
                .referenceId(n.getReferenceId())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}