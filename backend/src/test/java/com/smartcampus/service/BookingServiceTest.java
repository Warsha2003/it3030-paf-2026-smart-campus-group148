package com.smartcampus.service;

import com.smartcampus.dto.BookingDecisionRequest;
import com.smartcampus.dto.CreateBookingRequest;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.enums.NotificationType;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.enums.Role;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Resource;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    private Resource resource;
    private User requester;
    private User admin;

    @BeforeEach
    void setUp() {
        resource = new Resource(
                "resource-1",
                "Conference Room A",
                ResourceType.MEETING_ROOM,
                10,
                "Block A",
                LocalTime.of(8, 0),
                LocalTime.of(18, 0),
                ResourceStatus.ACTIVE,
                Instant.now(),
                Instant.now()
        );

        requester = new User("user-1", "John Student", "john@smartcampus.edu", null, null,
                "GOOGLE", Role.USER, true, Instant.now(), Instant.now());
        admin = new User("admin-1", "System Admin", "admin@smartcampus.edu", null, null,
                "CREDENTIALS", Role.ADMIN, true, Instant.now(), Instant.now());
    }

    @Test
    void createBookingShouldRejectOverlappingTimeRange() {
        CreateBookingRequest request = new CreateBookingRequest();
        request.setResourceId(resource.getId());
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(11, 0));
        request.setPurpose("Department meeting");
        request.setExpectedAttendees(8);

        Booking existing = new Booking();
        existing.setId("booking-1");
        existing.setResourceId(resource.getId());
        existing.setUserId("another-user");
        existing.setBookingDate(request.getBookingDate());
        existing.setStartTime(LocalTime.of(10, 30));
        existing.setEndTime(LocalTime.of(11, 30));
        existing.setStatus(BookingStatus.PENDING);

        when(resourceRepository.findById(resource.getId())).thenReturn(Optional.of(resource));
        when(bookingRepository.findByResourceIdAndBookingDateAndStatusIn(
                eq(resource.getId()),
                eq(request.getBookingDate()),
                any())
        ).thenReturn(List.of(existing));

        assertThrows(ConflictException.class, () -> bookingService.createBooking(request, requester));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void reviewBookingShouldApproveAndNotifyRequester() {
        Booking booking = new Booking();
        booking.setId("booking-2");
        booking.setResourceId(resource.getId());
        booking.setUserId(requester.getId());
        booking.setBookingDate(LocalDate.now().plusDays(2));
        booking.setStartTime(LocalTime.of(9, 0));
        booking.setEndTime(LocalTime.of(10, 0));
        booking.setPurpose("Project discussion");
        booking.setExpectedAttendees(6);
        booking.setStatus(BookingStatus.PENDING);

        BookingDecisionRequest request = new BookingDecisionRequest();
        request.setStatus(BookingStatus.APPROVED);
        request.setReason("Looks good");

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(resourceRepository.findById(resource.getId())).thenReturn(Optional.of(resource));
        when(bookingRepository.findByResourceIdAndBookingDateAndStatusIn(
                eq(resource.getId()),
                eq(booking.getBookingDate()),
                any())
        ).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findById(requester.getId())).thenReturn(Optional.of(requester));
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));

        bookingService.reviewBooking(booking.getId(), request, admin);

        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        assertEquals(BookingStatus.APPROVED, bookingCaptor.getValue().getStatus());
        assertEquals(admin.getId(), bookingCaptor.getValue().getReviewedByAdminId());

        verify(notificationService).createNotification(
                eq(requester.getId()),
                eq("Booking Approved"),
                anyString(),
                eq(NotificationType.BOOKING),
                eq(booking.getId())
        );
    }

    @Test
    void updateBookingShouldAllowPendingRequestsOnly() {
        Booking booking = new Booking();
        booking.setId("booking-3");
        booking.setResourceId(resource.getId());
        booking.setUserId(requester.getId());
        booking.setBookingDate(LocalDate.now().plusDays(2));
        booking.setStartTime(LocalTime.of(9, 0));
        booking.setEndTime(LocalTime.of(10, 0));
        booking.setPurpose("Weekly sync");
        booking.setExpectedAttendees(5);
        booking.setStatus(BookingStatus.PENDING);

        CreateBookingRequest updateRequest = new CreateBookingRequest();
        updateRequest.setResourceId(resource.getId());
        updateRequest.setBookingDate(LocalDate.now().plusDays(3));
        updateRequest.setStartTime(LocalTime.of(11, 0));
        updateRequest.setEndTime(LocalTime.of(12, 0));
        updateRequest.setPurpose("Updated sync");
        updateRequest.setExpectedAttendees(7);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(resourceRepository.findById(resource.getId())).thenReturn(Optional.of(resource));
        when(bookingRepository.findByResourceIdAndBookingDateAndStatusIn(
                eq(resource.getId()),
                eq(updateRequest.getBookingDate()),
                any())
        ).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findById(requester.getId())).thenReturn(Optional.of(requester));

        bookingService.updateBooking(booking.getId(), updateRequest, requester);

        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        assertEquals(updateRequest.getBookingDate(), bookingCaptor.getValue().getBookingDate());
        assertEquals(updateRequest.getStartTime(), bookingCaptor.getValue().getStartTime());
        assertEquals(updateRequest.getEndTime(), bookingCaptor.getValue().getEndTime());
        assertEquals(updateRequest.getPurpose(), bookingCaptor.getValue().getPurpose());
        assertEquals(updateRequest.getExpectedAttendees(), bookingCaptor.getValue().getExpectedAttendees());

        booking.setStatus(BookingStatus.APPROVED);

        assertThrows(BadRequestException.class, () -> bookingService.updateBooking(booking.getId(), updateRequest, requester));
    }
}
