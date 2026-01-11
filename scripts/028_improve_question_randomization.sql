-- Improved IQ Arena Question Randomization with Diversity
-- Ensures questions are truly diverse and removes duplicates

-- First, let's check for duplicate questions
DO $$
BEGIN
  RAISE NOTICE 'Checking for duplicate questions...';
END $$;

-- Find and display duplicate questions (same question text)
SELECT 
  question,
  category,
  COUNT(*) as duplicate_count,
  STRING_AGG(difficulty, ', ') as difficulties
FROM trivia_questions
GROUP BY question, category
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, category;

-- OPTIONAL: Remove exact duplicates (keeps one copy of each unique question)
-- Uncomment the following if you want to clean up duplicates:
/*
DELETE FROM trivia_questions a
USING trivia_questions b
WHERE a.id > b.id
  AND a.question = b.question
  AND a.category = b.category;
*/

-- Create improved randomization function with better distribution
DROP FUNCTION IF EXISTS get_random_tournament_questions(VARCHAR, INT);

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
DECLARE
    rookie_count INT := FLOOR(p_count * 0.50);  -- 50% rookie (9 questions)
    pro_count INT := FLOOR(p_count * 0.30);     -- 30% pro (5 questions)
    legend_count INT;                            -- Remainder legend (4 questions)
BEGIN
    legend_count := p_count - rookie_count - pro_count;
    
    -- Return questions with balanced difficulty distribution
    RETURN QUERY
    (
        -- Get rookie questions (50%)
        SELECT 
            tq.id, tq.category, tq.difficulty, tq.question,
            tq.option_a, tq.option_b, tq.option_c, tq.option_d, tq.correct_answer
        FROM trivia_questions tq
        WHERE tq.category = p_category
            AND LOWER(tq.difficulty) IN ('rookie', 'easy')
            AND (tq.is_free_play = false OR tq.is_free_play IS NULL)
        ORDER BY RANDOM()
        LIMIT rookie_count
    )
    UNION ALL
    (
        -- Get pro questions (30%)
        SELECT 
            tq.id, tq.category, tq.difficulty, tq.question,
            tq.option_a, tq.option_b, tq.option_c, tq.option_d, tq.correct_answer
        FROM trivia_questions tq
        WHERE tq.category = p_category
            AND LOWER(tq.difficulty) IN ('pro', 'medium')
            AND (tq.is_free_play = false OR tq.is_free_play IS NULL)
        ORDER BY RANDOM()
        LIMIT pro_count
    )
    UNION ALL
    (
        -- Get legend questions (20%)
        SELECT 
            tq.id, tq.category, tq.difficulty, tq.question,
            tq.option_a, tq.option_b, tq.option_c, tq.option_d, tq.correct_answer
        FROM trivia_questions tq
        WHERE tq.category = p_category
            AND LOWER(tq.difficulty) IN ('legend', 'hard')
            AND (tq.is_free_play = false OR tq.is_free_play IS NULL)
        ORDER BY RANDOM()
        LIMIT legend_count
    )
    ORDER BY RANDOM();  -- Final shuffle to mix difficulties
END;
$$ LANGUAGE plpgsql;

-- Test the improved function
SELECT 
    difficulty,
    COUNT(*) as count,
    STRING_AGG(LEFT(question, 30), ' | ') as sample_questions
FROM get_random_tournament_questions('general', 18)
GROUP BY difficulty
ORDER BY 
    CASE difficulty 
        WHEN 'rookie' THEN 1
        WHEN 'easy' THEN 1
        WHEN 'pro' THEN 2
        WHEN 'medium' THEN 2
        WHEN 'legend' THEN 3
        WHEN 'hard' THEN 3
        ELSE 4
    END;

-- Show question distribution in database
SELECT 
    category,
    LOWER(difficulty) as difficulty_normalized,
    COUNT(*) as question_count
FROM trivia_questions
WHERE (is_free_play = false OR is_free_play IS NULL)
GROUP BY category, LOWER(difficulty)
ORDER BY category, difficulty_normalized;
