package com.portfolio.tracker.portfoliotracker.service;

import com.portfolio.tracker.portfoliotracker.dto.AuthRequest;
import com.portfolio.tracker.portfoliotracker.dto.AuthResponse;
import com.portfolio.tracker.portfoliotracker.dto.RegisterRequest;
import com.portfolio.tracker.portfoliotracker.entity.User;
import com.portfolio.tracker.portfoliotracker.repository.UserRepository;
import com.portfolio.tracker.portfoliotracker.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication business logic — registration and login.
 * Controllers remain thin; all logic lives here (SOLID / SRP).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Register a new user and return a signed JWT.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .email(request.email())
                .displayName(request.displayName())
                .password(passwordEncoder.encode(request.password()))
                .build();

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);
        log.info("Registered new user: {} (id={})", saved.getEmail(), saved.getId());

        return new AuthResponse(token, saved.getId(), saved.getEmail(), saved.getDisplayName());
    }

    /**
     * Authenticate an existing user and return a signed JWT.
     */
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        String token = jwtService.generateToken(user);
        log.info("User logged in: {}", user.getEmail());

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName());
    }
}
