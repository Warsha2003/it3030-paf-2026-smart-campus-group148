package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.ResourceRequest;
import com.smartcampus.dto.ResourceResponseDto;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

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

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResourceResponseDto>>> getResources(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate availableDate,
            @RequestParam(required = false) LocalTime startTime,
            @RequestParam(required = false) LocalTime endTime) {

        List<ResourceResponseDto> resources = resourceService.getResources(
                search, type, minCapacity, location, status, availableDate, startTime, endTime
        );

        return ResponseEntity.ok(ApiResponse.success("Resources retrieved", resources));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponseDto>> getResourceById(@PathVariable String id) {
        ResourceResponseDto dto = resourceService.getResourceById(id);
        return ResponseEntity.ok(ApiResponse.success("Resource retrieved", dto));
    }
}
