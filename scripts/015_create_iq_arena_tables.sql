-- IQ Arena Tournament System Tables
-- Run this script in your Supabase SQL Editor

-- Trivia questions table with categories and difficulty levels
CREATE TABLE IF NOT EXISTS trivia_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
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

-- Tournament game sessions
CREATE TABLE IF NOT EXISTS trivia_game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  question_ids JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player game progress
CREATE TABLE IF NOT EXISTS trivia_player_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES tournament_entries(id) ON DELETE CASCADE,
  game_session_id UUID REFERENCES trivia_game_sessions(id),
  pi_uid VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  is_free_play BOOLEAN DEFAULT FALSE,
  current_level INT DEFAULT 1 CHECK (current_level BETWEEN 1 AND 3),
  level_1_answers JSONB DEFAULT '[]'::jsonb,
  level_2_answers JSONB DEFAULT '[]'::jsonb,
  level_3_answers JSONB DEFAULT '[]'::jsonb,
  level_1_time DECIMAL(10,2) DEFAULT 0,
  level_2_time DECIMAL(10,2) DEFAULT 0,
  level_3_time DECIMAL(10,2) DEFAULT 0,
  total_time DECIMAL(10,2) DEFAULT 0,
  pause_start_time BIGINT,
  time_paused DECIMAL(10,2) DEFAULT 0,
  correct_answers INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  score DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress',
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

-- Insert sample questions for testing (6 questions per level = 18 total)
INSERT INTO trivia_questions (category, difficulty, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
-- Rookie Level Questions
('general', 'rookie', 'What is the capital of France?', 'London', 'Berlin', 'Paris', 'Madrid', 'C'),
('general', 'rookie', 'How many continents are there?', '5', '6', '7', '8', 'C'),
('general', 'rookie', 'What color is the sky on a clear day?', 'Green', 'Blue', 'Red', 'Yellow', 'B'),
('general', 'rookie', 'How many sides does a triangle have?', '2', '3', '4', '5', 'B'),
('general', 'rookie', 'What is 2 + 2?', '3', '4', '5', '6', 'B'),
('general', 'rookie', 'Which planet is closest to the sun?', 'Earth', 'Mars', 'Venus', 'Mercury', 'D'),

-- Pro Level Questions
('general', 'pro', 'Who painted the Mona Lisa?', 'Van Gogh', 'Picasso', 'Da Vinci', 'Monet', 'C'),
('general', 'pro', 'What is the largest ocean on Earth?', 'Atlantic', 'Indian', 'Arctic', 'Pacific', 'D'),
('general', 'pro', 'In what year did World War II end?', '1943', '1944', '1945', '1946', 'C'),
('general', 'pro', 'What is the chemical symbol for gold?', 'Go', 'Gd', 'Au', 'Ag', 'C'),
('general', 'pro', 'How many teeth does an adult human typically have?', '28', '30', '32', '34', 'C'),
('general', 'pro', 'What is the smallest prime number?', '0', '1', '2', '3', 'C'),

-- Legend Level Questions
('general', 'legend', 'What is the speed of light in vacuum?', '299,792 km/s', '300,000 km/s', '299,792,458 m/s', 'Both A and C', 'D'),
('general', 'legend', 'Who wrote "One Hundred Years of Solitude"?', 'Borges', 'Garcia Marquez', 'Neruda', 'Fuentes', 'B'),
('general', 'legend', 'What is the square root of 144?', '11', '12', '13', '14', 'B'),
('general', 'legend', 'Which element has the atomic number 79?', 'Silver', 'Platinum', 'Gold', 'Mercury', 'C'),
('general', 'legend', 'In which year was the first iPhone released?', '2005', '2006', '2007', '2008', 'C'),
('general', 'legend', 'What is the longest river in the world?', 'Amazon', 'Nile', 'Yangtze', 'Mississippi', 'B');
