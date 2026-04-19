package com.smartcampus.controller;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/health", "/health"})
public class HealthController {

    private final MongoTemplate mongoTemplate;

    public HealthController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "smart-campus-api",
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/mongo")
    public ResponseEntity<Map<String, Object>> mongoHealth() {
        try {
            mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));

            return ResponseEntity.ok(Map.of(
                    "status", "UP",
                    "database", "mongo",
                    "timestamp", Instant.now().toString()
            ));
        } catch (Exception ex) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("status", "DOWN");
            body.put("database", "mongo");
            body.put("message", ex.getMessage());
            body.put("timestamp", Instant.now().toString());

            return ResponseEntity.status(503).body(body);
        }
    }
}
