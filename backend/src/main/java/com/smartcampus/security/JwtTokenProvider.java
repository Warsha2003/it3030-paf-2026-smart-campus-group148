package com.smartcampus.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * Utility class for JWT (JSON Web Token) operations.
 *
 * What is a JWT?
 * - A compact, URL-safe token that contains encoded claims (data)
 * - Consists of 3 parts: Header.Payload.Signature
 * - We sign it with a secret key so we can verify it wasn't tampered with
 *
 * Flow:
 * 1. User logs in with Google -> we create a JWT with their userId and role
 * 2. Frontend stores this JWT in localStorage
 * 3. On every request, frontend sends "Authorization: Bearer <jwt>"
 * 4. JwtAuthenticationFilter validates the JWT and sets the SecurityContext
 *
 * Member 4 - JWT Security
 */
@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    /**
     * Create the signing key from the Base64-encoded secret in application.properties.
     * We use HMAC-SHA512 for strong security.
     */
    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generate a JWT token for an authenticated user.
     *
     * @param userId  User's MongoDB ID (stored as "sub" claim)
     * @param email   User's email (stored as "email" claim for convenience)
     * @param role    User's role (stored as "role" claim for authorization)
     * @return signed JWT string
     */
    public String generateToken(String userId, String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(userId)              // "sub" claim: the user's MongoDB ID
                .claim("email", email)           // Custom claim: email
                .claim("role", role)             // Custom claim: role (USER, ADMIN, TECHNICIAN)
                .setIssuedAt(now)                // When token was issued
                .setExpiration(expiryDate)       // When token expires
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Extract the userId (subject) from a JWT token.
     */
    public String getUserIdFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Validate a JWT token.
     * Returns true if valid, false if expired, malformed, or tampered.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            logger.warn("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.warn("JWT token is unsupported: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.warn("Invalid JWT token: {}", e.getMessage());
        } catch (SignatureException e) {
            logger.warn("Invalid JWT signature: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.warn("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }
}
