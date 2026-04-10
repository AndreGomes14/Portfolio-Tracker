package com.portfolio.tracker.portfoliotracker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class ResourceOwnershipException extends RuntimeException {

    public ResourceOwnershipException(String resource, Long resourceId, Long userId) {
        super(String.format("User %d does not own %s with id %d", userId, resource, resourceId));
    }

}
