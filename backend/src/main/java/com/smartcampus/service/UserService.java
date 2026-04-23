package com.smartcampus.service;

import com.smartcampus.dto.UpdateRoleRequest;
import com.smartcampus.dto.UserResponseDto;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * User Service - handles user management operations (role management).
 *
 * Key features:
 * - Get all users (admin)
 * - Update a user's role (admin)
 * - Toggle user active status (admin)
 *
 * Member 4 - Role Management
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Get all users in the system.
     * Admin-only: used for the user management dashboard.
     */
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific user by their MongoDB ID.
     * Throws ResourceNotFoundException if not found (returns 404).
     */
    public UserResponseDto getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapToDto(user);
    }

    /**
     * Update a user's role.
     * Admin-only: e.g., promote USER to ADMIN or assign TECHNICIAN role.
     *
     * @param userId  ID of the user to update
     * @param request DTO containing the new role
     */
    public UserResponseDto updateUserRole(String userId, UpdateRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setRole(request.getRole());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return mapToDto(user);
    }

    /**
     * Toggle a user's active status (activate or deactivate).
     * Deactivated users cannot log in (JwtAuthenticationFilter checks isActive()).
     *
     * @param userId ID of the user to toggle
     */
    public UserResponseDto toggleUserActiveStatus(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setActive(!user.isActive()); // Flip the flag
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return mapToDto(user);
    }

    /**
     * Map User model to DTO (avoid exposing internal fields)
     */
    private UserResponseDto mapToDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getProfilePicture(),
                user.getAuthProvider(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
