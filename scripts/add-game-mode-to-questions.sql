-- Add game_mode column to trivia_questions table
-- This separates tournament questions from free play questions

-- Add the game_mode column if it doesn't exist
ALTER TABLE trivia_questions 
ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'both' CHECK (game_mode IN ('tournament', 'freeplay', 'both'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trivia_questions_game_mode ON trivia_questions(game_mode);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_category_difficulty_mode ON trivia_questions(category, difficulty, game_mode);

-- Update existing questions:
-- Set the first 288 questions (original set) as 'freeplay'
-- Set the newer questions (576 additional) as 'tournament'
-- This is a simple approach - you can adjust as needed

-- Mark first batch as freeplay (assuming they were added first)
WITH ranked_questions AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) as row_num
  FROM trivia_questions
)
UPDATE trivia_questions
SET game_mode = 'freeplay'
FROM ranked_questions
WHERE trivia_questions.id = ranked_questions.id 
AND ranked_questions.row_num <= 288;

-- Mark remaining questions as tournament
WITH ranked_questions AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) as row_num
  FROM trivia_questions
)
UPDATE trivia_questions
SET game_mode = 'tournament'
FROM ranked_questions
WHERE trivia_questions.id = ranked_questions.id 
AND ranked_questions.row_num > 288;

-- Verify the distribution
SELECT 
  game_mode,
  category,
  difficulty,
  COUNT(*) as question_count
FROM trivia_questions
GROUP BY game_mode, category, difficulty
ORDER BY game_mode, category, 
  CASE difficulty 
    WHEN 'rookie' THEN 1 
    WHEN 'pro' THEN 2 
    WHEN 'legend' THEN 3 
  END;

-- Show total counts by mode
SELECT 
  game_mode,
  COUNT(*) as total_questions
FROM trivia_questions
GROUP BY game_mode
ORDER BY game_mode;
