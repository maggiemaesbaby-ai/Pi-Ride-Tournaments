-- Create player_stats table for tracking Elo ratings
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  overall_rating INTEGER DEFAULT 1200,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_ratings table for per-game Elo ratings
CREATE TABLE IF NOT EXISTS game_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  rating INTEGER DEFAULT 1200,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Create match_history table for tracking all matches
CREATE TABLE IF NOT EXISTS match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  players JSONB NOT NULL,
  results JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_rating ON player_stats(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_game_ratings_user_game ON game_ratings(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_game_ratings_game_rating ON game_ratings(game_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_match_history_tournament ON match_history(tournament_id);
CREATE INDEX IF NOT EXISTS idx_match_history_game ON match_history(game_id);

-- Enable Row Level Security
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

-- Create policies for player_stats
CREATE POLICY "Anyone can view player stats"
  ON player_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own stats"
  ON player_stats FOR UPDATE
  USING (user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Users can insert their own stats"
  ON player_stats FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claim.sub', true));

-- Create policies for game_ratings
CREATE POLICY "Anyone can view game ratings"
  ON game_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own game ratings"
  ON game_ratings FOR UPDATE
  USING (user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Users can insert their own game ratings"
  ON game_ratings FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claim.sub', true));

-- Create policies for match_history
CREATE POLICY "Anyone can view match history"
  ON match_history FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert match history"
  ON match_history FOR INSERT
  WITH CHECK (true);
