-- Check what questions currently exist in the database

SELECT 
    COUNT(*) as total_questions,
    COUNT(CASE WHEN game_mode = 'freeplay' THEN 1 END) as freeplay_count,
    COUNT(CASE WHEN game_mode = 'tournament' THEN 1 END) as tournament_count,
    COUNT(CASE WHEN game_mode = 'both' OR game_mode IS NULL THEN 1 END) as both_or_null_count
FROM trivia_questions;

-- Show breakdown by category
SELECT 
    category,
    difficulty,
    game_mode,
    COUNT(*) as question_count
FROM trivia_questions
GROUP BY category, difficulty, game_mode
ORDER BY category, difficulty, game_mode;

-- Show sample questions
SELECT 
    id,
    category,
    difficulty,
    game_mode,
    LEFT(question, 60) as question_preview
FROM trivia_questions
ORDER BY created_at
LIMIT 20;
