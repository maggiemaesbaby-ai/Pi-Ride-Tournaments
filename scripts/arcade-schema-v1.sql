-- Create arcade users table
CREATE TABLE IF NOT EXISTS arcade_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create arcade matches table
CREATE TABLE IF NOT EXISTS arcade_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  entry_fee NUMERIC NOT NULL,
  prize_pool NUMERIC NOT NULL,
  max_players INTEGER DEFAULT 7,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  escrow_wallet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create arcade match players table
CREATE TABLE IF NOT EXISTS arcade_match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES arcade_matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES arcade_users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  score INTEGER DEFAULT 0,
  completion_time INTEGER,
  lives_lost INTEGER DEFAULT 0,
  rank INTEGER,
  payout NUMERIC DEFAULT 0,
  game_status TEXT DEFAULT 'waiting' CHECK (game_status IN ('waiting', 'playing', 'paused', 'completed', 'timeout')),
  paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Create arcade player stats table
CREATE TABLE IF NOT EXISTS arcade_player_stats (
  user_id UUID PRIMARY KEY REFERENCES arcade_users(id) ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  win_ratio NUMERIC GENERATED ALWAYS AS (
    CASE WHEN total_games > 0 THEN ROUND((total_wins::NUMERIC / total_games::NUMERIC) * 100, 2) ELSE 0 END
  ) STORED,
  total_earned NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  favorite_game TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_arcade_matches_game_status ON arcade_matches(game_id, status);
CREATE INDEX IF NOT EXISTS idx_arcade_match_players_match ON arcade_match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_arcade_match_players_user ON arcade_match_players(user_id);
CREATE INDEX IF NOT EXISTS idx_arcade_users_wallet ON arcade_users(wallet_address);

-- Enable Row Level Security
ALTER TABLE arcade_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_player_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read all profiles" ON arcade_users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON arcade_users FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');
CREATE POLICY "Users can insert own profile" ON arcade_users FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Anyone can read matches" ON arcade_matches FOR SELECT USING (true);
CREATE POLICY "System can manage matches" ON arcade_matches FOR ALL USING (true);

CREATE POLICY "Anyone can read match players" ON arcade_match_players FOR SELECT USING (true);
CREATE POLICY "System can manage match players" ON arcade_match_players FOR ALL USING (true);

CREATE POLICY "Users can read all stats" ON arcade_player_stats FOR SELECT USING (true);
CREATE POLICY "System can manage stats" ON arcade_player_stats FOR ALL USING (true);
