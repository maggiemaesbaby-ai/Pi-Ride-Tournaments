-- COMPLETE DATABASE FIX FOR IQ ARENA
-- This script will diagnose and fix all question issues

-- Step 1: Show what's currently in the database
SELECT 
    'Current Questions in Database' as info,
    category,
    difficulty,
    game_mode,
    COUNT(*) as count
FROM trivia_questions
GROUP BY category, difficulty, game_mode
ORDER BY category, difficulty, game_mode;

-- Step 2: Fix all difficulty values
UPDATE trivia_questions SET difficulty = 'rookie' WHERE difficulty = 'easy' OR difficulty = 'Easy' OR difficulty = 'EASY';
UPDATE trivia_questions SET difficulty = 'pro' WHERE difficulty = 'medium' OR difficulty = 'Medium' OR difficulty = 'MEDIUM' OR difficulty = 'moderate' OR difficulty = 'Moderate';
UPDATE trivia_questions SET difficulty = 'legend' WHERE difficulty = 'hard' OR difficulty = 'Hard' OR difficulty = 'HARD';

-- Step 3: Fix all category values
UPDATE trivia_questions SET category = 'general' WHERE category = 'general_knowledge' OR category = 'General Knowledge' OR category = 'General' OR category IS NULL OR category = '';

-- Step 4: Ensure game_mode column exists and has default value
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trivia_questions' AND column_name = 'game_mode'
    ) THEN
        ALTER TABLE trivia_questions 
        ADD COLUMN game_mode TEXT DEFAULT 'both';
    END IF;
END $$;

-- Step 5: Set game_mode to 'both' for any NULL values
UPDATE trivia_questions SET game_mode = 'both' WHERE game_mode IS NULL OR game_mode = '';

-- Step 6: Verify the fix
SELECT 
    'After Fix - Questions Available' as info,
    category,
    difficulty,
    game_mode,
    COUNT(*) as count
FROM trivia_questions
GROUP BY category, difficulty, game_mode
ORDER BY category, 
    CASE difficulty 
        WHEN 'rookie' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'legend' THEN 3 
    END,
    game_mode;

-- Step 7: Show sample questions
SELECT 
    'Sample Questions' as info,
    category,
    difficulty,
    game_mode,
    LEFT(question, 60) as question_preview
FROM trivia_questions
ORDER BY category, difficulty
LIMIT 10;

-- Step 8: Check if we have enough questions per difficulty
SELECT 
    'Questions Per Difficulty (Need 6 each)' as info,
    category,
    difficulty,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 6 THEN '✓ OK'
        ELSE '✗ NEED MORE'
    END as status
FROM trivia_questions
WHERE category = 'general'
GROUP BY category, difficulty
ORDER BY 
    CASE difficulty 
        WHEN 'rookie' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'legend' THEN 3 
    END;
