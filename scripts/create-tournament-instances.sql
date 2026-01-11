-- Create tournament instances table
CREATE TABLE IF NOT EXISTS tournament_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  entry_fee DECIMAL(10, 2) NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 10,
  current_players INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, in_progress, completed
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create tournament instance entries table (replaces old tournament_entries)
CREATE TABLE IF NOT EXISTS tournament_instance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES tournament_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  game_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  entry_fee DECIMAL(10, 2) NOT NULL,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_instances_game_tier_status 
  ON tournament_instances(game_id, tier_id, status);

CREATE INDEX IF NOT EXISTS idx_tournament_instance_entries_user 
  ON tournament_instance_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_tournament_instance_entries_instance 
  ON tournament_instance_entries(instance_id);

-- Enable RLS
ALTER TABLE tournament_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_instance_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_instances
CREATE POLICY "Anyone can view tournament instances"
  ON tournament_instances FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage tournament instances"
  ON tournament_instances FOR ALL
  USING (true);

-- RLS Policies for tournament_instance_entries
CREATE POLICY "Users can view their own entries"
  ON tournament_instance_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage entries"
  ON tournament_instance_entries FOR ALL
  USING (true);
