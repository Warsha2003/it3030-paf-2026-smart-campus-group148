package com.smartcampus.dto;

import com.smartcampus.enums.BookingStatus;
import com.smartcampus.enums.ResourceType;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public class BookingResponseDto {

    private String id;
    private String resourceId;
    private String resourceName;
    private ResourceType resourceType;
    private String resourceLocation;
    private String userId;
    private String userName;
    private String userEmail;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String purpose;
    private Integer expectedAttendees;
    private BookingStatus status;
    private String adminDecisionReason;
    private String reviewedByAdminId;
    private String reviewedByAdminName;
    private Instant reviewedAt;
    private String cancellationReason;
    private String cancelledByUserId;
    private Instant cancelledAt;
    private Instant createdAt;
    private Instant updatedAt;

    public BookingResponseDto() {
    }

    public BookingResponseDto(String id, String resourceId, String resourceName, ResourceType resourceType,
                              String resourceLocation, String userId, String userName, String userEmail,
                              LocalDate bookingDate, LocalTime startTime, LocalTime endTime, String purpose,
                              Integer expectedAttendees, BookingStatus status, String adminDecisionReason,
                              String reviewedByAdminId, String reviewedByAdminName, Instant reviewedAt,
                              String cancellationReason, String cancelledByUserId, Instant cancelledAt,
                              Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.resourceType = resourceType;
        this.resourceLocation = resourceLocation;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.bookingDate = bookingDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
        this.expectedAttendees = expectedAttendees;
        this.status = status;
        this.adminDecisionReason = adminDecisionReason;
        this.reviewedByAdminId = reviewedByAdminId;
        this.reviewedByAdminName = reviewedByAdminName;
        this.reviewedAt = reviewedAt;
        this.cancellationReason = cancellationReason;
        this.cancelledByUserId = cancelledByUserId;
        this.cancelledAt = cancelledAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public ResourceType getResourceType() {
        return resourceType;
    }

    public void setResourceType(ResourceType resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceLocation() {
        return resourceLocation;
    }

    public void setResourceLocation(String resourceLocation) {
        this.resourceLocation = resourceLocation;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public LocalDate getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDate bookingDate) {
        this.bookingDate = bookingDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public Integer getExpectedAttendees() {
        return expectedAttendees;
    }

    public void setExpectedAttendees(Integer expectedAttendees) {
        this.expectedAttendees = expectedAttendees;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getAdminDecisionReason() {
        return adminDecisionReason;
    }

    public void setAdminDecisionReason(String adminDecisionReason) {
        this.adminDecisionReason = adminDecisionReason;
    }

    public String getReviewedByAdminId() {
        return reviewedByAdminId;
    }

    public void setReviewedByAdminId(String reviewedByAdminId) {
        this.reviewedByAdminId = reviewedByAdminId;
    }

    public String getReviewedByAdminName() {
        return reviewedByAdminName;
    }

    public void setReviewedByAdminName(String reviewedByAdminName) {
        this.reviewedByAdminName = reviewedByAdminName;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCancelledByUserId() {
        return cancelledByUserId;
    }

    public void setCancelledByUserId(String cancelledByUserId) {
        this.cancelledByUserId = cancelledByUserId;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
