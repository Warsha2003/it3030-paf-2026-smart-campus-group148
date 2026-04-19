package com.smartcampus.service;

import com.smartcampus.dto.ResourceResponseDto;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Resource;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class ResourceService {

    private static final List<BookingStatus> BLOCKING_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.APPROVED
    );

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;

    public ResourceService(ResourceRepository resourceRepository, BookingRepository bookingRepository) {
        this.resourceRepository = resourceRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<ResourceResponseDto> getResources(String type, Integer minCapacity, String location, String status,
                                                  LocalDate availableDate, LocalTime startTime, LocalTime endTime) {
        ResourceType resourceType = parseType(type);
        ResourceStatus resourceStatus = parseStatus(status);

        boolean hasAvailabilityFilter = availableDate != null || startTime != null || endTime != null;
        if (hasAvailabilityFilter && (availableDate == null || startTime == null || endTime == null)) {
            throw new BadRequestException("availableDate, startTime, and endTime must all be provided together.");
        }
        if (hasAvailabilityFilter && !startTime.isBefore(endTime)) {
            throw new BadRequestException("startTime must be earlier than endTime.");
        }

        return resourceRepository.findAllByOrderByNameAsc().stream()
                .filter(resource -> resourceType == null || resource.getType() == resourceType)
                .filter(resource -> resourceStatus == null || resource.getStatus() == resourceStatus)
                .filter(resource -> minCapacity == null || resource.getCapacity() >= minCapacity)
                .filter(resource -> location == null || location.isBlank()
                        || resource.getLocation().toLowerCase().contains(location.trim().toLowerCase()))
                .filter(resource -> !hasAvailabilityFilter
                        || isAvailable(resource, availableDate, startTime, endTime))
                .map(this::mapToDto)
                .toList();
    }

    public Resource getResourceEntity(String resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", resourceId));
    }

    public ResourceResponseDto getResourceById(String resourceId) {
        return mapToDto(getResourceEntity(resourceId));
    }

    private boolean isAvailable(Resource resource, LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            return false;
        }
        if (resource.getAvailabilityStart() != null && startTime.isBefore(resource.getAvailabilityStart())) {
            return false;
        }
        if (resource.getAvailabilityEnd() != null && endTime.isAfter(resource.getAvailabilityEnd())) {
            return false;
        }

        List<Booking> bookings = bookingRepository.findByResourceIdAndBookingDateAndStatusIn(
                resource.getId(), bookingDate, BLOCKING_STATUSES
        );

        return bookings.stream().noneMatch(booking ->
                overlaps(startTime, endTime, booking.getStartTime(), booking.getEndTime()));
    }

    private boolean overlaps(LocalTime requestedStart, LocalTime requestedEnd,
                             LocalTime existingStart, LocalTime existingEnd) {
        return requestedStart.isBefore(existingEnd) && requestedEnd.isAfter(existingStart);
    }

    private ResourceType parseType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        try {
            return ResourceType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid resource type: " + type);
        }
    }

    private ResourceStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return ResourceStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid resource status: " + status);
        }
    }

    private ResourceResponseDto mapToDto(Resource resource) {
        return new ResourceResponseDto(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity(),
                resource.getLocation(),
                resource.getAvailabilityStart(),
                resource.getAvailabilityEnd(),
                resource.getStatus(),
                resource.getCreatedAt(),
                resource.getUpdatedAt()
        );
    }
}
