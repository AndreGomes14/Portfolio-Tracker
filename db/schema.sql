-- ============================================================
-- Portfolio Tracker - Database Schema
-- PostgreSQL
-- ============================================================

-- Drop tables if they exist (for development reset)
DROP TABLE IF EXISTS portfolio_snapshots CASCADE;
DROP TABLE IF EXISTS investments CASCADE;

-- ============================================================
-- Investment Types Enum (handled at application level via JPA)
-- Valid values: STOCK, CRYPTO, ETF, CASH, OTHER
-- ============================================================

-- ============================================================
-- Investments Table
-- Stores the active assets in the portfolio
-- ============================================================
CREATE TABLE investments (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    ticker          VARCHAR(20),
    type            VARCHAR(20)     NOT NULL CHECK (type IN ('STOCK', 'CRYPTO', 'ETF', 'CASH', 'OTHER')),
    quantity        DOUBLE PRECISION NOT NULL CHECK (quantity >= 0),
    average_purchase_price DOUBLE PRECISION NOT NULL CHECK (average_purchase_price >= 0),
    current_price   DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (current_price >= 0),
    notes           VARCHAR(500),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for type-based queries (e.g., fetching only STOCK/CRYPTO for price updates)
CREATE INDEX idx_investments_type ON investments(type);

-- ============================================================
-- Portfolio Snapshots Table
-- Stores daily historical totals for portfolio tracking
-- ============================================================
CREATE TABLE portfolio_snapshots (
    id                      BIGSERIAL       PRIMARY KEY,
    snapshot_date           TIMESTAMP       NOT NULL,
    total_invested_amount   DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_current_value     DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_profit_and_loss   DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for date-based queries (history lookups)
CREATE INDEX idx_snapshots_date ON portfolio_snapshots(snapshot_date DESC);

-- Unique constraint: one snapshot per day
CREATE UNIQUE INDEX idx_snapshots_unique_date ON portfolio_snapshots(DATE(snapshot_date));
