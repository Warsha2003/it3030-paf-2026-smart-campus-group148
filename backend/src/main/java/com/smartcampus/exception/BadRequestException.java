package com.smartcampus.exception;

/**
 * Thrown when a request is syntactically valid but fails business validation.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
