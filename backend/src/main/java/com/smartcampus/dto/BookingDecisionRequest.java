package com.smartcampus.dto;

import com.smartcampus.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class BookingDecisionRequest {

    @NotNull(message = "status is required")
    private BookingStatus status;

    @Size(max = 500, message = "reason cannot exceed 500 characters")
    private String reason;

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
