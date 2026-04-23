package com.smartcampus.config;

import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.enums.Role;
import com.smartcampus.model.Resource;
import com.smartcampus.model.User;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;

/**
 * Seeds the database with sample users when the application starts.
 * This is useful for testing and demonstration during viva.
 *
 * IMPORTANT: This only runs in development. In production, remove or disable this.
 * It checks if users already exist before inserting to avoid duplicates.
 *
 * Seeds:
 * - An ADMIN user (pafproject@gmail.com with traditional password)
 * - A regular USER (student@smartcampus.edu)
 * - A TECHNICIAN (tech@smartcampus.edu)
 *
 * Member 4 - Sample Data
 */
@Configuration
public class DataSeeder {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    @Profile("!test")
    public CommandLineRunner seedData(UserRepository userRepository,
                                      ResourceRepository resourceRepository,
                                      PasswordEncoder passwordEncoder) {
        return args -> {
            seedResources(resourceRepository);

            // Seed or Update ADMIN user
            java.util.Optional<User> existingAdmin = userRepository.findByEmail("pafprojectt@gmail.com");
            if (existingAdmin.isPresent()) {
                User admin = existingAdmin.get();
                if (admin.getPassword() == null || admin.getRole() != Role.ADMIN) {
                    admin.setPassword(passwordEncoder.encode("paf@12345"));
                    admin.setRole(Role.ADMIN);
                    userRepository.save(admin);
                    logger.info("Updated existing OAuth user pafproject@gmail.com with Admin password & Role.");
                }
            } else {
                User admin = new User(
                        null,
                        "System Admin",
                        "pafprojectt@gmail.com",
                        passwordEncoder.encode("paf@12345"), // HASHED Secure password
                        "https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff",
                        "CREDENTIALS",
                        Role.ADMIN,
                        true,
                        Instant.now(),
                        Instant.now()
                );
                userRepository.save(admin);
                logger.info("Seeded ADMIN user: pafproject@gmail.com");
            }

            // Seed regular USER
            if (!userRepository.existsByEmail("student@smartcampus.edu")) {
                User student = new User(
                        null,
                        "John Student",
                        "student@smartcampus.edu",
                        null, // OAuth users don't have passwords
                        "https://ui-avatars.com/api/?name=John+Student&background=10b981&color=fff",
                        "GOOGLE",
                        Role.USER,
                        true,
                        Instant.now(),
                        Instant.now()
                );
                userRepository.save(student);
                logger.info("Seeded USER: student@smartcampus.edu");
            }

            // Seed TECHNICIAN user
            if (!userRepository.existsByEmail("tech@smartcampus.edu")) {
                User technician = new User(
                        null,
                        "Jane Technician",
                        "tech@smartcampus.edu",
                        null,
                        "https://ui-avatars.com/api/?name=Jane+Tech&background=f59e0b&color=fff",
                        "GOOGLE",
                        Role.TECHNICIAN,
                        true,
                        Instant.now(),
                        Instant.now()
                );
                userRepository.save(technician);
                logger.info("Seeded TECHNICIAN: tech@smartcampus.edu");
            }

            logger.info("Data seeding complete. Total users: {}", userRepository.count());
        };
    }

    private void seedResources(ResourceRepository resourceRepository) {
        Instant now = Instant.now();
        List<Resource> resources = List.of(
                new Resource(null, "Conference Room A", ResourceType.MEETING_ROOM, 10, "Block A",
                        "Collaborative meeting room for group work and staff sessions.",
                        ResourceStatus.ACTIVE, List.of("08:00-18:00"),
                        LocalTime.of(8, 0), LocalTime.of(18, 0), now, now),
                new Resource(null, "Lecture Hall 1", ResourceType.LECTURE_HALL, 60, "Main Building",
                        "Tiered lecture hall suitable for classes and seminars.",
                        ResourceStatus.ACTIVE, List.of("08:00-18:00"),
                        LocalTime.of(8, 0), LocalTime.of(18, 0), now, now),
                new Resource(null, "Lab Room 202", ResourceType.LAB, 25, "Engineering Wing",
                        "Computer lab with networking and hardware benches.",
                        ResourceStatus.ACTIVE, List.of("09:00-17:00"),
                        LocalTime.of(9, 0), LocalTime.of(17, 0), now, now),
                new Resource(null, "Study Room 101", ResourceType.STUDY_ROOM, 4, "Library",
                        "Quiet study room for focused academic work.",
                        ResourceStatus.ACTIVE, List.of("08:00-20:00"),
                        LocalTime.of(8, 0), LocalTime.of(20, 0), now, now),
                new Resource(null, "Projector PX-01", ResourceType.EQUIPMENT, 1, "Media Center",
                        "Portable projector for classroom and event use.",
                        ResourceStatus.OUT_OF_SERVICE, List.of("08:00-17:00"),
                        LocalTime.of(8, 0), LocalTime.of(17, 0), now, now)
        );

        for (Resource resource : resources) {
            java.util.Optional<Resource> existing = resourceRepository.findByName(resource.getName());
            if (existing.isEmpty()) {
                resourceRepository.save(resource);
                logger.info("Seeded resource: {}", resource.getName());
                continue;
            }

            if (requiresResourceMigration(existing.get(), resource)) {
                resourceRepository.deleteByName(resource.getName());
                resourceRepository.save(resource);
                logger.info("Migrated legacy resource: {}", resource.getName());
            }
        }
    }

    private boolean requiresResourceMigration(Resource existing, Resource expected) {
        return existing.getAvailabilityStart() == null
                || existing.getAvailabilityEnd() == null
                || existing.getAvailabilityWindows() == null
                || existing.getAvailabilityWindows().isEmpty()
                || existing.getType() != expected.getType()
                || !java.util.Objects.equals(existing.getCapacity(), expected.getCapacity())
                || !java.util.Objects.equals(existing.getLocation(), expected.getLocation())
                || existing.getStatus() != expected.getStatus();
    }
}
