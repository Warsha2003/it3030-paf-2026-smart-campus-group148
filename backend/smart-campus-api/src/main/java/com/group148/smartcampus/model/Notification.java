package com.smartcampus.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents an in-app notification for a user.
 *
 * Notifications are created by the system (via NotificationService)
 * when booking decisions are made, ticket status changes occur,
 * or new comments are posted on tickets the user owns.
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_user", columnList = "user_id"),
        @Index(name = "idx_notification_read", columnList = "is_read")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user who should receive this notification */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Short title shown in the notification panel */
    @Column(nullable = false)
    private String title;

    /** Full message body */
    @Column(nullable = false, length = 1000)
    private String message;

    /** Notification category for filtering / icons */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    /** Deep-link to the relevant resource (e.g., /bookings/12, /tickets/5) */
    private String link;

    /** ID of the entity that triggered this notification (bookingId, ticketId, etc.) */
    private Long referenceId;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}