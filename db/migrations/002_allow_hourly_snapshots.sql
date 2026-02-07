-- Allow multiple snapshots per day (for hourly snapshots).
-- Drop the old "one snapshot per day" unique index if it exists.
DROP INDEX IF EXISTS idx_snapshots_unique_date;
