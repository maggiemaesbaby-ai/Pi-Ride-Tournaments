-- Added table existence check before update
-- Check if game_tiers table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_tiers') THEN
        RAISE EXCEPTION 'Table game_tiers does not exist. Please run 001_create_complete_tournament_system.sql first.';
    END IF;
END $$;

-- Update Newbie Practice tier to pay top 5 players
UPDATE game_tiers 
SET payout_structure = '{"1": 0.03, "2": 0.02, "3": 0.01, "4": 0.01, "5": 0.01}'::jsonb
WHERE id = 'asteroids-tier-0' AND tier_id = 'tier-0';

-- Verify the update
SELECT id, tier_name, players_per_match, entry_fee, payout_structure 
FROM game_tiers 
WHERE id = 'asteroids-tier-0';
