package com.smartcampus.exception;

/**
 * Thrown when a user tries to access a resource or perform an action
 * they are not authorized for (e.g., non-admin accessing admin endpoints).
 * The GlobalExceptionHandler catches this and returns HTTP 403.
 *
 * Member 4 - Exception Handling
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
