package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.LoginRequestDto;
import com.smartcampus.dto.OAuthLoginRequest;
import com.smartcampus.dto.UserResponseDto;
import com.smartcampus.security.CustomUserDetails;
import com.smartcampus.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Auth Controller - handles authentication-related endpoints.
 *
 * Endpoints:
 * POST /api/auth/oauth-success - Receive Google token, return JWT (PUBLIC)
 * POST /api/auth/login         - Traditional email/password login (PUBLIC)
 * GET  /api/auth/me            - Get current logged-in user profile (AUTHENTICATED)
 *
 * Member 4 - Auth Controller
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/login
     * Traditional email and password login, specifically for Admin.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, String>>> loginUser(@Valid @RequestBody LoginRequestDto loginRequest) {
        try {
            String token = authService.login(loginRequest);
            return ResponseEntity.ok(ApiResponse.success("Login successful", Map.of("token", token)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/auth/me
     *
     * Returns the currently authenticated user's profile.
     * The user is extracted from the JWT token (via JwtAuthenticationFilter
     * and the @AuthenticationPrincipal annotation).
     *
     * Requires: Authorization: Bearer <jwt-token>
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponseDto>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        UserResponseDto userDto = authService.mapToDto(userDetails.getUser());

        return ResponseEntity.ok(
                ApiResponse.success("User profile retrieved", userDto)
        );
    }
}
