package com.smartcampus.service;

import com.smartcampus.dto.ResourceRequest;
import com.smartcampus.dto.ResourceResponseDto;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Resource;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for managing campus resources (Facilities & Assets Catalogue).
 *
 * Member 1 - Facilities & Assets Catalogue
 */
@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public ResourceResponseDto createResource(ResourceRequest request) {
        Resource resource = new Resource();
        resource.setName(request.getName());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation());
        resource.setDescription(request.getDescription());
        resource.setStatus(request.getStatus() != null ? request.getStatus() : ResourceStatus.ACTIVE);
        resource.setAvailabilityWindows(request.getAvailabilityWindows());
        Resource saved = resourceRepository.save(resource);
        return ResourceResponseDto.fromEntity(saved);
    }

    public List<ResourceResponseDto> getAllResources() {
        return resourceRepository.findAll().stream()
                .map(ResourceResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ResourceResponseDto getResourceById(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        return ResourceResponseDto.fromEntity(resource);
    }

    public ResourceResponseDto updateResource(String id, ResourceRequest request) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        resource.setName(request.getName());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation());
        resource.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            resource.setStatus(request.getStatus());
        }
        resource.setAvailabilityWindows(request.getAvailabilityWindows());
        Resource updated = resourceRepository.save(resource);
        return ResourceResponseDto.fromEntity(updated);
    }

    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    public ResourceResponseDto updateStatus(String id, ResourceStatus status) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        resource.setStatus(status);
        Resource updated = resourceRepository.save(resource);
        return ResourceResponseDto.fromEntity(updated);
    }

    public List<ResourceResponseDto> searchResources(String query) {
        return resourceRepository.findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(query, query)
                .stream()
                .map(ResourceResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ResourceResponseDto> filterByType(ResourceType type) {
        return resourceRepository.findByType(type).stream()
                .map(ResourceResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ResourceResponseDto> filterByStatus(ResourceStatus status) {
        return resourceRepository.findByStatus(status).stream()
                .map(ResourceResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ResourceResponseDto> filterByMinCapacity(Integer minCapacity) {
        return resourceRepository.findByCapacityGreaterThanEqual(minCapacity).stream()
                .map(ResourceResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ResourceResponseDto> filterByLocation(String location) {
        return resourceRepository.findByLocationContainingIgnoreCase(location).stream()
                .map(ResourceResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}
