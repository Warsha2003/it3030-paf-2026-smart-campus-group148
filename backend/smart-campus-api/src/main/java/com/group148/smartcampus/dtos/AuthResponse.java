package com.smartcampus.dto;

import lombok.*;

/**
 * Returned by GET /api/auth/me after the React app exchanges
 * the OAuth2 redirect token for user details.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String  accessToken;
    private String  tokenType;
    private UserDTO user;

    public static AuthResponse of(String token, UserDTO user) {
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(user)
                .build();
    }
}