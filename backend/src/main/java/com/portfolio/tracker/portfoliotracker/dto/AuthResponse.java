package com.portfolio.tracker.portfoliotracker.dto;

/**
 * Authentication response containing the JWT token and user details.
 * Uses a Java 21 Record for immutability and clean code.
 */
public record AuthResponse(
        String token,
        Long userId,
        String email,
        String displayName
) {}
