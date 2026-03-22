package com.portfolio.tracker.portfoliotracker.dto;

public record AuthResponse(
        String token,
        Long userId,
        String email,
        String displayName
) {}
