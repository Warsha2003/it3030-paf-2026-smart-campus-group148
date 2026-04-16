package com.smartcampus.model;

/**
 * Roles supported by the Smart Campus platform.
 * USER       – standard authenticated user (students, staff)
 * TECHNICIAN – can be assigned to maintenance tickets
 * MANAGER    – department manager; can approve bookings
 * ADMIN      – full system access
 */
public enum Role {
    USER,
    TECHNICIAN,
    MANAGER,
    ADMIN
}