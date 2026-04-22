package com.smartcampus.dto;

import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * DTO for creating or updating a resource.
 *
 * Member 1 - Facilities & Assets Catalogue
 */
public class ResourceRequest {

    @NotBlank(message = "Resource name is required")
    @Size(min = 2, max = 100, message = "Resource name must be between 2 and 100 characters")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType type;

    @PositiveOrZero(message = "Capacity must be 0 or greater")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    @Size(min = 2, max = 120, message = "Location must be between 2 and 120 characters")
    private String location;

    @Size(max = 500, message = "Description must be 500 characters or less")
    private String description;

    private ResourceStatus status;

    @Size(max = 20, message = "Availability windows cannot exceed 20 entries")
    private List<@Size(max = 80, message = "Availability window entries must be 80 characters or less") String> availabilityWindows;

    public ResourceRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ResourceType getType() { return type; }
    public void setType(ResourceType type) { this.type = type; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ResourceStatus getStatus() { return status; }
    public void setStatus(ResourceStatus status) { this.status = status; }

    public List<String> getAvailabilityWindows() { return availabilityWindows; }
    public void setAvailabilityWindows(List<String> availabilityWindows) { this.availabilityWindows = availabilityWindows; }
}
