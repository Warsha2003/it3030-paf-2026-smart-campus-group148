package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.UpdateRoleRequest;
import com.smartcampus.dto.UserResponseDto;
import com.smartcampus.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * User Controller - handles user management (role management) operations.
 *
 * ALL endpoints in this controller are ADMIN-only.
 * This is enforced both in SecurityConfig (.requestMatchers("/api/users/**").hasRole("ADMIN"))
 * and at the method level with @PreAuthorize for double protection.
 *
 * Endpoints:
 * GET    /api/users            - Get all users (ADMIN)
 * GET    /api/users/{id}       - Get user by ID (ADMIN)
 * PATCH  /api/users/{id}/role  - Update user role (ADMIN)
 * PATCH  /api/users/{id}/toggle-active - Activate/deactivate user (ADMIN)
 *
 * Member 4 - Role Management Controller
 */
@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")  // All methods require ADMIN role
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/users
     * Get a list of all users in the system.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getAllUsers() {
        List<UserResponseDto> users = userService.getAllUsers();
        return ResponseEntity.ok(
                ApiResponse.success("Users retrieved successfully", users)
        );
    }

    /**
     * GET /api/users/{id}
     * Get a specific user by their ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseDto>> getUserById(@PathVariable String id) {
        UserResponseDto user = userService.getUserById(id);
        return ResponseEntity.ok(
                ApiResponse.success("User found", user)
        );
    }

    /**
     * PATCH /api/users/{id}/role
     * Update a user's role. Admin can change USER -> ADMIN, ADMIN -> TECHNICIAN, etc.
     *
     * Request body: { "role": "ADMIN" }
     */
    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateUserRole(
            @PathVariable String id,
            @Valid @RequestBody UpdateRoleRequest request) {

        UserResponseDto updated = userService.updateUserRole(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("User role updated to " + request.getRole(), updated)
        );
    }

    /**
     * PATCH /api/users/{id}/toggle-active
     * Activate or deactivate a user account.
     * Deactivated users cannot authenticate even with a valid token.
     */
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<UserResponseDto>> toggleUserActiveStatus(
            @PathVariable String id) {

        UserResponseDto updated = userService.toggleUserActiveStatus(id);
        String status = updated.isActive() ? "activated" : "deactivated";

        return ResponseEntity.ok(
                ApiResponse.success("User account " + status + " successfully", updated)
        );
    }
}
