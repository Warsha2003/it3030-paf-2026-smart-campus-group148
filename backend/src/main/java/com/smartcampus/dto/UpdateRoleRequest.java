package com.smartcampus.dto;

import com.smartcampus.enums.Role;
import jakarta.validation.constraints.NotNull;

public class UpdateRoleRequest {

    @NotNull(message = "Role is required. Valid values are: USER, ADMIN, TECHNICIAN")
    private Role role;

    public UpdateRoleRequest() {}

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
