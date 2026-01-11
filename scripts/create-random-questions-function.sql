-- Create a Postgres function for true database-level randomization
-- This ensures different questions are selected each time from the database

CREATE OR REPLACE FUNCTION get_random_questions(
  p_category TEXT,
  p_difficulty TEXT,
  p_game_mode TEXT,
  p_limit INTEGER
)
RETURNS TABLE (
  id TEXT,
  category TEXT,
  difficulty TEXT,
  question TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT,
  game_mode TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
    tq.correct_answer,
    tq.game_mode,
    tq.is_active,
    tq.created_at,
    tq.updated_at
  FROM trivia_questions tq
  WHERE tq.category = p_category
    AND tq.difficulty = p_difficulty
    AND tq.game_mode = p_game_mode
  ORDER BY RANDOM()  -- TRUE database-level randomization
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_random_questions TO anon, authenticated;

-- Test the function
SELECT COUNT(*) as test_count
FROM get_random_questions('general', 'rookie', 'tournament', 10);
