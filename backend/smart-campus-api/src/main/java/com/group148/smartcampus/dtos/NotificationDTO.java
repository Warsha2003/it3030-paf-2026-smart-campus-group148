package com.smartcampus.dto;

import com.smartcampus.model.NotificationType;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Read-only projection of a {@link com.smartcampus.model.Notification} entity.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationDTO {
    private Long             id;
    private String           title;
    private String           message;
    private NotificationType type;
    private String           link;
    private Long             referenceId;
    private boolean          read;
    private LocalDateTime    createdAt;
}