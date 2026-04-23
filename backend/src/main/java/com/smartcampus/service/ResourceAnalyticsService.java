package com.smartcampus.service;

import com.smartcampus.dto.ResourceAnalyticsDto;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.model.Resource;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ResourceAnalyticsService {

    private static final Pattern TIME_RANGE = Pattern.compile("(\\d{1,2}):(\\d{2})\\s*-\\s*(\\d{1,2}):(\\d{2})");

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
            if (windows == null || windows.isEmpty()) continue;

            for (String window : windows) {
                List<Integer> coveredHours = parseCoveredHours(window);
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

    private List<Integer> parseCoveredHours(String input) {
        if (input == null) return List.of();

        Matcher matcher = TIME_RANGE.matcher(input);
        if (!matcher.find()) return List.of();

        int startHour = safeParseInt(matcher.group(1));
        int startMin = safeParseInt(matcher.group(2));
        int endHour = safeParseInt(matcher.group(3));
        int endMin = safeParseInt(matcher.group(4));

        if (!isValidTime(startHour, startMin) || !isValidTime(endHour, endMin)) return List.of();

        int startTotalMin = startHour * 60 + startMin;
        int endTotalMin = endHour * 60 + endMin;
        if (endTotalMin <= startTotalMin) return List.of();

        int firstHour = startTotalMin / 60;
        int lastExclusiveHour = (endTotalMin + 59) / 60; // ceil to include partial hour

        List<Integer> hours = new ArrayList<>();
        for (int hour = firstHour; hour < lastExclusiveHour; hour++) {
            if (hour >= 0 && hour <= 23) hours.add(hour);
        }
        return hours;
    }

    private boolean isValidTime(int hour, int min) {
        return hour >= 0 && hour <= 23 && min >= 0 && min <= 59;
    }

    private int safeParseInt(String value) {
        try {
            return Integer.parseInt(value);
        } catch (Exception ex) {
            return -1;
        }
    }
}
