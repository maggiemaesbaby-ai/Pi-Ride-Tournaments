-- Add platform column to tournament_entries table to prevent cross-platform confusion
ALTER TABLE tournament_entries 
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'browser' CHECK (platform IN ('browser', 'pwa'));

-- Create index for efficient platform-based queries
CREATE INDEX IF NOT EXISTS idx_tournament_entries_platform ON tournament_entries(platform);

-- Update existing entries to have 'browser' as default platform
UPDATE tournament_entries 
SET platform = 'browser' 
WHERE platform IS NULL;
