-- Update all 7-player tiers to pay top 5 winners
-- This ensures fair distribution and more winners in each match

-- Check if game_tiers table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'game_tiers') THEN
    RAISE EXCEPTION 'Table game_tiers does not exist. Please run 001_create_complete_tournament_system.sql first.';
  END IF;
END $$;

-- Newbie Practice (tier-0): 7 players × 0.1π = 0.7π total
-- Payout: 0.03 + 0.02 + 0.015 + 0.01 + 0.005 = 0.08π (11.4%)
-- App profit: 0.62π (88.6%)
UPDATE game_tiers 
SET payout_structure = '{"1": 0.03, "2": 0.02, "3": 0.015, "4": 0.01, "5": 0.005}'::jsonb
WHERE id = 'asteroids-tier-0' AND tier_id = 'tier-0';

-- Rookie Arena (tier-1): 7 players × 1π = 7π total
-- Payout: 2.5 + 1.5 + 1 + 0.5 + 0.3 = 5.8π (82.9%)
-- App profit: 1.2π (17.1%)
UPDATE game_tiers 
SET payout_structure = '{"1": 2.5, "2": 1.5, "3": 1, "4": 0.5, "5": 0.3}'::jsonb
WHERE id = 'asteroids-tier-1' AND tier_id = 'tier-1';

-- Silver Circuit (tier-2): 7 players × 5π = 35π total
-- Payout: 12 + 8 + 5 + 3 + 2 = 30π (85.7%)
-- App profit: 5π (14.3%)
UPDATE game_tiers 
SET payout_structure = '{"1": 12, "2": 8, "3": 5, "4": 3, "5": 2}'::jsonb
WHERE id = 'asteroids-tier-2' AND tier_id = 'tier-2';

-- Gold Championship (tier-3) already has top 5 payouts, but let's verify
-- 7 players × 10π = 70π total
-- Current: 30 + 20 + 10 + 3 + 2 = 65π (92.9%)
-- App profit: 5π (7.1%)
-- No changes needed for this tier

-- Display updated tier configurations
SELECT 
  tier_name,
  players_per_match,
  entry_fee,
  payout_structure,
  (players_per_match * entry_fee) as total_pot
FROM game_tiers 
WHERE game_id = 'asteroids' 
  AND tier_id IN ('tier-0', 'tier-1', 'tier-2', 'tier-3')
ORDER BY entry_fee;
