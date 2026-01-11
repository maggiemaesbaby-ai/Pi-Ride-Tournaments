-- IQ Arena Question Randomization Functions
-- These functions use PostgreSQL RANDOM() for true database-level randomization
-- Run this script in your Supabase SQL Editor

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_random_easy_questions(TEXT, INT);
DROP FUNCTION IF EXISTS get_random_hard_questions(TEXT, INT);

-- Function to get random easy questions (difficulty = 'easy')
CREATE OR REPLACE FUNCTION get_random_easy_questions(
  p_category TEXT,
  p_limit INT
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
  correct_answer CHAR,
  is_free_play BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
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
    tq.correct_answer,
    tq.is_free_play,
    tq.created_at,
    tq.updated_at
  FROM trivia_questions tq
  WHERE tq.category = p_category 
    AND tq.difficulty = 'easy'
    AND tq.is_free_play = false
  ORDER BY RANDOM()  -- TRUE database-level randomization
  LIMIT p_limit;
END;
$$;

-- Function to get random hard questions (difficulty = 'hard')
CREATE OR REPLACE FUNCTION get_random_hard_questions(
  p_category TEXT,
  p_limit INT
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
  correct_answer CHAR,
  is_free_play BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
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
    tq.correct_answer,
    tq.is_free_play,
    tq.created_at,
    tq.updated_at
  FROM trivia_questions tq
  WHERE tq.category = p_category 
    AND tq.difficulty = 'hard'
    AND tq.is_free_play = false
  ORDER BY RANDOM()  -- TRUE database-level randomization
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_random_easy_questions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_random_hard_questions TO anon, authenticated;

-- Test the functions
SELECT 'Testing easy questions:' as test;
SELECT COUNT(*) as easy_count
FROM get_random_easy_questions('General Knowledge', 3);

SELECT 'Testing hard questions:' as test;
SELECT COUNT(*) as hard_count
FROM get_random_hard_questions('General Knowledge', 15);
