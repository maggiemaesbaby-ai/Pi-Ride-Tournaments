-- Add game_mode column to trivia_questions table
-- This separates tournament questions from free play questions
-- Version 2: More robust with better error handling

DO $$ 
BEGIN
    -- Add the game_mode column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trivia_questions' AND column_name = 'game_mode'
    ) THEN
        ALTER TABLE trivia_questions 
        ADD COLUMN game_mode TEXT DEFAULT 'both' CHECK (game_mode IN ('tournament', 'freeplay', 'both'));
        
        RAISE NOTICE 'Added game_mode column to trivia_questions';
    ELSE
        RAISE NOTICE 'game_mode column already exists';
    END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_trivia_questions_game_mode ON trivia_questions(game_mode);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_category_difficulty_mode ON trivia_questions(category, difficulty, game_mode);

-- Update existing questions based on created_at timestamp
-- First 288 questions (oldest) = freeplay
-- Next 576 questions = tournament

DO $$
DECLARE
    total_questions INTEGER;
    updated_freeplay INTEGER;
    updated_tournament INTEGER;
BEGIN
    -- Count total questions
    SELECT COUNT(*) INTO total_questions FROM trivia_questions;
    RAISE NOTICE 'Total questions in database: %', total_questions;
    
    -- Update first 288 as freeplay
    WITH ranked_questions AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) as row_num
        FROM trivia_questions
    )
    UPDATE trivia_questions
    SET game_mode = 'freeplay'
    FROM ranked_questions
    WHERE trivia_questions.id = ranked_questions.id 
    AND ranked_questions.row_num <= 288;
    
    GET DIAGNOSTICS updated_freeplay = ROW_COUNT;
    RAISE NOTICE 'Updated % questions to freeplay mode', updated_freeplay;
    
    -- Update remaining as tournament
    WITH ranked_questions AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) as row_num
        FROM trivia_questions
    )
    UPDATE trivia_questions
    SET game_mode = 'tournament'
    FROM ranked_questions
    WHERE trivia_questions.id = ranked_questions.id 
    AND ranked_questions.row_num > 288
    AND ranked_questions.row_num <= 864; -- 288 + 576
    
    GET DIAGNOSTICS updated_tournament = ROW_COUNT;
    RAISE NOTICE 'Updated % questions to tournament mode', updated_tournament;
END $$;

-- Verify the distribution by category and difficulty
SELECT 
    game_mode,
    category,
    difficulty,
    COUNT(*) as question_count
FROM trivia_questions
GROUP BY game_mode, category, difficulty
ORDER BY game_mode, category, 
    CASE difficulty 
        WHEN 'rookie' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'legend' THEN 3 
    END;

-- Show total counts by mode
SELECT 
    game_mode,
    COUNT(*) as total_questions
FROM trivia_questions
GROUP BY game_mode
ORDER BY game_mode;

-- Show sample questions from each mode to verify separation
SELECT 
    game_mode,
    category,
    difficulty,
    LEFT(question, 50) as question_preview
FROM trivia_questions
WHERE game_mode IN ('freeplay', 'tournament')
ORDER BY game_mode, created_at
LIMIT 10;
