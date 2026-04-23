package com.smartcampus.service;

import com.smartcampus.dto.ResourceRequest;
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
import com.smartcampus.util.ResourceAvailabilityUtils;
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

    public ResourceResponseDto createResource(ResourceRequest request) {
        ensureUniqueName(request.getName(), null);

        Resource resource = new Resource();
        applyRequest(resource, request);
        return ResourceResponseDto.fromEntity(resourceRepository.save(resource));
    }

    public List<ResourceResponseDto> getResources(String search,
                                                  String type,
                                                  Integer minCapacity,
                                                  String location,
                                                  String status,
                                                  LocalDate availableDate,
                                                  LocalTime startTime,
                                                  LocalTime endTime) {
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
                .filter(resource -> matchesSearch(resource, search))
                .filter(resource -> resourceType == null || resource.getType() == resourceType)
                .filter(resource -> resourceStatus == null || resource.getStatus() == resourceStatus)
                .filter(resource -> minCapacity == null
                        || (resource.getCapacity() != null && resource.getCapacity() >= minCapacity))
                .filter(resource -> matchesLocation(resource, location))
                .filter(resource -> !hasAvailabilityFilter
                        || isAvailable(resource, availableDate, startTime, endTime))
                .map(resource -> mapToDto(resource, availableDate))
                .toList();
    }

    public Resource getResourceEntity(String resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", resourceId));
    }

    public ResourceResponseDto getResourceById(String resourceId) {
        return mapToDto(getResourceEntity(resourceId), null);
    }

    public ResourceResponseDto updateResource(String id, ResourceRequest request) {
        Resource resource = getResourceEntity(id);
        ensureUniqueName(request.getName(), id);
        applyRequest(resource, request);
        return ResourceResponseDto.fromEntity(resourceRepository.save(resource));
    }

    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource", "id", id);
        }
        resourceRepository.deleteById(id);
    }

    public ResourceResponseDto updateStatus(String id, ResourceStatus status) {
        Resource resource = getResourceEntity(id);
        resource.setStatus(status);
        return ResourceResponseDto.fromEntity(resourceRepository.save(resource));
    }

    private boolean isAvailable(Resource resource, LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            return false;
        }
        if (!ResourceAvailabilityUtils.isWithinAvailability(resource, bookingDate, startTime, endTime)) {
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

    private void applyRequest(Resource resource, ResourceRequest request) {
        List<String> normalizedWindows = ResourceAvailabilityUtils.normalizeWindows(request.getAvailabilityWindows());

        resource.setName(request.getName().trim());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation().trim());
        resource.setDescription(clean(request.getDescription()));
        resource.setStatus(request.getStatus() != null ? request.getStatus() : ResourceStatus.ACTIVE);
        resource.setAvailabilityWindows(normalizedWindows.isEmpty() ? null : normalizedWindows);
        resource.setAvailabilityStart(ResourceAvailabilityUtils.deriveAvailabilityStart(normalizedWindows));
        resource.setAvailabilityEnd(ResourceAvailabilityUtils.deriveAvailabilityEnd(normalizedWindows));
    }

    private void ensureUniqueName(String resourceName, String currentResourceId) {
        String normalizedName = resourceName == null ? "" : resourceName.trim();
        resourceRepository.findByName(normalizedName).ifPresent(existing -> {
            if (currentResourceId == null || !existing.getId().equals(currentResourceId)) {
                throw new BadRequestException("A resource with this name already exists.");
            }
        });
    }

    private boolean matchesSearch(Resource resource, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }

        String query = search.trim().toLowerCase();
        return containsIgnoreCase(resource.getName(), query)
                || containsIgnoreCase(resource.getLocation(), query)
                || containsIgnoreCase(resource.getDescription(), query);
    }

    private boolean matchesLocation(Resource resource, String location) {
        if (location == null || location.isBlank()) {
            return true;
        }
        return containsIgnoreCase(resource.getLocation(), location.trim().toLowerCase());
    }

    private boolean containsIgnoreCase(String source, String expectedLowercase) {
        return source != null && source.toLowerCase().contains(expectedLowercase);
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

    private String clean(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private ResourceResponseDto mapToDto(Resource resource, LocalDate availableDate) {
        return new ResourceResponseDto(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity(),
                resource.getLocation(),
                resource.getDescription(),
                resource.getAvailabilityWindows(),
                ResourceAvailabilityUtils.resolveDisplayAvailabilityStart(resource, availableDate),
                ResourceAvailabilityUtils.resolveDisplayAvailabilityEnd(resource, availableDate),
                resource.getStatus(),
                resource.getCreatedAt(),
                resource.getUpdatedAt()
        );
    }
}
