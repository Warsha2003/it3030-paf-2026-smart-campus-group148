package com.smartcampus.exception;

/**
 * Thrown when the requested state change conflicts with existing data.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
