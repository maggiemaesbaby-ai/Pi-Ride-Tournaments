-- =====================================================
-- TOURNAMENT ARENA SYSTEM - PRODUCTION READY
-- =====================================================
-- This script creates the complete tournament arena system
-- with EXACT specifications from the UI

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS tournament_entries CASCADE;
DROP TABLE IF EXISTS tournament_matches CASCADE;
DROP TABLE IF EXISTS tournament_tiers CASCADE;

-- =====================================================
-- TOURNAMENT TIERS TABLE
-- =====================================================
CREATE TABLE tournament_tiers (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  name TEXT NOT NULL,
  entry_fee DECIMAL(10, 2) NOT NULL,
  pool_size INTEGER NOT NULL,
  prize_distribution JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TOURNAMENT ENTRIES TABLE
-- =====================================================
CREATE TABLE tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  entry_fee DECIMAL(10, 2) NOT NULL,
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  match_id UUID,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  payout DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tournament_entries_user ON tournament_entries(user_id);
CREATE INDEX idx_tournament_entries_game_tier ON tournament_entries(game_id, tier_id);
CREATE INDEX idx_tournament_entries_status ON tournament_entries(status);
CREATE INDEX idx_tournament_entries_match ON tournament_entries(match_id);

-- =====================================================
-- TOURNAMENT MATCHES TABLE
-- =====================================================
CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  pool_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  prize_pool DECIMAL(10, 2) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tournament_matches_game_tier ON tournament_matches(game_id, tier_id);
CREATE INDEX idx_tournament_matches_status ON tournament_matches(status);

-- =====================================================
-- INSERT ALL 7 ASTEROIDS ARENA TIERS - EXACT FROM UI
-- =====================================================

INSERT INTO tournament_tiers (id, game_id, name, entry_fee, pool_size, prize_distribution) VALUES
-- Tier 0: Newbie Practice - 10 players, 0.1π entry, pays top 5
('tier-0', 'asteroids', 'Newbie Practice', 0.10, 10, 
  '{"1": 0.30, "2": 0.20, "3": 0.10, "4": 0.10, "5": 0.10}'::jsonb),

-- Tier 1: Rookie Arena - 7 players, 1π entry, pays top 3
('tier-1', 'asteroids', 'Rookie Arena', 1.00, 7, 
  '{"1": 3.00, "2": 2.00, "3": 1.00}'::jsonb),

-- Tier 2: Silver Circuit - 7 players, 5π entry, pays top 3
('tier-2', 'asteroids', 'Silver Circuit', 5.00, 7, 
  '{"1": 15.00, "2": 10.00, "3": 5.00}'::jsonb),

-- Tier 3: Gold Championship - 7 players, 10π entry, pays top 5
('tier-3', 'asteroids', 'Gold Championship', 10.00, 7, 
  '{"1": 30.00, "2": 20.00, "3": 10.00, "4": 3.00, "5": 2.00}'::jsonb),

-- Tier 4: Elite Masters - 5 players, 15π entry, pays top 4
('tier-4', 'asteroids', 'Elite Masters', 15.00, 5, 
  '{"1": 30.00, "2": 20.00, "3": 15.00, "4": 5.00}'::jsonb),

-- Tier 5: Champion's Duel - 3 players, 20π entry, pays top 2
('tier-5', 'asteroids', 'Champion\'s Duel', 20.00, 3, 
  '{"1": 45.00, "2": 10.00}'::jsonb),

-- Tier 6: MEGA TOURNAMENT - 100 players, 1π entry, pays top 10
('tier-6', 'asteroids', 'MEGA TOURNAMENT', 1.00, 100, 
  '{"1": 50.00, "2": 20.00, "3": 10.00, "4": 2.00, "5": 2.00, "6": 2.00, "7": 2.00, "8": 2.00, "9": 2.00, "10": 2.00}'::jsonb)
ON CONFLICT (id) DO NOTHING;
