-- Add 30-minute expiration system and tournament instance grouping for fairness
-- Players in the same instance get the same questions

-- Add must_play_by timestamp to tournament_entries
ALTER TABLE tournament_entries
ADD COLUMN IF NOT EXISTS must_play_by TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS forfeited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS forfeit_reason TEXT;

-- Add instance_id to trivia_game_sessions for grouping players
ALTER TABLE trivia_game_sessions  
ADD COLUMN IF NOT EXISTS instance_id UUID,
ADD COLUMN IF NOT EXISTS players_in_instance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_players_for_tier INTEGER DEFAULT 10;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tournament_entries_must_play_by ON tournament_entries(must_play_by) WHERE must_play_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trivia_game_sessions_instance ON trivia_game_sessions(instance_id) WHERE instance_id IS NOT NULL;

-- Create function to auto-forfeit expired entries
CREATE OR REPLACE FUNCTION forfeit_expired_tournament_entries()
RETURNS void AS $$
BEGIN
  UPDATE tournament_entries
  SET 
    status = 'completed',
    forfeited = true,
    forfeit_reason = 'Time expired - 30 minute play window exceeded',
    score = 0,
    rank = 999999
  WHERE 
    status = 'active' 
    AND must_play_by IS NOT NULL 
    AND must_play_by < NOW()
    AND forfeited = false;
    
  -- Log how many were forfeited
  RAISE NOTICE 'Forfeited % expired tournament entries', (SELECT COUNT(*) FROM tournament_entries WHERE forfeited = true AND forfeit_reason LIKE 'Time expired%');
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE tournament_entries IS 'Tournament entries with 30-minute play window enforcement';
COMMENT ON COLUMN tournament_entries.must_play_by IS 'Timestamp when entry must be played by or forfeited (30 minutes from entry)';
COMMENT ON COLUMN tournament_entries.forfeited IS 'Whether this entry was forfeited due to time expiration';
COMMENT ON COLUMN trivia_game_sessions.instance_id IS 'Groups players who get the same questions for fairness';
COMMENT ON COLUMN trivia_game_sessions.max_players_for_tier IS 'Max players per instance: newbie=10, rookie=7, elite=5, mega=100';
