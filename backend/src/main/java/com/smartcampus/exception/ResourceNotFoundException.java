package com.smartcampus.exception;

/**
 * Thrown when a requested resource (User, Notification) is not found in MongoDB.
 * The GlobalExceptionHandler catches this and returns HTTP 404.
 *
 * Member 4 - Exception Handling
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, String fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
