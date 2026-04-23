package com.smartcampus.util;

import com.smartcampus.model.Resource;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class ResourceAvailabilityUtils {

    private static final Pattern WINDOW_PATTERN = Pattern.compile(
            "(?i)^\\s*(?:(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\\s+)?(\\d{1,2}:\\d{2})\\s*-\\s*(\\d{1,2}:\\d{2})\\s*$"
    );
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("H:mm");

    private ResourceAvailabilityUtils() {
    }

    public static List<String> normalizeWindows(List<String> windows) {
        if (windows == null) {
            return List.of();
        }
        return windows.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    public static LocalTime deriveAvailabilityStart(List<String> windows) {
        return parseWindows(windows).stream()
                .map(ParsedWindow::start)
                .min(LocalTime::compareTo)
                .orElse(null);
    }

    public static LocalTime deriveAvailabilityEnd(List<String> windows) {
        return parseWindows(windows).stream()
                .map(ParsedWindow::end)
                .max(LocalTime::compareTo)
                .orElse(null);
    }

    public static LocalTime resolveDisplayAvailabilityStart(Resource resource, LocalDate bookingDate) {
        List<ParsedWindow> windows = parseWindows(resource.getAvailabilityWindows());
        if (windows.isEmpty()) {
            return resource.getAvailabilityStart();
        }

        List<ParsedWindow> applicable = filterApplicableWindows(windows, bookingDate);
        if (!applicable.isEmpty()) {
            return applicable.stream()
                    .map(ParsedWindow::start)
                    .min(LocalTime::compareTo)
                    .orElse(resource.getAvailabilityStart());
        }

        return windows.stream()
                .map(ParsedWindow::start)
                .min(LocalTime::compareTo)
                .orElse(resource.getAvailabilityStart());
    }

    public static LocalTime resolveDisplayAvailabilityEnd(Resource resource, LocalDate bookingDate) {
        List<ParsedWindow> windows = parseWindows(resource.getAvailabilityWindows());
        if (windows.isEmpty()) {
            return resource.getAvailabilityEnd();
        }

        List<ParsedWindow> applicable = filterApplicableWindows(windows, bookingDate);
        if (!applicable.isEmpty()) {
            return applicable.stream()
                    .map(ParsedWindow::end)
                    .max(LocalTime::compareTo)
                    .orElse(resource.getAvailabilityEnd());
        }

        return windows.stream()
                .map(ParsedWindow::end)
                .max(LocalTime::compareTo)
                .orElse(resource.getAvailabilityEnd());
    }

    public static boolean isWithinAvailability(Resource resource,
                                               LocalDate bookingDate,
                                               LocalTime startTime,
                                               LocalTime endTime) {
        List<ParsedWindow> windows = parseWindows(resource.getAvailabilityWindows());
        if (!windows.isEmpty()) {
            DayOfWeek requestedDay = bookingDate != null ? bookingDate.getDayOfWeek() : null;
            return windows.stream().anyMatch(window -> window.matches(requestedDay, startTime, endTime));
        }

        if (resource.getAvailabilityStart() != null && startTime.isBefore(resource.getAvailabilityStart())) {
            return false;
        }
        if (resource.getAvailabilityEnd() != null && endTime.isAfter(resource.getAvailabilityEnd())) {
            return false;
        }
        return true;
    }

    public static List<Integer> getCoveredHours(String window) {
        ParsedWindow parsedWindow = parseWindow(window);
        if (parsedWindow == null) {
            return List.of();
        }

        int startTotalMin = parsedWindow.start().getHour() * 60 + parsedWindow.start().getMinute();
        int endTotalMin = parsedWindow.end().getHour() * 60 + parsedWindow.end().getMinute();
        if (endTotalMin <= startTotalMin) {
            return List.of();
        }

        int firstHour = startTotalMin / 60;
        int lastExclusiveHour = (endTotalMin + 59) / 60;

        return java.util.stream.IntStream.range(firstHour, lastExclusiveHour)
                .filter(hour -> hour >= 0 && hour <= 23)
                .boxed()
                .toList();
    }

    private static List<ParsedWindow> parseWindows(List<String> windows) {
        return normalizeWindows(windows).stream()
                .map(ResourceAvailabilityUtils::parseWindow)
                .filter(Objects::nonNull)
                .toList();
    }

    private static List<ParsedWindow> filterApplicableWindows(List<ParsedWindow> windows, LocalDate bookingDate) {
        if (bookingDate == null) {
            return windows;
        }

        DayOfWeek requestedDay = bookingDate.getDayOfWeek();
        return windows.stream()
                .filter(window -> window.appliesOn(requestedDay))
                .toList();
    }

    private static ParsedWindow parseWindow(String window) {
        if (window == null) {
            return null;
        }

        Matcher matcher = WINDOW_PATTERN.matcher(window);
        if (!matcher.matches()) {
            return null;
        }

        LocalTime start = parseTime(matcher.group(2));
        LocalTime end = parseTime(matcher.group(3));
        if (start == null || end == null || !start.isBefore(end)) {
            return null;
        }

        return new ParsedWindow(parseDay(matcher.group(1)), start, end);
    }

    private static LocalTime parseTime(String value) {
        try {
            return LocalTime.parse(value, TIME_FORMATTER);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private static DayOfWeek parseDay(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String token = value.trim().toLowerCase(Locale.ROOT);
        if (token.startsWith("mon")) {
            return DayOfWeek.MONDAY;
        }
        if (token.startsWith("tue")) {
            return DayOfWeek.TUESDAY;
        }
        if (token.startsWith("wed")) {
            return DayOfWeek.WEDNESDAY;
        }
        if (token.startsWith("thu")) {
            return DayOfWeek.THURSDAY;
        }
        if (token.startsWith("fri")) {
            return DayOfWeek.FRIDAY;
        }
        if (token.startsWith("sat")) {
            return DayOfWeek.SATURDAY;
        }
        if (token.startsWith("sun")) {
            return DayOfWeek.SUNDAY;
        }
        return null;
    }

    private record ParsedWindow(DayOfWeek dayOfWeek, LocalTime start, LocalTime end) {

        private boolean appliesOn(DayOfWeek requestedDay) {
            return dayOfWeek == null || dayOfWeek == requestedDay;
        }

        private boolean matches(DayOfWeek requestedDay, LocalTime requestedStart, LocalTime requestedEnd) {
            if (!appliesOn(requestedDay)) {
                return false;
            }
            return !requestedStart.isBefore(start) && !requestedEnd.isAfter(end);
        }
    }
}
