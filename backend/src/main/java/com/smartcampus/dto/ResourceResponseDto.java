package com.smartcampus.dto;

import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.model.Resource;

import java.time.Instant;
import java.util.List;

/**
 * DTO returned to clients for resource data.
 *
 * Member 1 - Facilities & Assets Catalogue
 */
public class ResourceResponseDto {

    private String id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private String description;
    private ResourceStatus status;
    private List<String> availabilityWindows;
    private Instant createdAt;
    private Instant updatedAt;

    public ResourceResponseDto() {}

    public static ResourceResponseDto fromEntity(Resource r) {
        ResourceResponseDto dto = new ResourceResponseDto();
        dto.setId(r.getId());
        dto.setName(r.getName());
        dto.setType(r.getType());
        dto.setCapacity(r.getCapacity());
        dto.setLocation(r.getLocation());
        dto.setDescription(r.getDescription());
        dto.setStatus(r.getStatus());
        dto.setAvailabilityWindows(r.getAvailabilityWindows());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
