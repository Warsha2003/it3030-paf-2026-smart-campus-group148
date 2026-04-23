package com.smartcampus.config;

import org.springframework.context.annotation.Configuration;

/**
 * MongoDB Configuration.
 *
 * Auditing is enabled globally in the main application class, so this config
 * remains available for future Mongo-related bean definitions if needed.
 */
@Configuration
public class MongoConfig {
    // Spring Boot auto-configures the MongoDB connection from application.properties.
}
