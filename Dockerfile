# Multi-stage build: Build backend with Maven, run with Java
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy entire project
COPY . .

# Build backend
RUN mvn clean package -pl backend -DskipTests

# Runtime: Use Java 21
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy built JAR from builder stage
COPY --from=builder /app/backend/target/portfolio-tracker-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
