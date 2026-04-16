package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.AuthResponse;
import com.smartcampus.dto.UserDTO;
import com.smartcampus.security.UserPrincipal;
import com.smartcampus.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Module E – Authentication endpoints.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Method │ Path               │ Access │ Description                  │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │  GET    │ /api/auth/me       │ AUTH   │ Current user profile + roles │
 * │  POST   │ /api/auth/logout   │ AUTH   │ Client-side token discard    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * The actual OAuth2 flow is handled by Spring Security + our handlers.
 * After the redirect the React client calls GET /api/auth/me with the
 * token to confirm identity and receive the full user object.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    /**
     * GET /api/auth/me
     * Returns the currently authenticated user's profile and role set.
     * The React app calls this on startup to restore the auth context.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {

        UserDTO user = userService.getUserById(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Authenticated", user));
    }

    /**
     * POST /api/auth/logout
     * JWT is stateless – the server cannot invalidate a token.
     * This endpoint exists so the client can signal intent (for audit logs
     * or future token-blacklist implementation) and to clear any server-side
     * state (e.g., refresh tokens when added later).
     *
     * The React client must also clear the token from localStorage.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserPrincipal principal) {

        // Future: add token to a blacklist / revoke refresh token
        return ResponseEntity.ok(
                ApiResponse.success("Logged out successfully. Please clear your local token.", null));
    }
}