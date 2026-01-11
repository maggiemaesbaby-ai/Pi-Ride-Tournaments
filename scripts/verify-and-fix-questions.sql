-- Verify and fix all trivia questions to work with the API
-- This ensures questions can be loaded properly

-- 1. Show current state
SELECT 'Current Question Distribution' as info;
SELECT 
    category,
    difficulty,
    game_mode,
    COUNT(*) as count
FROM trivia_questions
GROUP BY category, difficulty, game_mode
ORDER BY category, difficulty, game_mode;

-- 2. Check if game_mode column exists and add if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trivia_questions' AND column_name = 'game_mode'
    ) THEN
        ALTER TABLE trivia_questions 
        ADD COLUMN game_mode TEXT DEFAULT 'both';
        RAISE NOTICE 'Added game_mode column';
    ELSE
        RAISE NOTICE 'game_mode column already exists';
    END IF;
END $$;

-- 3. Fix any NULL game_mode values
UPDATE trivia_questions 
SET game_mode = 'both' 
WHERE game_mode IS NULL OR game_mode = '';

-- 4. Fix difficulty values
UPDATE trivia_questions SET difficulty = 'rookie' WHERE difficulty = 'easy';
UPDATE trivia_questions SET difficulty = 'legend' WHERE difficulty = 'hard';
UPDATE trivia_questions SET difficulty = 'pro' WHERE difficulty NOT IN ('rookie', 'pro', 'legend');

-- 5. Fix category values
UPDATE trivia_questions SET category = 'general' WHERE category = 'general_knowledge';
UPDATE trivia_questions SET category = LOWER(TRIM(category)) WHERE category IS NOT NULL;

-- 6. Show fixed distribution
SELECT 'Fixed Question Distribution' as info;
SELECT 
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

-- 7. Show sample questions to verify
SELECT 
    category,
    difficulty,
    game_mode,
    LEFT(question, 60) as question_preview
FROM trivia_questions
ORDER BY category, difficulty
LIMIT 10;
