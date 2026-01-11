-- Fix tournament entries score field to default to NULL instead of 0
-- This allows the verify-entry API to properly check if an entry has been used

ALTER TABLE tournament_entries 
ALTER COLUMN score SET DEFAULT NULL;

-- Update any existing entries with score = 0 and status = 'active' to have score = NULL
-- This ensures existing unpaid entries can be verified
UPDATE tournament_entries 
SET score = NULL 
WHERE score = 0 AND status = 'active';
