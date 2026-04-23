package com.smartcampus.service;

import com.smartcampus.dto.ResourceAnalyticsDto;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.model.Resource;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.util.ResourceAvailabilityUtils;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ResourceAnalyticsService {

    private final ResourceRepository resourceRepository;

    public ResourceAnalyticsService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public ResourceAnalyticsDto getResourceAnalytics() {
        return getResourceAnalytics(5, 3);
    }

    public ResourceAnalyticsDto getResourceAnalytics(int topResourcesLimit, int peakHoursLimit) {
        List<Resource> activeResources = resourceRepository.findByStatus(ResourceStatus.ACTIVE);

        List<ResourceAnalyticsDto.TopResourceDto> topResources = activeResources.stream()
                .sorted(Comparator
                        .comparing((Resource r) -> r.getCapacity() == null ? 0 : r.getCapacity())
                        .reversed()
                        .thenComparing(r -> r.getName() == null ? "" : r.getName(), String.CASE_INSENSITIVE_ORDER))
                .limit(Math.max(0, topResourcesLimit))
                .map(r -> new ResourceAnalyticsDto.TopResourceDto(r.getId(), r.getName(), r.getLocation(), r.getCapacity()))
                .toList();

        Map<Integer, Integer> hourCounts = new HashMap<>();
        for (Resource r : activeResources) {
            List<String> windows = r.getAvailabilityWindows();
            if (windows == null || windows.isEmpty()) {
                if (r.getAvailabilityStart() == null || r.getAvailabilityEnd() == null) {
                    continue;
                }
                windows = List.of(r.getAvailabilityStart() + "-" + r.getAvailabilityEnd());
            }

            for (String window : windows) {
                List<Integer> coveredHours = ResourceAvailabilityUtils.getCoveredHours(window);
                for (Integer hour : coveredHours) {
                    hourCounts.put(hour, hourCounts.getOrDefault(hour, 0) + 1);
                }
            }
        }

        List<ResourceAnalyticsDto.PeakHourDto> peakHours = hourCounts.entrySet().stream()
                .sorted((a, b) -> {
                    int byCount = Integer.compare(b.getValue(), a.getValue());
                    if (byCount != 0) return byCount;
                    return Integer.compare(a.getKey(), b.getKey());
                })
                .limit(Math.max(0, peakHoursLimit))
                .map(e -> new ResourceAnalyticsDto.PeakHourDto(e.getKey(), e.getValue()))
                .toList();

        return new ResourceAnalyticsDto(topResources, peakHours);
    }
}
