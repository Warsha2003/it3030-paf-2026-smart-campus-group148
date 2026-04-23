package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.ResourceAnalyticsDto;
import com.smartcampus.service.ResourceAnalyticsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {

    private final ResourceAnalyticsService resourceAnalyticsService;

    public AdminAnalyticsController(ResourceAnalyticsService resourceAnalyticsService) {
        this.resourceAnalyticsService = resourceAnalyticsService;
    }

    @GetMapping("/resources")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ResourceAnalyticsDto> getResourceAnalytics() {
        ResourceAnalyticsDto analytics = resourceAnalyticsService.getResourceAnalytics();
        return ApiResponse.success("Resource analytics loaded", analytics);
    }
}
