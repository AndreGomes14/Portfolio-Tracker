# Portfolio Tracker

A personal investment tracking application built with an **API-First** approach.

## Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Database    | PostgreSQL 16                                 |
| Backend     | Java 21, Spring Boot 4.x, Maven              |
| API Spec    | OpenAPI 3.0 (Swagger UI included)             |
| Mapping     | MapStruct (Entity ↔ DTO)                      |
| Scheduling  | Spring `@Scheduled` (daily snapshot job)      |
| Frontend    | React (Vite + TypeScript) + Tailwind CSS v4   |
| HTTP Client | WebClient (for external price APIs)           |

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│  Controller  │────▶│   Service    │
│  React/Vite  │     │  (Thin HTTP) │     │  (Business)  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                    ┌─────────────┼──────────────┐
                                    ▼             ▼              ▼
                              ┌──────────┐  ┌──────────┐  ┌───────────┐
                              │ MapStruct│  │Repository│  │PriceService│
                              │  Mapper  │  │  (JPA)   │  │(CoinGecko/ │
                              └──────────┘  └────┬─────┘  │ Yahoo Fin) │
                                                 ▼        └───────────┘
                                          ┌──────────────┐
                                          │  PostgreSQL   │
                                          └──────────────┘
```

## Features

- **Investment CRUD** — Add, view, update, delete investments (STOCK, CRYPTO, ETF, CASH, OTHER)
- **Auto Price Updates** — Fetches live prices from CoinGecko (crypto) and Yahoo Finance (stocks/ETFs)
- **Portfolio Summary** — Real-time totals: invested, current value, P&L, return %
- **Daily Snapshots** — Scheduled job saves portfolio history at midnight for future charting
- **Swagger UI** — Interactive API documentation at `/swagger-ui.html`
- **Responsive Dashboard** — Clean table-based UI with Tailwind CSS

## Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 18+ & npm
- Docker & Docker Compose (for PostgreSQL)

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL on port `5432` with database `portfolio_tracker`.

### 2. Start the Backend

From the project root:

```bash
mvn -pl backend spring-boot:run
```

Or from the backend module:

```bash
cd backend && mvn spring-boot:run
```

Backend runs on `http://localhost:8080`.

- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- API Docs: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` with API proxy to backend.

## API Endpoints

| Method | Endpoint                   | Description                        |
|--------|----------------------------|------------------------------------|
| GET    | `/api/investments`         | List all investments               |
| POST   | `/api/investments`         | Create a new investment            |
| GET    | `/api/investments/{id}`    | Get investment by ID               |
| PUT    | `/api/investments/{id}`    | Update an investment               |
| DELETE | `/api/investments/{id}`    | Delete an investment               |
| GET    | `/api/portfolio/summary`   | Get portfolio summary              |
| GET    | `/api/portfolio/history`   | Get portfolio history (snapshots)  |
| POST   | `/api/portfolio/refresh-prices` | Manually refresh asset prices |

## Investment Types

| Type   | Price Update | Description                          |
|--------|-------------|--------------------------------------|
| STOCK  | Auto        | Stocks — prices fetched from Yahoo Finance |
| CRYPTO | Auto        | Crypto — prices fetched from CoinGecko    |
| ETF    | Auto        | ETFs — prices fetched from Yahoo Finance  |
| CASH   | Manual      | Cash holdings — price set manually        |
| OTHER  | Manual      | Other assets — price set manually         |

## Project Structure (multi-module)

```
PortfolioTracker/
├── pom.xml                              # Parent POM (modules: backend, frontend)
├── docker-compose.yaml                  # PostgreSQL — compose up to run DB
├── db/                                  # Schema for Docker init (no Maven module)
│   └── schema.sql
├── backend/                             # Backend module — Spring Boot API
│   ├── pom.xml
│   └── src/main/
│       ├── java/.../portfoliotracker/
│       │   ├── config/                  # WebClient, etc.
│       │   ├── controller/              # Thin REST controllers
│       │   ├── dto/                     # Request/Response DTOs
│       │   ├── entity/                  # JPA entities
│       │   ├── exception/               # Error handling
│       │   ├── mapper/                  # MapStruct mappers
│       │   ├── repository/              # Spring Data JPA repos
│       │   └── service/                 # Business logic
│       └── resources/
│           ├── api/openapi.yaml        # OpenAPI 3.0 spec
│           └── application.yaml       # App config
└── frontend/                            # Frontend module — React + Vite + TypeScript
    ├── pom.xml
    └── src/
        ├── api/                         # Axios API client
        ├── components/                  # React components
        └── types/                       # TypeScript types
```

## Configuration

Key settings in `application.yaml`:

| Property                           | Default                | Description              |
|------------------------------------|------------------------|--------------------------|
| `spring.datasource.url`           | `jdbc:postgresql://localhost:5432/portfolio_tracker` | DB URL |
| `spring.datasource.username`      | `postgres`             | DB user                  |
| `spring.datasource.password`      | `postgres`             | DB password              |
| `portfolio.snapshot.cron`         | `0 0 0 * * *`         | Daily snapshot cron      |
