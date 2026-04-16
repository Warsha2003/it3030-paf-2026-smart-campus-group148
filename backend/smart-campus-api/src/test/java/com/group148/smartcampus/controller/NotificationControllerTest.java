package com.smartcampus.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.dto.NotificationDTO;
import com.smartcampus.dto.PagedResponse;
import com.smartcampus.model.NotificationType;
import com.smartcampus.security.JwtAuthenticationFilter;
import com.smartcampus.security.UserPrincipal;
import com.smartcampus.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = NotificationController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = JwtAuthenticationFilter.class
    )
)
class NotificationControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private NotificationService notificationService;

    private NotificationDTO sampleDTO;
    private UserPrincipal   mockPrincipal;

    @BeforeEach
    void setUp() {
        sampleDTO = NotificationDTO.builder()
                .id(1L)
                .title("Booking Approved")
                .message("Your booking has been approved.")
                .type(NotificationType.BOOKING_APPROVED)
                .link("/bookings/5")
                .referenceId(5L)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("GET /api/notifications returns paged list")
    @WithMockUser
    void getNotifications_returns200() throws Exception {
        PagedResponse<NotificationDTO> paged = PagedResponse.<NotificationDTO>builder()
                .content(List.of(sampleDTO))
                .page(0).size(20).totalElements(1).totalPages(1).last(true)
                .build();
        when(notificationService.getNotifications(any(), eq(0), eq(20))).thenReturn(paged);

        mockMvc.perform(get("/api/notifications")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Booking Approved"));
    }

    @Test
    @DisplayName("GET /api/notifications/unread/count returns count object")
    @WithMockUser
    void getUnreadCount_returns200() throws Exception {
        when(notificationService.getUnreadCount(any())).thenReturn(3L);

        mockMvc.perform(get("/api/notifications/unread/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").value(3));
    }

    @Test
    @DisplayName("PATCH /api/notifications/{id}/read returns 200")
    @WithMockUser
    void markRead_returns200() throws Exception {
        mockMvc.perform(patch("/api/notifications/1/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PATCH /api/notifications/read-all returns updated count")
    @WithMockUser
    void markAllRead_returns200() throws Exception {
        when(notificationService.markAllRead(any())).thenReturn(5);

        mockMvc.perform(patch("/api/notifications/read-all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.updated").value(5));
    }

    @Test
    @DisplayName("DELETE /api/notifications/{id} returns 200")
    @WithMockUser
    void deleteNotification_returns200() throws Exception {
        mockMvc.perform(delete("/api/notifications/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /api/notifications returns 401 when unauthenticated")
    void getNotifications_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());
    }
}