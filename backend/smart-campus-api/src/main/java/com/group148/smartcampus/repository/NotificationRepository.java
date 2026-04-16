package com.smartcampus.repository;

import com.smartcampus.model.Notification;
import com.smartcampus.model.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** All notifications for a user, newest first */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Unread notifications for a user */
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);

    /** Count unread notifications (used for the notification badge) */
    long countByUserIdAndReadFalse(Long userId);

    /** Notifications by type for a user */
    Page<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(
            Long userId, NotificationType type, Pageable pageable);

    /** Mark all unread notifications of a user as read in one query */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    int markAllReadByUserId(@Param("userId") Long userId);

    /** Mark a single notification as read */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id AND n.user.id = :userId")
    int markReadByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}