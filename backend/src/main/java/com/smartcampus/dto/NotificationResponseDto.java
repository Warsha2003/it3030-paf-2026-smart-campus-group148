package com.smartcampus.dto;

import com.smartcampus.enums.NotificationType;
import java.time.Instant;

public class NotificationResponseDto {
    private String id;
    private String title;
    private String message;
    private NotificationType type;
    private String relatedEntityId;
    private boolean isRead;
    private Instant createdAt;

    public NotificationResponseDto() {}

    public NotificationResponseDto(String id, String title, String message, NotificationType type, String relatedEntityId, boolean isRead, Instant createdAt) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.type = type;
        this.relatedEntityId = relatedEntityId;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    
    public String getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(String relatedEntityId) { this.relatedEntityId = relatedEntityId; }
    
    public boolean getIsRead() { return isRead; } // Using boolean name 'isRead' might map to getIsRead or isRead depending on serialization. Let's use standard.
    public void setIsRead(boolean read) { isRead = read; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
