package com.group148.smartcampus.config;

import com.group148.smartcampus.entity.Resource;
import com.group148.smartcampus.entity.User;
import com.group148.smartcampus.enums.ResourceStatus;
import com.group148.smartcampus.repository.resource.ResourceRepository;
import com.group148.smartcampus.repository.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class MongoDataSeeder {

    @Bean
    CommandLineRunner seedMongoData(ResourceRepository resourceRepository, UserRepository userRepository) {
        return args -> {
            List<Resource> resources = List.of(
                    new Resource(1L, "Conference Room A", "MEETING_ROOM", 10, "Block A", ResourceStatus.ACTIVE),
                    new Resource(2L, "Meeting Room B", "MEETING_ROOM", 8, "Block B", ResourceStatus.ACTIVE),
                    new Resource(3L, "Lecture Hall 1", "LECTURE_HALL", 60, "Main Building", ResourceStatus.ACTIVE),
                    new Resource(4L, "Study Room 101", "STUDY_ROOM", 4, "Library", ResourceStatus.ACTIVE),
                    new Resource(5L, "Lab Room 202", "LAB", 25, "Engineering Wing", ResourceStatus.ACTIVE)
            );

            for (Resource resource : resources) {
                if (!resourceRepository.existsById(resource.getId())) {
                    resourceRepository.save(resource);
                }
            }

            List<User> users = List.of(
                    new User(1L, "John Doe", "john.doe@smartcampus.local", "USER"),
                    new User(2L, "Jane Smith", "jane.smith@smartcampus.local", "USER"),
                    new User(3L, "Bob Johnson", "bob.johnson@smartcampus.local", "USER"),
                    new User(99L, "Admin User", "admin@smartcampus.local", "ADMIN")
            );

            for (User user : users) {
                if (!userRepository.existsById(user.getId())) {
                    userRepository.save(user);
                }
            }
        };
    }
}
