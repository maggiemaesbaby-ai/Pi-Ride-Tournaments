-- Random Tournament Question Selector
-- This script creates a function to randomly select 18 tournament questions
-- from a category, excluding free play questions, and mixing all difficulty levels

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_random_tournament_questions(VARCHAR, INT);

-- Create function to get random tournament questions
CREATE OR REPLACE FUNCTION get_random_tournament_questions(
    p_category VARCHAR,
    p_count INT DEFAULT 18
)
RETURNS TABLE (
    id UUID,
    category VARCHAR,
    difficulty VARCHAR,
    question TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer CHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tq.id,
        tq.category,
        tq.difficulty,
        tq.question,
        tq.option_a,
        tq.option_b,
        tq.option_c,
        tq.option_d,
        tq.correct_answer
    FROM trivia_questions tq
    WHERE tq.category = p_category
        -- Exclude free play questions (if is_free_play column exists)
        AND (tq.is_free_play = false OR tq.is_free_play IS NULL)
        -- Include tournament or both game modes (if game_mode column exists)
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'trivia_questions' AND column_name = 'game_mode'
            )
            OR tq.game_mode IN ('tournament', 'both')
        )
    -- Randomly select from ALL difficulty levels
    ORDER BY RANDOM()
    LIMIT p_count;
END;
$$ LANGUAGE plpgsql;

-- Test the function with different categories
SELECT 
    category,
    difficulty,
    COUNT(*) as count
FROM get_random_tournament_questions('general', 18)
GROUP BY category, difficulty
ORDER BY difficulty;

-- Verify free play questions are excluded
DO $$
DECLARE
    total_general INTEGER;
    tournament_general INTEGER;
    free_play_general INTEGER;
BEGIN
    -- Count total general questions
    SELECT COUNT(*) INTO total_general 
    FROM trivia_questions 
    WHERE category = 'general';
    
    -- Count tournament-eligible questions
    SELECT COUNT(*) INTO tournament_general
    FROM trivia_questions
    WHERE category = 'general'
        AND (is_free_play = false OR is_free_play IS NULL)
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'trivia_questions' AND column_name = 'game_mode'
            )
            OR game_mode IN ('tournament', 'both')
        );
    
    -- Count free play questions
    SELECT COUNT(*) INTO free_play_general
    FROM trivia_questions
    WHERE category = 'general'
        AND (is_free_play = true OR game_mode = 'freeplay');
    
    RAISE NOTICE 'General Knowledge Category:';
    RAISE NOTICE '  Total questions: %', total_general;
    RAISE NOTICE '  Tournament-eligible: %', tournament_general;
    RAISE NOTICE '  Free play only: %', free_play_general;
    RAISE NOTICE '  Available for random selection: % questions', tournament_general;
END $$;

-- Show question distribution for all categories
SELECT 
    category,
    COUNT(*) as total_questions,
    COUNT(CASE WHEN is_free_play = true OR game_mode = 'freeplay' THEN 1 END) as free_play_count,
    COUNT(CASE WHEN (is_free_play = false OR is_free_play IS NULL) 
                 AND (game_mode IN ('tournament', 'both') OR game_mode IS NULL) THEN 1 END) as tournament_count
FROM trivia_questions
GROUP BY category
ORDER BY category;
