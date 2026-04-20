package com.smartcampus.security;

import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * JWT Authentication Filter - runs on EVERY incoming HTTP request.
 *
 * What this does:
 * 1. Extracts the JWT from the "Authorization: Bearer <token>" header
 * 2. Validates the token using JwtTokenProvider
 * 3. Loads the user from MongoDB
 * 4. Sets the authenticated user in Spring Security's SecurityContext
 *
 * After this filter runs successfully, Spring Security knows WHO is making the request.
 * Then it can enforce @PreAuthorize("hasRole('ADMIN')") etc.
 *
 * Extends OncePerRequestFilter to ensure it runs exactly once per request.
 *
 * Member 4 - Security Layer
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // Step 1: Extract JWT from Authorization header
            String jwt = getJwtFromRequest(request);

            // Step 2: Validate the token
            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {

                // Step 3: Get userId from token and load user from DB
                String userId = jwtTokenProvider.getUserIdFromToken(jwt);
                Optional<User> userOptional = userRepository.findById(userId);

                if (userOptional.isPresent()) {
                    User user = userOptional.get();

                    // Step 4: Create authentication object and set it in SecurityContext
                    CustomUserDetails userDetails = new CustomUserDetails(user);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,                          // credentials (not needed for JWT)
                                    userDetails.getAuthorities()   // user's roles/permissions
                            );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // This tells Spring Security "this user is authenticated"
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            logger.error("Cannot set user authentication: {}", ex.getMessage());
        }

        // Continue to next filter in the chain regardless
        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token from "Authorization: Bearer <token>" header.
     * Returns null if header is missing or doesn't start with "Bearer ".
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Remove "Bearer " prefix
        }
        return null;
    }
}
