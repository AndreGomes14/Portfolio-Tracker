-- Schema migration: users table and ownership columns for investments and portfolio_snapshots.
-- No data is assigned to any specific account; users register via the app and own only new data they create.

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add owner_id to investments if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'investments' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE investments ADD COLUMN owner_id BIGINT NULL;
        ALTER TABLE investments ADD CONSTRAINT fk_investments_owner
            FOREIGN KEY (owner_id) REFERENCES users(id);
    END IF;
END $$;

-- Add owner_id to portfolio_snapshots if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'portfolio_snapshots' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE portfolio_snapshots ADD COLUMN owner_id BIGINT NULL;
        ALTER TABLE portfolio_snapshots ADD CONSTRAINT fk_portfolio_snapshots_owner
            FOREIGN KEY (owner_id) REFERENCES users(id);
    END IF;
END $$;
