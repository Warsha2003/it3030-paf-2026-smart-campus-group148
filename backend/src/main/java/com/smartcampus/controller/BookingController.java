package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.BookingDecisionRequest;
import com.smartcampus.dto.BookingResponseDto;
import com.smartcampus.dto.CancelBookingRequest;
import com.smartcampus.dto.CreateBookingRequest;
import com.smartcampus.security.CustomUserDetails;
import com.smartcampus.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Booking management endpoints for the Smart Campus workflow.
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponseDto>> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        BookingResponseDto created = bookingService.createBooking(request, userDetails.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking request created", created));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> getMyBookings(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<BookingResponseDto> bookings = bookingService.getMyBookings(userDetails.getUser().getId(), status);
        return ResponseEntity.ok(ApiResponse.success("Bookings retrieved", bookings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponseDto>> getBookingById(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        BookingResponseDto booking = bookingService.getBookingById(id, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success("Booking retrieved", booking));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> getAllBookings(
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate bookingDate) {

        List<BookingResponseDto> bookings = bookingService.getAllBookings(resourceId, userId, status, bookingDate);
        return ResponseEntity.ok(ApiResponse.success("All bookings retrieved", bookings));
    }

    @PatchMapping("/{id}/decision")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponseDto>> reviewBooking(
            @PathVariable String id,
            @Valid @RequestBody BookingDecisionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        BookingResponseDto updated = bookingService.reviewBooking(id, request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success("Booking reviewed", updated));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponseDto>> cancelBooking(
            @PathVariable String id,
            @Valid @RequestBody(required = false) CancelBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        BookingResponseDto cancelled = bookingService.cancelBooking(id, request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled", cancelled));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        bookingService.deleteBooking(id, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success("Booking deleted"));
    }
}
