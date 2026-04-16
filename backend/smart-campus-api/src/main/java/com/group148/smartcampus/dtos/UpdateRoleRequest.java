package com.smartcampus.dto;

import com.smartcampus.model.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;

/**
 * Request body for PATCH /api/admin/users/{id}/roles
 */
@Data
public class UpdateRoleRequest {

    @NotNull(message = "Roles must not be null")
    private Set<Role> roles;
}