-- Add platform column to tournament_entries table
-- This allows tracking whether users play in Pi Browser or PWA

ALTER TABLE tournament_entries 
ADD COLUMN IF NOT EXISTS platform TEXT;

-- Create index for platform queries
CREATE INDEX IF NOT EXISTS idx_tournament_entries_platform ON tournament_entries(platform);
