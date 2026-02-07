package com.portfolio.tracker.portfoliotracker.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility to generate BCrypt password hashes (e.g. for seeding users or scripts).
 * Run from IDE or: mvn exec:java -Dexec.mainClass="...util.PasswordHashGenerator" -Dexec.args="yourpassword"
 */
public class PasswordHashGenerator {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = args.length > 0 ? args[0] : "password";
        String hash = encoder.encode(password);

        System.out.println("Password: " + password);
        System.out.println("BCrypt Hash: " + hash);
        System.out.println();
        System.out.println("Example usage in SQL:");
        System.out.println("  UPDATE users SET password = '" + hash + "' WHERE email = 'user@example.com';");
    }
}
