package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.ResourceRequest;
import com.smartcampus.dto.ResourceResponseDto;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the Facilities & Assets Catalogue.
 * - Admin: full CRUD + status management
 * - Authenticated users: read-only browse, search, filter
 *
 * Member 1 - Facilities & Assets Catalogue
 */
@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    // ── Admin endpoints ──────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResourceResponseDto>> createResource(
            @Valid @RequestBody ResourceRequest request) {
        ResourceResponseDto dto = resourceService.createResource(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resource created successfully", dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResourceResponseDto>> updateResource(
            @PathVariable String id,
            @Valid @RequestBody ResourceRequest request) {
        ResourceResponseDto dto = resourceService.updateResource(id, request);
        return ResponseEntity.ok(ApiResponse.success("Resource updated successfully", dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteResource(@PathVariable String id) {
        resourceService.deleteResource(id);
        return ResponseEntity.ok(ApiResponse.success("Resource deleted successfully", null));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResourceResponseDto>> updateResourceStatus(
            @PathVariable String id,
            @RequestParam ResourceStatus status) {
        ResourceResponseDto dto = resourceService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Resource status updated successfully", dto));
    }

    // ── Public / Authenticated endpoints ─────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResourceResponseDto>>> getAllResources(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location) {

        List<ResourceResponseDto> results;

        if (search != null && !search.isBlank()) {
            results = resourceService.searchResources(search.trim());
        } else if (type != null) {
            results = resourceService.filterByType(type);
        } else if (status != null) {
            results = resourceService.filterByStatus(status);
        } else if (minCapacity != null) {
            results = resourceService.filterByMinCapacity(minCapacity);
        } else if (location != null && !location.isBlank()) {
            results = resourceService.filterByLocation(location.trim());
        } else {
            results = resourceService.getAllResources();
        }

        return ResponseEntity.ok(ApiResponse.success("Resources fetched successfully", results));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponseDto>> getResourceById(@PathVariable String id) {
        ResourceResponseDto dto = resourceService.getResourceById(id);
        return ResponseEntity.ok(ApiResponse.success("Resource fetched successfully", dto));
    }
}
