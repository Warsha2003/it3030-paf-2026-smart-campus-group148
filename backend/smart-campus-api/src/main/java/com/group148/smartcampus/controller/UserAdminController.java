package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.PagedResponse;
import com.smartcampus.dto.UpdateRoleRequest;
import com.smartcampus.dto.UserDTO;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.model.Role;
import com.smartcampus.security.UserPrincipal;
import com.smartcampus.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Module E – Admin user-management endpoints.
 * All routes require ROLE_ADMIN (enforced via @PreAuthorize).
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path                               │ Description                │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │ GET    │ /api/admin/users                   │ Paginated user list        │
 * │ GET    │ /api/admin/users/{id}              │ Single user detail         │
 * │ GET    │ /api/admin/users/by-role/{role}    │ Users with a given role    │
 * │ PATCH  │ /api/admin/users/{id}/roles        │ Update user roles          │
 * │ PATCH  │ /api/admin/users/{id}/disable      │ Disable a user account     │
 * │ PATCH  │ /api/admin/users/{id}/enable       │ Re-enable a user account   │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserService userService;

    // ── GET /api/admin/users?page=0&size=20 ──────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<UserDTO>>> getAllUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(
                ApiResponse.success(userService.getAllUsers(page, size)));
    }

    // ── GET /api/admin/users/{id} ────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    // ── GET /api/admin/users/by-role/{role} ──────────────────────────────────
    @GetMapping("/by-role/{role}")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(
                ApiResponse.success(userService.getUsersByRole(role)));
    }

    // ── PATCH /api/admin/users/{id}/roles ────────────────────────────────────
    /**
     * Replace a user's role set.
     * Guard: an admin cannot remove ADMIN from their own account.
     */
    @PatchMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<UserDTO>> updateRoles(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (id.equals(principal.getId()) && !request.getRoles().contains(Role.ADMIN)) {
            throw new BadRequestException("You cannot remove the ADMIN role from your own account.");
        }
        return ResponseEntity.ok(
                ApiResponse.success("Roles updated.", userService.updateRoles(id, request)));
    }

    // ── PATCH /api/admin/users/{id}/disable ──────────────────────────────────
    @PatchMapping("/{id}/disable")
    public ResponseEntity<ApiResponse<UserDTO>> disableUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (id.equals(principal.getId())) {
            throw new BadRequestException("You cannot disable your own account.");
        }
        return ResponseEntity.ok(
                ApiResponse.success("User disabled.", userService.setEnabled(id, false)));
    }

    // ── PATCH /api/admin/users/{id}/enable ───────────────────────────────────
    @PatchMapping("/{id}/enable")
    public ResponseEntity<ApiResponse<UserDTO>> enableUser(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("User enabled.", userService.setEnabled(id, true)));
    }
}