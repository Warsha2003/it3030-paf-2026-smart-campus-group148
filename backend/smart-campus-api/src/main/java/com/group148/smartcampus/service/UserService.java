package com.smartcampus.service;

import com.smartcampus.dto.PagedResponse;
import com.smartcampus.dto.UpdateRoleRequest;
import com.smartcampus.dto.UserDTO;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // ── Read ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        return toDTO(findByIdOrThrow(id));
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return toDTO(user);
    }

    /** Paginated user listing for the admin panel */
    @Transactional(readOnly = true)
    public PagedResponse<UserDTO> getAllUsers(int page, int size) {
        Page<User> users = userRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        Page<UserDTO> dtoPage = users.map(this::toDTO);
        return PagedResponse.of(dtoPage);
    }

    /** Returns all users holding a specific role */
    @Transactional(readOnly = true)
    public List<UserDTO> getUsersByRole(Role role) {
        return userRepository.findAllByRolesContaining(role)
                .stream().map(this::toDTO).toList();
    }

    // ── Write ────────────────────────────────────────────────────────────────

    /**
     * Admin: replace a user's full role set.
     * Cannot remove the ADMIN role from yourself (guard in controller).
     */
    @Transactional
    public UserDTO updateRoles(Long userId, UpdateRoleRequest request) {
        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            throw new BadRequestException("A user must have at least one role.");
        }
        User user = findByIdOrThrow(userId);
        user.setRoles(request.getRoles());
        return toDTO(userRepository.save(user));
    }

    /** Admin: enable or disable a user account */
    @Transactional
    public UserDTO setEnabled(Long userId, boolean enabled) {
        User user = findByIdOrThrow(userId);
        user.setEnabled(enabled);
        log.info("User {} enabled={}", userId, enabled);
        return toDTO(userRepository.save(user));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User findByIdOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    public UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .picture(user.getPicture())
                .provider(user.getProvider())
                .roles(user.getRoles())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}