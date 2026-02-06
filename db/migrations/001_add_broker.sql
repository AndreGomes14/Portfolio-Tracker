-- Add broker column to investments (safe to run on existing DB; no data loss)
ALTER TABLE investments ADD COLUMN IF NOT EXISTS broker VARCHAR(80);
