-- Separate tournament and free play questions by updating game_mode

-- First, check current distribution
SELECT 
  game_mode,
  difficulty,
  COUNT(*) as count
FROM trivia_questions
GROUP BY game_mode, difficulty
ORDER BY game_mode, difficulty;

-- Strategy: Split questions 60/40 between tournament and free play
-- This ensures variety in both modes

-- Assign first 60% of questions to tournament mode
UPDATE trivia_questions
SET game_mode = 'tournament'
WHERE id IN (
  SELECT id
  FROM trivia_questions
  WHERE game_mode = 'both' OR game_mode IS NULL
  ORDER BY RANDOM()
  LIMIT (SELECT COUNT(*) * 0.6 FROM trivia_questions WHERE game_mode = 'both' OR game_mode IS NULL)::integer
);

-- Assign remaining questions to free play mode  
UPDATE trivia_questions
SET game_mode = 'free_play'
WHERE game_mode = 'both' OR game_mode IS NULL;

-- Verify the new distribution
SELECT 
  game_mode,
  difficulty,
  category,
  COUNT(*) as count
FROM trivia_questions
GROUP BY game_mode, difficulty, category
ORDER BY game_mode, difficulty, category;

-- Check total counts
SELECT 
  game_mode,
  COUNT(*) as total_questions,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM trivia_questions
GROUP BY game_mode;
