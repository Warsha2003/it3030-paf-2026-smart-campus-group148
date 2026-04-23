package com.smartcampus.service;

import com.smartcampus.dto.ResourceAnalyticsDto;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.model.Resource;
import com.smartcampus.repository.ResourceRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ResourceAnalyticsServiceTest {

    @Test
    void computesTopResourcesAndPeakHoursFromAvailabilityWindows() {
        ResourceRepository repo = mock(ResourceRepository.class);
        ResourceAnalyticsService service = new ResourceAnalyticsService(repo);

        Resource r1 = new Resource();
        r1.setId("r1");
        r1.setName("Room A");
        r1.setLocation("Block 1");
        r1.setCapacity(100);
        r1.setStatus(ResourceStatus.ACTIVE);
        r1.setAvailabilityWindows(List.of("Mon 08:00-10:00")); // covers 8,9

        Resource r2 = new Resource();
        r2.setId("r2");
        r2.setName("Room B");
        r2.setLocation("Block 2");
        r2.setCapacity(50);
        r2.setStatus(ResourceStatus.ACTIVE);
        r2.setAvailabilityWindows(List.of("Tue 09:30-11:00")); // covers 9,10

        Resource r3 = new Resource();
        r3.setId("r3");
        r3.setName("Auditorium");
        r3.setLocation("Main");
        r3.setCapacity(200);
        r3.setStatus(ResourceStatus.ACTIVE);
        r3.setAvailabilityWindows(List.of("Wed 08:00-09:00")); // covers 8

        when(repo.findByStatus(ResourceStatus.ACTIVE)).thenReturn(List.of(r1, r2, r3));

        ResourceAnalyticsDto dto = service.getResourceAnalytics(2, 2);
        assertNotNull(dto);

        assertEquals(2, dto.getTopResources().size());
        assertEquals("Auditorium", dto.getTopResources().get(0).getName());
        assertEquals("Room A", dto.getTopResources().get(1).getName());

        assertEquals(2, dto.getPeakBookingHours().size());
        assertEquals(8, dto.getPeakBookingHours().get(0).getHour());
        assertEquals(2, dto.getPeakBookingHours().get(0).getResourceCount());
        assertEquals(9, dto.getPeakBookingHours().get(1).getHour());
        assertEquals(2, dto.getPeakBookingHours().get(1).getResourceCount());
    }
}
