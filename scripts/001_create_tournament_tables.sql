-- Tournament entries and session tracking
-- Run this script to set up tournament payment and cross-platform gameplay tracking

CREATE TABLE IF NOT EXISTS tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  entry_fee DECIMAL(10, 2) NOT NULL,
  tournament_tier TEXT NOT NULL,
  pi_payment_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, playing, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_entry_id UUID REFERENCES tournament_entries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  game_time INTEGER NOT NULL DEFAULT 0, -- in seconds
  platform TEXT NOT NULL, -- 'pi-browser' or 'pwa'
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_entry_id UUID REFERENCES tournament_entries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  pi_transaction_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_entries_user ON tournament_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_entries_status ON tournament_entries(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_entry ON game_sessions(tournament_entry_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_payouts_user ON tournament_payouts(user_id);
