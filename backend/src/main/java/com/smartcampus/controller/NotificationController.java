package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.CreateNotificationRequest;
import com.smartcampus.dto.NotificationResponseDto;
import com.smartcampus.security.CustomUserDetails;
import com.smartcampus.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Notification Controller - handles notification CRUD operations.
 *
 * All endpoints require authentication (JWT token).
 * The "create" endpoint is ADMIN-only (for system-generated notifications).
 *
 * Endpoints:
 * GET    /api/notifications              - Get all notifications for logged-in user
 * GET    /api/notifications/unread-count - Get unread count for badge
 * POST   /api/notifications/create       - Create notification (ADMIN/SYSTEM only)
 * PATCH  /api/notifications/{id}/read    - Mark one notification as read
 * PATCH  /api/notifications/read-all    - Mark all as read
 * DELETE /api/notifications/{id}        - Delete a notification
 *
 * Member 4 - Notification Controller
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * GET /api/notifications
     * Get all notifications for the currently authenticated user.
     * Returns newest first.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponseDto>>> getMyNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        String userId = userDetails.getUser().getId();
        List<NotificationResponseDto> notifications = notificationService.getUserNotifications(userId);

        return ResponseEntity.ok(
                ApiResponse.success("Notifications retrieved", notifications)
        );
    }

    /**
     * GET /api/notifications/unread-count
     * Get the count of unread notifications.
     * Used by the notification bell badge in the navbar.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        String userId = userDetails.getUser().getId();
        long count = notificationService.getUnreadCount(userId);

        return ResponseEntity.ok(
                ApiResponse.success("Unread count retrieved", Map.of("count", count))
        );
    }

    /**
     * POST /api/notifications/create
     * Create a new notification. Restricted to ADMIN role.
     *
     * This endpoint is how other modules can trigger notifications via REST.
     * Alternatively, other Spring services can inject NotificationService directly.
     *
     * Request body: { "userId": "...", "title": "...", "message": "...", "type": "BOOKING", ... }
     */
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NotificationResponseDto>> createNotification(
            @Valid @RequestBody CreateNotificationRequest request) {

        NotificationResponseDto created = notificationService.createNotification(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success("Notification created", created)
        );
    }

    /**
     * PATCH /api/notifications/{id}/read
     * Mark a specific notification as read.
     * Only the owner of the notification can mark it as read.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponseDto>> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        String userId = userDetails.getUser().getId();
        NotificationResponseDto updated = notificationService.markAsRead(id, userId);

        return ResponseEntity.ok(
                ApiResponse.success("Notification marked as read", updated)
        );
    }

    /**
     * PATCH /api/notifications/read-all
     * Mark ALL notifications as read for the current user.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        String userId = userDetails.getUser().getId();
        notificationService.markAllAsRead(userId);

        return ResponseEntity.ok(
                ApiResponse.<Void>success("All notifications marked as read")
        );
    }

    /**
     * DELETE /api/notifications/{id}
     * Delete a specific notification.
     * Only the owner of the notification can delete it.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        String userId = userDetails.getUser().getId();
        notificationService.deleteNotification(id, userId);

        return ResponseEntity.ok(
                ApiResponse.<Void>success("Notification deleted")
        );
    }
}
