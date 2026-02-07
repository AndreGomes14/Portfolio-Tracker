package com.portfolio.tracker.portfoliotracker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a user attempts to access a resource they do not own.
 * Maps to 403 Forbidden.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ResourceOwnershipException extends RuntimeException {

    public ResourceOwnershipException(String resource, Long resourceId, Long userId) {
        super(String.format("User %d does not own %s with id %d", userId, resource, resourceId));
    }

}
