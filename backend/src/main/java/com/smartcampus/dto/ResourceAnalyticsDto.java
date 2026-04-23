package com.smartcampus.dto;

import java.util.List;

/**
 * Admin analytics payload derived from Resource catalogue data.
 *
 * Note: "peakBookingHours" is computed from resource availability windows
 * (since no booking module exists yet).
 */
public class ResourceAnalyticsDto {

    private List<TopResourceDto> topResources;
    private List<PeakHourDto> peakBookingHours;

    public ResourceAnalyticsDto() {}

    public ResourceAnalyticsDto(List<TopResourceDto> topResources, List<PeakHourDto> peakBookingHours) {
        this.topResources = topResources;
        this.peakBookingHours = peakBookingHours;
    }

    public List<TopResourceDto> getTopResources() {
        return topResources;
    }

    public void setTopResources(List<TopResourceDto> topResources) {
        this.topResources = topResources;
    }

    public List<PeakHourDto> getPeakBookingHours() {
        return peakBookingHours;
    }

    public void setPeakBookingHours(List<PeakHourDto> peakBookingHours) {
        this.peakBookingHours = peakBookingHours;
    }

    public static class TopResourceDto {
        private String id;
        private String name;
        private String location;
        private Integer capacity;

        public TopResourceDto() {}

        public TopResourceDto(String id, String name, String location, Integer capacity) {
            this.id = id;
            this.name = name;
            this.location = location;
            this.capacity = capacity;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public Integer getCapacity() { return capacity; }
        public void setCapacity(Integer capacity) { this.capacity = capacity; }
    }

    public static class PeakHourDto {
        private int hour;
        private int resourceCount;

        public PeakHourDto() {}

        public PeakHourDto(int hour, int resourceCount) {
            this.hour = hour;
            this.resourceCount = resourceCount;
        }

        public int getHour() { return hour; }
        public void setHour(int hour) { this.hour = hour; }

        public int getResourceCount() { return resourceCount; }
        public void setResourceCount(int resourceCount) { this.resourceCount = resourceCount; }
    }
}
