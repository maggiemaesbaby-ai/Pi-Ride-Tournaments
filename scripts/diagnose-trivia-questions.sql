-- Diagnostic script to check trivia questions table

-- Check total count
SELECT COUNT(*) as total_questions FROM trivia_questions;

-- Check how many questions have NULL or empty categories
SELECT 
    COUNT(*) as untitled_questions,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_category,
    COUNT(CASE WHEN category = '' THEN 1 END) as empty_category
FROM trivia_questions
WHERE category IS NULL OR category = '';

-- Check category distribution
SELECT 
    COALESCE(category, 'NULL') as category,
    COUNT(*) as count
FROM trivia_questions
GROUP BY category
ORDER BY count DESC;

-- Check difficulty distribution
SELECT 
    COALESCE(difficulty, 'NULL') as difficulty,
    COUNT(*) as count
FROM trivia_questions
GROUP BY difficulty
ORDER BY count DESC;

-- Check game_mode distribution
SELECT 
    COALESCE(game_mode, 'NULL') as game_mode,
    COUNT(*) as count
FROM trivia_questions
GROUP BY game_mode
ORDER BY count DESC;

-- Show sample of questions to see what data exists
SELECT 
    id,
    COALESCE(category, 'NULL') as category,
    COALESCE(difficulty, 'NULL') as difficulty,
    COALESCE(game_mode, 'NULL') as game_mode,
    LEFT(question, 80) as question_preview
FROM trivia_questions
ORDER BY created_at DESC
LIMIT 20;

-- Check for duplicate questions
SELECT 
    question,
    COUNT(*) as duplicate_count
FROM trivia_questions
GROUP BY question
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;
