-- =====================================================
-- TRIVIA RANDOM QUESTION FUNCTIONS
-- Drop existing functions and recreate with correct schema
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_random_easy_questions(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_random_pro_questions(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_random_hard_questions(TEXT, INTEGER);

-- Function to get random easy questions (difficulty='rookie')
CREATE OR REPLACE FUNCTION get_random_easy_questions(p_category TEXT, p_limit INTEGER)
RETURNS TABLE (
    id UUID,
    question TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer TEXT,
    category VARCHAR(50),
    difficulty VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer::TEXT,
        q.category,
        q.difficulty
    FROM trivia_questions q
    WHERE q.category = p_category 
    AND q.difficulty = 'rookie'
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Added function to get random pro (medium) difficulty questions
CREATE OR REPLACE FUNCTION get_random_pro_questions(p_category TEXT, p_limit INTEGER)
RETURNS TABLE (
    id UUID,
    question TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer TEXT,
    category VARCHAR(50),
    difficulty VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer::TEXT,
        q.category,
        q.difficulty
    FROM trivia_questions q
    WHERE q.category = p_category 
    AND q.difficulty = 'pro'
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get random hard questions (difficulty='legend')
CREATE OR REPLACE FUNCTION get_random_hard_questions(p_category TEXT, p_limit INTEGER)
RETURNS TABLE (
    id UUID,
    question TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer TEXT,
    category VARCHAR(50),
    difficulty VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer::TEXT,
        q.category,
        q.difficulty
    FROM trivia_questions q
    WHERE q.category = p_category 
    AND q.difficulty = 'legend'
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Verify the functions were created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_random_easy_questions', 'get_random_pro_questions', 'get_random_hard_questions')
AND routine_schema = 'public';
