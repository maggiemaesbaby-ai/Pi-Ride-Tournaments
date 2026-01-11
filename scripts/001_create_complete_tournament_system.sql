-- Complete Tournament System Database Schema

-- Game tier configurations (Asteroids: 6 tiers, each with different player counts and payouts)
CREATE TABLE IF NOT EXISTS game_tiers (
  id TEXT PRIMARY KEY, -- e.g., 'asteroids-tier-1', 'asteroids-tier-2'
  game_id TEXT NOT NULL, -- 'asteroids', 'double-dragon', etc.
  tier_id TEXT NOT NULL, -- 'tier-1', 'tier-2', etc.
  tier_name TEXT NOT NULL, -- 'Rookie Arena', 'Silver Circuit', etc.
  players_per_match INTEGER NOT NULL, -- 7, 5, 3, 100
  entry_fee DECIMAL(10, 2) NOT NULL,
  payout_structure JSONB NOT NULL, -- {"1": 0.3, "2": 0.2, "3": 0.1} for payouts
  is_mega BOOLEAN DEFAULT FALSE,
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Asteroids tiers
-- Set all tiers to production (is_test: false) for launch
INSERT INTO game_tiers (id, game_id, tier_id, tier_name, players_per_match, entry_fee, payout_structure, is_test, is_mega) VALUES
('asteroids-tier-0', 'asteroids', 'tier-0', 'Newbie Practice', 10, 0.1, '{"1": 0.3, "2": 0.2, "3": 0.1, "4": 0.1, "5": 0.1}', false, false),
('asteroids-tier-1', 'asteroids', 'tier-1', 'Rookie Arena', 7, 1, '{"1": 3, "2": 2, "3": 1}', false, false),
('asteroids-tier-2', 'asteroids', 'tier-2', 'Silver Circuit', 7, 5, '{"1": 15, "2": 10, "3": 5}', false, false),
('asteroids-tier-3', 'asteroids', 'tier-3', 'Gold Championship', 7, 10, '{"1": 30, "2": 20, "3": 10, "4": 3, "5": 2}', false, false),
('asteroids-tier-4', 'asteroids', 'tier-4', 'Elite Masters', 5, 15, '{"1": 30, "2": 20, "3": 15, "4": 5}', false, false),
('asteroids-tier-5', 'asteroids', 'tier-5', 'Champion''s Duel', 3, 20, '{"1": 45, "2": 10}', false, false),
('asteroids-tier-6-mega', 'asteroids', 'tier-6-mega', 'MEGA TOURNAMENT', 100, 1, '{"1": 50, "2": 20, "3": 10, "4-10": 2}', false, true)
ON CONFLICT (id) DO NOTHING;

-- Tournament entries (created when user pays entry fee)
CREATE TABLE IF NOT EXISTS tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  entry_fee DECIMAL(10, 2) NOT NULL,
  pi_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, playing, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Game sessions (created when game starts, updated when game ends)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_entry_id UUID REFERENCES tournament_entries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  platform TEXT NOT NULL, -- 'pi-browser' or 'pwa'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tournament matches (groups of players competing together)
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  match_number INTEGER NOT NULL DEFAULT 1, -- Sequential match numbering (Match #1, #2, etc.)
  max_players INTEGER NOT NULL DEFAULT 10,
  current_players INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'filling', -- filling, active, completed, paid_out
  prize_pool DECIMAL(10, 2) NOT NULL DEFAULT 0,
  app_wallet_amount DECIMAL(10, 2) DEFAULT 0, -- Remaining Pi after payouts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(game_id, tier_id, match_number)
);

-- Link entries to matches
CREATE TABLE IF NOT EXISTS match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES tournament_matches(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES tournament_entries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  final_score INTEGER,
  rank INTEGER,
  prize_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout records
CREATE TABLE IF NOT EXISTS tournament_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES tournament_matches(id),
  user_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  pi_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_tier_unique ON game_tiers(game_id, tier_id);
CREATE INDEX IF NOT EXISTS idx_tournament_entries_user ON tournament_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_entries_status ON tournament_entries(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_entry ON game_sessions(tournament_entry_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_match ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user ON match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_payouts_user ON tournament_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_payouts_status ON tournament_payouts(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_game_tier ON tournament_matches(game_id, tier_id, status);
