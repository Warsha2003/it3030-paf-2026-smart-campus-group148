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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository         userRepository;

    @InjectMocks private NotificationService notificationService;

    private User   testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).email("test@test.com").name("Test User").build();

        testNotification = Notification.builder()
                .id(10L)
                .user(testUser)
                .title("Test Title")
                .message("Test message")
                .type(NotificationType.BOOKING_APPROVED)
                .link("/bookings/1")
                .referenceId(1L)
                .read(false)
                .build();
    }

    // ── notify() ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("notify() saves and returns notification DTO")
    void notify_savesNotification() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        NotificationDTO dto = notificationService.notify(
                1L, "Test Title", "Test message",
                NotificationType.BOOKING_APPROVED, "/bookings/1", 1L);

        assertThat(dto.getTitle()).isEqualTo("Test Title");
        assertThat(dto.getType()).isEqualTo(NotificationType.BOOKING_APPROVED);
        assertThat(dto.isRead()).isFalse();
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("notify() throws ResourceNotFoundException when user not found")
    void notify_userNotFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() ->
                notificationService.notify(99L, "T", "M", NotificationType.SYSTEM, null, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── getUnreadCount() ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getUnreadCount() returns correct count from repository")
    void getUnreadCount_returnsCount() {
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(5L);
        assertThat(notificationService.getUnreadCount(1L)).isEqualTo(5L);
    }

    // ── getUnread() ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("getUnread() returns list of unread DTOs")
    void getUnread_returnsList() {
        when(notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(testNotification));

        List<NotificationDTO> result = notificationService.getUnread(1L);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isRead()).isFalse();
    }

    // ── markRead() ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("markRead() calls repository update method")
    void markRead_callsRepository() {
        when(notificationRepository.markReadByIdAndUserId(10L, 1L)).thenReturn(1);
        notificationService.markRead(10L, 1L);
        verify(notificationRepository).markReadByIdAndUserId(10L, 1L);
    }

    @Test
    @DisplayName("markRead() throws when notification not found or not owned")
    void markRead_notFound_throws() {
        when(notificationRepository.markReadByIdAndUserId(99L, 1L)).thenReturn(0);
        assertThatThrownBy(() -> notificationService.markRead(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── markAllRead() ────────────────────────────────────────────────────────

    @Test
    @DisplayName("markAllRead() returns count of updated records")
    void markAllRead_returnsCount() {
        when(notificationRepository.markAllReadByUserId(1L)).thenReturn(3);
        assertThat(notificationService.markAllRead(1L)).isEqualTo(3);
    }

    // ── deleteNotification() ─────────────────────────────────────────────────

    @Test
    @DisplayName("deleteNotification() deletes owned notification")
    void deleteNotification_owned_deletes() {
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(testNotification));
        notificationService.deleteNotification(10L, 1L);
        verify(notificationRepository).delete(testNotification);
    }

    @Test
    @DisplayName("deleteNotification() throws when user does not own notification")
    void deleteNotification_notOwned_throws() {
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(testNotification));
        assertThatThrownBy(() -> notificationService.deleteNotification(10L, 999L))
                .isInstanceOf(UnauthorizedException.class);
    }

    // ── getNotifications() ───────────────────────────────────────────────────

    @Test
    @DisplayName("getNotifications() returns paged response")
    void getNotifications_returnsPaged() {
        Page<Notification> mockPage = new PageImpl<>(List.of(testNotification));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(
                eq(1L), any(Pageable.class))).thenReturn(mockPage);

        PagedResponse<NotificationDTO> response =
                notificationService.getNotifications(1L, 0, 10);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getTotalElements()).isEqualTo(1);
    }
}