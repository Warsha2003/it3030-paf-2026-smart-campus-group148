package com.smartcampus.security;

import com.smartcampus.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Wraps our User model so Spring Security can use it for authentication.
 *
 * Spring Security works with UserDetails internally. By implementing this interface,
 * we connect our User model to Spring Security's auth mechanism.
 *
 * Key concept for viva:
 * - Spring Security needs a UserDetails object to work with
 * - We wrap our User model in this class
 * - The "ROLE_" prefix is required by Spring Security for role-based authorization
 *
 * Member 4 - Security Layer
 */
public class CustomUserDetails implements UserDetails {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    /**
     * Returns the user's role as a Spring Security authority.
     * Spring Security requires "ROLE_" prefix for @PreAuthorize("hasRole('ADMIN')") to work.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public String getPassword() {
        return null; // No password - we use OAuth 2.0 / JWT
    }

    @Override
    public String getUsername() {
        return user.getEmail(); // Email is the unique identifier
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return user.isActive(); }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return user.isActive(); }

    /** Expose the underlying User object for use in controllers/services */
    public User getUser() {
        return user;
    }
}
