-- Migration: Add assigned_at timestamp field to issues table
-- The due_date column already exists per supabase-schema.sql

ALTER TABLE issues ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Optional: Add index for querying by due_date for better performance
CREATE INDEX IF NOT EXISTS idx_issues_due_date ON issues(due_date);
