package com.smartcampus.dto;

import com.smartcampus.model.Role;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Read-only projection of a {@link com.smartcampus.model.User} entity.
 * Sent to the React client – never exposes provider credentials.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserDTO {
    private Long            id;
    private String          email;
    private String          name;
    private String          picture;
    private String          provider;
    private Set<Role>       roles;
    private boolean         enabled;
    private LocalDateTime   createdAt;
}