package com.smartcampus.service;

import com.smartcampus.dto.BookingDecisionRequest;
import com.smartcampus.dto.BookingResponseDto;
import com.smartcampus.dto.CancelBookingRequest;
import com.smartcampus.dto.CreateBookingRequest;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.enums.NotificationType;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Resource;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.util.ResourceAvailabilityUtils;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class BookingService {

    private static final List<BookingStatus> CREATE_BLOCKING_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.APPROVED
    );

    private static final List<BookingStatus> APPROVAL_BLOCKING_STATUSES = List.of(BookingStatus.APPROVED);

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository,
                          ResourceRepository resourceRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public BookingResponseDto createBooking(CreateBookingRequest request, User currentUser) {
        validateTimeRange(request.getStartTime(), request.getEndTime());
        validateBookingDate(request.getBookingDate());

        Resource resource = getResource(request.getResourceId());
        validateResourceAvailability(resource, request.getBookingDate(),
                request.getStartTime(), request.getEndTime(), request.getExpectedAttendees());
        assertNoConflict(resource.getId(), request.getBookingDate(), request.getStartTime(), request.getEndTime(),
                CREATE_BLOCKING_STATUSES, null);

        Booking booking = new Booking();
        booking.setResourceId(resource.getId());
        booking.setUserId(currentUser.getId());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose().trim());
        booking.setExpectedAttendees(request.getExpectedAttendees());
        booking.setStatus(BookingStatus.PENDING);

        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    public List<BookingResponseDto> getMyBookings(String userId, String status) {
        BookingStatus bookingStatus = parseStatus(status);
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(booking -> bookingStatus == null || booking.getStatus() == bookingStatus)
                .map(this::mapToDto)
                .toList();
    }

    public List<BookingResponseDto> getAllBookings(String resourceId, String userId, String status, LocalDate bookingDate) {
        BookingStatus bookingStatus = parseStatus(status);
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(booking -> resourceId == null || resourceId.isBlank() || resourceId.equals(booking.getResourceId()))
                .filter(booking -> userId == null || userId.isBlank() || userId.equals(booking.getUserId()))
                .filter(booking -> bookingStatus == null || booking.getStatus() == bookingStatus)
                .filter(booking -> bookingDate == null || bookingDate.equals(booking.getBookingDate()))
                .map(this::mapToDto)
                .toList();
    }

    public BookingResponseDto getBookingById(String bookingId, User currentUser) {
        Booking booking = getBooking(bookingId);
        ensureOwnerOrAdmin(booking, currentUser);
        return mapToDto(booking);
    }

    public BookingResponseDto updateBooking(String bookingId, CreateBookingRequest request, User currentUser) {
        validateTimeRange(request.getStartTime(), request.getEndTime());
        validateBookingDate(request.getBookingDate());

        Booking booking = getBooking(bookingId);
        ensureOwnerOrAdmin(booking, currentUser);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be edited.");
        }

        Resource resource = getResource(request.getResourceId());
        validateResourceAvailability(resource, request.getBookingDate(),
                request.getStartTime(), request.getEndTime(), request.getExpectedAttendees());
        assertNoConflict(resource.getId(), request.getBookingDate(), request.getStartTime(), request.getEndTime(),
                CREATE_BLOCKING_STATUSES, booking.getId());

        booking.setResourceId(resource.getId());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose().trim());
        booking.setExpectedAttendees(request.getExpectedAttendees());

        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    public BookingResponseDto reviewBooking(String bookingId, BookingDecisionRequest request, User adminUser) {
        Booking booking = getBooking(bookingId);

        if (!isAdmin(adminUser)) {
            throw new UnauthorizedException("Only ADMIN users can review bookings.");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ConflictException("Only pending bookings can be reviewed.");
        }
        if (request.getStatus() != BookingStatus.APPROVED && request.getStatus() != BookingStatus.REJECTED) {
            throw new BadRequestException("Review status must be APPROVED or REJECTED.");
        }
        if (request.getStatus() == BookingStatus.REJECTED
                && (request.getReason() == null || request.getReason().isBlank())) {
            throw new BadRequestException("A rejection reason is required.");
        }

        Resource resource = getResource(booking.getResourceId());
        if (request.getStatus() == BookingStatus.APPROVED) {
            validateResourceAvailability(resource, booking.getBookingDate(),
                    booking.getStartTime(), booking.getEndTime(), booking.getExpectedAttendees());
            assertNoConflict(resource.getId(), booking.getBookingDate(), booking.getStartTime(), booking.getEndTime(),
                    APPROVAL_BLOCKING_STATUSES, booking.getId());
        }

        booking.setStatus(request.getStatus());
        booking.setAdminDecisionReason(clean(request.getReason()));
        booking.setReviewedByAdminId(adminUser.getId());
        booking.setReviewedAt(Instant.now());

        Booking saved = bookingRepository.save(booking);
        sendReviewNotification(saved, resource);
        return mapToDto(saved);
    }

    public BookingResponseDto cancelBooking(String bookingId, CancelBookingRequest request, User currentUser) {
        Booking booking = getBooking(bookingId);
        ensureOwnerOrAdmin(booking, currentUser);

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BadRequestException("Only approved bookings can be cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(clean(request != null ? request.getReason() : null));
        booking.setCancelledByUserId(currentUser.getId());
        booking.setCancelledAt(Instant.now());

        Booking saved = bookingRepository.save(booking);

        if (isAdmin(currentUser) && !currentUser.getId().equals(saved.getUserId())) {
            Resource resource = getResource(saved.getResourceId());
            notificationService.createNotification(
                    saved.getUserId(),
                    "Booking Cancelled",
                    "Your booking for " + resource.getName() + " on " + saved.getBookingDate() + " was cancelled by an administrator.",
                    NotificationType.BOOKING,
                    saved.getId()
            );
        }

        return mapToDto(saved);
    }

    public void deleteBooking(String bookingId, User currentUser) {
        Booking booking = getBooking(bookingId);
        ensureOwnerOrAdmin(booking, currentUser);

        if (booking.getStatus() == BookingStatus.APPROVED) {
            throw new BadRequestException("Approved bookings cannot be deleted. Cancel them instead.");
        }

        bookingRepository.delete(booking);
    }

    private void sendReviewNotification(Booking booking, Resource resource) {
        String title = booking.getStatus() == BookingStatus.APPROVED ? "Booking Approved" : "Booking Rejected";
        String message;
        if (booking.getStatus() == BookingStatus.APPROVED) {
            message = "Your booking for " + resource.getName() + " on " + booking.getBookingDate()
                    + " from " + booking.getStartTime() + " to " + booking.getEndTime() + " was approved.";
        } else {
            message = "Your booking for " + resource.getName() + " was rejected."
                    + (booking.getAdminDecisionReason() != null ? " Reason: " + booking.getAdminDecisionReason() : "");
        }

        notificationService.createNotification(
                booking.getUserId(),
                title,
                message,
                NotificationType.BOOKING,
                booking.getId()
        );
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("startTime must be earlier than endTime.");
        }
    }

    private void validateBookingDate(LocalDate bookingDate) {
        if (bookingDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("Bookings cannot be created for past dates.");
        }
    }

    private void validateResourceAvailability(Resource resource, LocalDate bookingDate,
                                              LocalTime startTime, LocalTime endTime,
                                              Integer expectedAttendees) {
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new ConflictException("This resource is currently out of service.");
        }
        if (!ResourceAvailabilityUtils.isWithinAvailability(resource, bookingDate, startTime, endTime)) {
            throw new BadRequestException("The selected time is outside the resource availability window.");
        }
        if (expectedAttendees != null && resource.getCapacity() != null && expectedAttendees > resource.getCapacity()) {
            throw new BadRequestException("Expected attendees exceed the resource capacity.");
        }
    }

    private void assertNoConflict(String resourceId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime,
                                  List<BookingStatus> blockingStatuses, String bookingIdToIgnore) {
        boolean conflictExists = bookingRepository.findByResourceIdAndBookingDateAndStatusIn(
                        resourceId, bookingDate, blockingStatuses
                ).stream()
                .filter(existing -> bookingIdToIgnore == null || !bookingIdToIgnore.equals(existing.getId()))
                .anyMatch(existing -> overlaps(startTime, endTime, existing.getStartTime(), existing.getEndTime()));

        if (conflictExists) {
            throw new ConflictException("The selected resource already has an overlapping booking for that time range.");
        }
    }

    private boolean overlaps(LocalTime requestedStart, LocalTime requestedEnd,
                             LocalTime existingStart, LocalTime existingEnd) {
        return requestedStart.isBefore(existingEnd) && requestedEnd.isAfter(existingStart);
    }

    private void ensureOwnerOrAdmin(Booking booking, User currentUser) {
        boolean owner = booking.getUserId().equals(currentUser.getId());
        if (!owner && !isAdmin(currentUser)) {
            throw new UnauthorizedException("You are not allowed to access this booking.");
        }
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && user.getRole().name().equals("ADMIN");
    }

    private BookingStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return BookingStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid booking status: " + status);
        }
    }

    private Booking getBooking(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
    }

    private Resource getResource(String resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", resourceId));
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private BookingResponseDto mapToDto(Booking booking) {
        Resource resource = resourceRepository.findById(booking.getResourceId()).orElse(null);
        User requester = userRepository.findById(booking.getUserId()).orElse(null);
        User reviewer = booking.getReviewedByAdminId() == null
                ? null
                : userRepository.findById(booking.getReviewedByAdminId()).orElse(null);

        return new BookingResponseDto(
                booking.getId(),
                booking.getResourceId(),
                resource != null ? resource.getName() : null,
                resource != null ? resource.getType() : null,
                resource != null ? resource.getLocation() : null,
                booking.getUserId(),
                requester != null ? requester.getName() : null,
                requester != null ? requester.getEmail() : null,
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getPurpose(),
                booking.getExpectedAttendees(),
                booking.getStatus(),
                booking.getAdminDecisionReason(),
                booking.getReviewedByAdminId(),
                reviewer != null ? reviewer.getName() : null,
                booking.getReviewedAt(),
                booking.getCancellationReason(),
                booking.getCancelledByUserId(),
                booking.getCancelledAt(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
