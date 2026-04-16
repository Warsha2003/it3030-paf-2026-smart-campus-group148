package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.NotificationDTO;
import com.smartcampus.dto.PagedResponse;
import com.smartcampus.security.UserPrincipal;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Module D – Notification REST endpoints.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path                                   │ Description            │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │ GET    │ /api/notifications                     │ Paginated list (all)   │
 * │ GET    │ /api/notifications/unread              │ All unread items       │
 * │ GET    │ /api/notifications/unread/count        │ Unread badge count     │
 * │ PATCH  │ /api/notifications/{id}/read           │ Mark one as read       │
 * │ PATCH  │ /api/notifications/read-all            │ Mark all as read       │
 * │ DELETE │ /api/notifications/{id}                │ Delete one             │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * All endpoints require authentication.
 * Users can only access/mutate their own notifications.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // ── GET /api/notifications?page=0&size=20 ────────────────────────────────
    /**
     * Returns a paginated list of all notifications for the authenticated user,
     * sorted newest-first. Used to render the full notification history page.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<NotificationDTO>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        PagedResponse<NotificationDTO> notifications =
                notificationService.getNotifications(principal.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    // ── GET /api/notifications/unread ────────────────────────────────────────
    /**
     * Returns all unread notifications for the panel dropdown.
     * Called when the user opens the notification bell.
     */
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationDTO>>> getUnread(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<NotificationDTO> unread = notificationService.getUnread(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(unread));
    }

    // ── GET /api/notifications/unread/count ──────────────────────────────────
    /**
     * Returns the unread notification count for the bell badge.
     * Polled every 30 s by the React client or triggered via WebSocket.
     */
    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {

        long count = notificationService.getUnreadCount(principal.getId());
        return ResponseEntity.ok(
                ApiResponse.success(Map.of("count", count)));
    }

    // ── PATCH /api/notifications/{id}/read ───────────────────────────────────
    /**
     * Marks a single notification as read.
     * Returns 404 if the notification does not exist or belongs to another user.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        notificationService.markRead(id, principal.getId());
        return ResponseEntity.ok(
                ApiResponse.success("Notification marked as read.", null));
    }

    // ── PATCH /api/notifications/read-all ────────────────────────────────────
    /**
     * Marks ALL of the authenticated user's unread notifications as read.
     * Returns the number of records updated.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllRead(
            @AuthenticationPrincipal UserPrincipal principal) {

        int updated = notificationService.markAllRead(principal.getId());
        return ResponseEntity.ok(
                ApiResponse.success(Map.of("updated", updated)));
    }

    // ── DELETE /api/notifications/{id} ───────────────────────────────────────
    /**
     * Deletes a single notification owned by the authenticated user.
     * Returns 401 if the user does not own the notification.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        notificationService.deleteNotification(id, principal.getId());
        return ResponseEntity.ok(
                ApiResponse.success("Notification deleted.", null));
    }
}