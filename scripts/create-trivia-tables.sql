-- IQ Trivia Questions Database Schema

-- Trivia questions table with categories and difficulty levels
CREATE TABLE IF NOT EXISTS trivia_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- general_knowledge, sports, entertainment, science_tech, history_geography, arts_literature
  difficulty VARCHAR(20) NOT NULL, -- easy, hard
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  is_free_play BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament game sessions (tracks which questions are used for each game)
CREATE TABLE IF NOT EXISTS trivia_game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  tier VARCHAR(20) NOT NULL, -- bronze, silver, gold
  status VARCHAR(20) DEFAULT 'active', -- active, completed
  question_ids JSONB NOT NULL, -- Array of question IDs for this game
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player game progress (tracks individual gameplay)
CREATE TABLE IF NOT EXISTS trivia_player_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES tournament_entries(id) ON DELETE CASCADE,
  game_session_id UUID REFERENCES trivia_game_sessions(id),
  pi_uid VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  is_free_play BOOLEAN DEFAULT FALSE,
  
  -- Level progress
  current_level INT DEFAULT 1 CHECK (current_level BETWEEN 1 AND 3),
  level_1_answers JSONB DEFAULT '[]'::jsonb,
  level_2_answers JSONB DEFAULT '[]'::jsonb,
  level_3_answers JSONB DEFAULT '[]'::jsonb,
  
  -- Timing
  level_1_time DECIMAL(10,2) DEFAULT 0,
  level_2_time DECIMAL(10,2) DEFAULT 0,
  level_3_time DECIMAL(10,2) DEFAULT 0,
  total_time DECIMAL(10,2) DEFAULT 0,
  pause_start_time BIGINT, -- Timestamp when paused
  time_paused DECIMAL(10,2) DEFAULT 0, -- Total time spent paused
  
  -- Scoring
  correct_answers INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  score DECIMAL(10,2) DEFAULT 0, -- Calculated: correct_answers + time_bonus
  
  -- Status
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, paused, completed, abandoned
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trivia_questions_category ON trivia_questions(category);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_difficulty ON trivia_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_free_play ON trivia_questions(is_free_play);
CREATE INDEX IF NOT EXISTS idx_trivia_game_sessions_status ON trivia_game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_trivia_player_progress_entry ON trivia_player_progress(entry_id);
CREATE INDEX IF NOT EXISTS idx_trivia_player_progress_pi_uid ON trivia_player_progress(pi_uid);
CREATE INDEX IF NOT EXISTS idx_trivia_player_progress_status ON trivia_player_progress(status);
