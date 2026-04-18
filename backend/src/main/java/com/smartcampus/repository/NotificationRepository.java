package com.smartcampus.repository;

import com.smartcampus.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Notification MongoDB operations.
 * Spring Data MongoDB auto-generates the implementation at runtime.
 *
 * Member 4 - Notification System
 */
@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    /**
     * Get all notifications for a specific user, sorted by creation date descending (newest first).
     * Used by GET /api/notifications endpoint.
     */
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Count unread notifications for a user.
     * Used to show the badge count on the notification bell icon.
     */
    long countByUserIdAndIsReadFalse(String userId);

    /**
     * Get all unread notifications for a user.
     * Used by mark-all-as-read operation.
     */
    List<Notification> findByUserIdAndIsReadFalse(String userId);
}
