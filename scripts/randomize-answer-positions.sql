-- Randomize the position of correct answers across all trivia questions
-- This will shuffle answer options and update the correct_answer field

DO $$
DECLARE
    question_record RECORD;
    random_position INTEGER;
    temp_answer TEXT;
    answers TEXT[];
    correct_text TEXT;
BEGIN
    -- Loop through all questions
    FOR question_record IN 
        SELECT id, correct_answer, option_a, option_b, option_c, option_d
        FROM trivia_questions
    LOOP
        -- Get the text of the current correct answer
        CASE question_record.correct_answer
            WHEN 'A' THEN correct_text := question_record.option_a;
            WHEN 'B' THEN correct_text := question_record.option_b;
            WHEN 'C' THEN correct_text := question_record.option_c;
            WHEN 'D' THEN correct_text := question_record.option_d;
        END CASE;
        
        -- Create array of all answers
        answers := ARRAY[
            question_record.option_a,
            question_record.option_b,
            question_record.option_c,
            question_record.option_d
        ];
        
        -- Shuffle the array using Fisher-Yates algorithm
        FOR i IN REVERSE 4..2 LOOP
            random_position := floor(random() * i + 1)::INTEGER;
            temp_answer := answers[i];
            answers[i] := answers[random_position];
            answers[random_position] := temp_answer;
        END LOOP;
        
        -- Find which position the correct answer ended up in
        FOR i IN 1..4 LOOP
            IF answers[i] = correct_text THEN
                CASE i
                    WHEN 1 THEN random_position := 1; -- A
                    WHEN 2 THEN random_position := 2; -- B
                    WHEN 3 THEN random_position := 3; -- C
                    WHEN 4 THEN random_position := 4; -- D
                END CASE;
                EXIT;
            END IF;
        END LOOP;
        
        -- Update the question with shuffled answers
        UPDATE trivia_questions
        SET 
            option_a = answers[1],
            option_b = answers[2],
            option_c = answers[3],
            option_d = answers[4],
            correct_answer = CASE random_position
                WHEN 1 THEN 'A'
                WHEN 2 THEN 'B'
                WHEN 3 THEN 'C'
                WHEN 4 THEN 'D'
            END
        WHERE id = question_record.id;
    END LOOP;
    
    RAISE NOTICE 'Successfully randomized answer positions for all questions!';
END $$;

-- Verify the distribution of correct answers
SELECT 
    'Correct Answer Distribution' as info,
    correct_answer,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM trivia_questions
GROUP BY correct_answer
ORDER BY correct_answer;

-- Show sample questions with their new answer positions
SELECT 
    category,
    difficulty,
    LEFT(question, 50) as question_preview,
    correct_answer,
    LEFT(
        CASE correct_answer
            WHEN 'A' THEN option_a
            WHEN 'B' THEN option_b
            WHEN 'C' THEN option_c
            WHEN 'D' THEN option_d
        END, 
        30
    ) as correct_text
FROM trivia_questions
ORDER BY RANDOM()
LIMIT 20;
