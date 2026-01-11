-- Add IQ Arena (Trivia) tiers to game_tiers table for proper tournament functionality

INSERT INTO game_tiers (id, game_id, tier_id, tier_name, players_per_match, entry_fee, payout_structure, is_test, is_mega) VALUES
-- Trivia Newbie tier: 10 players, top 5 paid (same structure as Asteroids Newbie)
('trivia-tier-0', 'trivia', 'tier-0', 'Newbie Brain Teaser', 10, 0.1, '{"1": 0.3, "2": 0.2, "3": 0.1, "4": 0.1, "5": 0.1}', false, false),

-- Trivia Rookie tier: 7 players, top 3 paid
('trivia-tier-1', 'trivia', 'tier-1', 'Rookie Quiz', 7, 1, '{"1": 3, "2": 2, "3": 1}', false, false),

-- Trivia Pro tier: 5 players, top 3 paid
('trivia-tier-2', 'trivia', 'tier-2', 'Pro Challenge', 5, 5, '{"1": 12, "2": 8, "3": 5}', false, false),

-- Trivia Elite tier: 5 players, top 4 paid
('trivia-tier-3', 'trivia', 'tier-3', 'Elite Masters', 5, 10, '{"1": 25, "2": 15, "3": 7, "4": 3}', false, false),

-- Trivia Legend tier: 3 players, top 2 paid
('trivia-tier-4', 'trivia', 'tier-4', 'Legend Duel', 3, 15, '{"1": 35, "2": 10}', false, false),

-- Trivia Mega: 100 players, top 10 paid
('trivia-tier-mega', 'trivia', 'tier-mega', 'IQ MEGA ARENA', 100, 1, '{"1": 50, "2": 20, "3": 10, "4": 5, "5": 5, "6": 3, "7": 3, "8": 2, "9": 1, "10": 1}', false, true)

ON CONFLICT (id) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  players_per_match = EXCLUDED.players_per_match,
  entry_fee = EXCLUDED.entry_fee,
  payout_structure = EXCLUDED.payout_structure,
  is_test = EXCLUDED.is_test,
  is_mega = EXCLUDED.is_mega;

-- Verify the inserts
SELECT id, game_id, tier_id, tier_name, players_per_match, entry_fee, payout_structure 
FROM game_tiers 
WHERE game_id IN ('asteroids', 'trivia')
ORDER BY game_id, entry_fee;
