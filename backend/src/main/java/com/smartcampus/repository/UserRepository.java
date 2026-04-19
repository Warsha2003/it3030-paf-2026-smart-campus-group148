package com.smartcampus.repository;

import com.smartcampus.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for User MongoDB operations.
 * Spring Data MongoDB auto-generates the implementation at runtime.
 *
 * Member 4 - Auth & Role Management
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Find a user by their email address.
     * Used during OAuth login to check if user already exists.
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if a user with the given email exists.
     * Used to decide whether to create a new user or update existing.
     */
    boolean existsByEmail(String email);
}
