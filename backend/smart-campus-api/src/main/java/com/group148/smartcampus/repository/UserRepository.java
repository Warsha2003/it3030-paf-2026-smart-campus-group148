package com.smartcampus.repository;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    boolean existsByEmail(String email);

    /** Find all users that hold a specific role (used by admin panel) */
    List<User> findAllByRolesContaining(Role role);

    /** Paginated user listing for admin */
    Page<User> findAll(Pageable pageable);
}