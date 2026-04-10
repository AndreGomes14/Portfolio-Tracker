-- Add total_portfolio_value column for storing all investments' current value (incl. cash)
ALTER TABLE portfolio_snapshots ADD COLUMN IF NOT EXISTS total_portfolio_value DOUBLE PRECISION NOT NULL DEFAULT 0;
