package com.smartcampus.config;

import com.smartcampus.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // NEW
import org.springframework.security.crypto.password.PasswordEncoder; // NEW
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Security Configuration for Smart Campus API.
 *
 * Key concepts:
 * - STATELESS: No server-side sessions (we use JWT instead)
 * - JWT Filter: Our JwtAuthenticationFilter runs before Spring Security's default filter
 * - CORS: Configured to allow requests from React frontend (localhost:5173)
 * - Method Security: @PreAuthorize annotations work because of @EnableMethodSecurity
 *
 * Endpoint access rules:
 * - Public: /api/health/**, /api/auth/login, /api/auth/oauth-success 
 * - ADMIN only: /api/users/** (role management)
 * - Authenticated users: /api/auth/me, /api/notifications/**
 *
 * Member 4 - Security Configuration
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // Enables @PreAuthorize, @PostAuthorize on controller methods
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final com.smartcampus.security.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          com.smartcampus.security.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF - not needed for stateless REST APIs
            .csrf(csrf -> csrf.disable())

            // Configure CORS using our corsConfigurationSource bean
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // STATELESS: No HTTP sessions (we use JWT)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Configure Backend-Driven OAuth2 Login
            .oauth2Login(oauth2 -> oauth2
                // When OAuth is successful, this handler checks DB, generates JWT, and sends 302 Redirect to Frontend
                .successHandler(oAuth2AuthenticationSuccessHandler)
            )

            // Define which endpoints are public vs protected
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - no token required
                .requestMatchers("/api/health/**", "/health/**", "/error", "/api/auth/login").permitAll()

                // ADMIN only endpoint - role management
                .requestMatchers("/api/users/**").hasRole("ADMIN")

                // All other requests require authentication
                .anyRequest().authenticated()
            )

            // Add our JWT filter BEFORE the default username/password filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS configuration - allows React frontend to call our API.
     * Without this, the browser would block cross-origin requests.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow requests from the React dev server
        config.setAllowedOrigins(List.of(frontendUrl, "http://localhost:5173", "http://localhost:3000"));

        // Allow these HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Allow these request headers (Authorization is needed for JWT)
        config.setAllowedHeaders(List.of("*"));

        // Allow credentials (cookies, authorization headers)
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
