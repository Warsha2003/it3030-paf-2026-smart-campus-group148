package smart_campus_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * Main entry point for Smart Campus API.
 *
 * @EnableMongoAuditing: Enables automatic population of @CreatedDate and @LastModifiedDate
 * fields in MongoDB documents (used in User and Notification models).
 *
 * scanBasePackages ensures Spring finds our components in both packages.
 */
@SpringBootApplication(scanBasePackages = {"smart_campus_api", "com.smartcampus"})
@EnableMongoAuditing  // Required for @CreatedDate and @LastModifiedDate to work
@EnableMongoRepositories(basePackages = "com.smartcampus.repository")
public class SmartCampusApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCampusApiApplication.class, args);
    }

}
