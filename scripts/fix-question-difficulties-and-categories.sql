-- Fix difficulty and category mismatches in trivia_questions
-- This ensures all questions match what the API expects

-- 1. Standardize difficulty values
UPDATE trivia_questions 
SET difficulty = 'rookie' 
WHERE difficulty = 'easy';

UPDATE trivia_questions 
SET difficulty = 'legend' 
WHERE difficulty = 'hard';

-- 2. Merge general_knowledge into general category
UPDATE trivia_questions 
SET category = 'general' 
WHERE category = 'general_knowledge';

-- 3. Verify the changes
SELECT 
    'After Fix' as status,
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

-- 4. Show total counts by category
SELECT 
    category,
    COUNT(*) as total_questions
FROM trivia_questions
GROUP BY category
ORDER BY category;

-- 5. Verify no invalid difficulties remain
SELECT 
    difficulty,
    COUNT(*) as count
FROM trivia_questions
WHERE difficulty NOT IN ('rookie', 'pro', 'legend')
GROUP BY difficulty;

-- 6. Show distribution ready for tournament play
SELECT 
    'Tournament Questions' as pool,
    category,
    difficulty,
    COUNT(*) as available
FROM trivia_questions
WHERE game_mode IN ('tournament', 'both')
GROUP BY category, difficulty
ORDER BY category, 
    CASE difficulty 
        WHEN 'rookie' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'legend' THEN 3 
    END;
