package com.smartcampus.service;

import com.smartcampus.enums.NotificationType;
import com.smartcampus.enums.Role;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.TicketComment;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketCommentRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private TicketCommentRepository commentRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TicketService ticketService;

    @Test
    void createTicketShouldNotifyAllActiveAdmins() throws Exception {
        Ticket ticket = new Ticket();
        ticket.setId("ticket-1");
        ticket.setCategory("ELECTRICAL");
        ticket.setLocation("Lab 2");
        ticket.setReportedByUserId("user-1");
        ticket.setReportedByEmail("student@smartcampus.edu");

        User adminOne = new User("admin-1", "Admin One", "admin1@smartcampus.edu", null, null,
                "CREDENTIALS", Role.ADMIN, true, Instant.now(), Instant.now());
        User adminTwo = new User("admin-2", "Admin Two", "admin2@smartcampus.edu", null, null,
                "CREDENTIALS", Role.ADMIN, true, Instant.now(), Instant.now());

        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findByRoleAndActiveTrue(Role.ADMIN)).thenReturn(List.of(adminOne, adminTwo));

        Ticket savedTicket = ticketService.createTicket(ticket, null);

        assertEquals("ticket-1", savedTicket.getId());
        verify(notificationService).createNotification(
                eq("admin-1"),
                eq("New Support Ticket"),
                anyString(),
                eq(NotificationType.TICKET),
                eq("ticket-1")
        );
        verify(notificationService).createNotification(
                eq("admin-2"),
                eq("New Support Ticket"),
                anyString(),
                eq(NotificationType.TICKET),
                eq("ticket-1")
        );
    }

    @Test
    void addCommentShouldNotifyAdminsWhenRegularUserComments() {
        Ticket ticket = new Ticket();
        ticket.setId("ticket-2");
        ticket.setLocation("Library");
        ticket.setReportedByUserId("user-1");

        TicketComment comment = new TicketComment();
        comment.setTicketId("ticket-2");
        comment.setUserId("user-1");
        comment.setUsername("Student User");
        comment.setContent("Any update?");

        User admin = new User("admin-1", "Admin", "admin@smartcampus.edu", null, null,
                "CREDENTIALS", Role.ADMIN, true, Instant.now(), Instant.now());

        when(ticketRepository.findById("ticket-2")).thenReturn(Optional.of(ticket));
        when(commentRepository.save(any(TicketComment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findByRoleAndActiveTrue(Role.ADMIN)).thenReturn(List.of(admin));

        ticketService.addComment(comment, Role.USER);

        verify(notificationService).createNotification(
                eq("admin-1"),
                eq("New Ticket Comment"),
                anyString(),
                eq(NotificationType.COMMENT),
                eq("ticket-2")
        );
    }

    @Test
    void addCommentShouldNotifyTicketReporterWhenStaffReplies() {
        Ticket ticket = new Ticket();
        ticket.setId("ticket-3");
        ticket.setLocation("Auditorium");
        ticket.setReportedByUserId("user-7");

        TicketComment comment = new TicketComment();
        comment.setTicketId("ticket-3");
        comment.setUserId("admin-1");
        comment.setUsername("Campus Admin");
        comment.setContent("We are checking this now.");

        when(ticketRepository.findById("ticket-3")).thenReturn(Optional.of(ticket));
        when(commentRepository.save(any(TicketComment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ticketService.addComment(comment, Role.ADMIN);

        verify(notificationService).createNotification(
                eq("user-7"),
                eq("Support Ticket Update"),
                anyString(),
                eq(NotificationType.COMMENT),
                eq("ticket-3")
        );
        verify(userRepository, never()).findByRoleAndActiveTrue(Role.ADMIN);
    }
}
