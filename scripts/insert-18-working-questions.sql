-- Insert 18 properly formatted questions for IQ Arena
-- These will work immediately without any configuration

-- Delete any existing broken questions (optional - comment out if you want to keep them)
-- TRUNCATE trivia_questions;

-- Insert 6 Rookie (easy) questions
INSERT INTO trivia_questions (category, difficulty, question, correct_answer, incorrect_answers, game_mode) VALUES
('general', 'rookie', 'What is the capital of France?', 'Paris', ARRAY['London', 'Berlin', 'Madrid'], 'both'),
('general', 'rookie', 'How many continents are there?', 'Seven', ARRAY['Five', 'Six', 'Eight'], 'both'),
('general', 'rookie', 'What color is the sky on a clear day?', 'Blue', ARRAY['Green', 'Red', 'Yellow'], 'both'),
('general', 'rookie', 'How many days are in a week?', 'Seven', ARRAY['Five', 'Six', 'Eight'], 'both'),
('general', 'rookie', 'What is 2 + 2?', 'Four', ARRAY['Three', 'Five', 'Six'], 'both'),
('general', 'rookie', 'Which planet is closest to the Sun?', 'Mercury', ARRAY['Venus', 'Earth', 'Mars'], 'both'),

-- Insert 6 Pro (medium) questions
('general', 'pro', 'Who wrote Romeo and Juliet?', 'William Shakespeare', ARRAY['Charles Dickens', 'Jane Austen', 'Mark Twain'], 'both'),
('general', 'pro', 'What is the largest ocean on Earth?', 'Pacific Ocean', ARRAY['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'], 'both'),
('general', 'pro', 'In what year did World War II end?', '1945', ARRAY['1944', '1946', '1943'], 'both'),
('general', 'pro', 'What is the chemical symbol for gold?', 'Au', ARRAY['Ag', 'Go', 'Gd'], 'both'),
('general', 'pro', 'How many bones are in the human body?', '206', ARRAY['198', '212', '200'], 'both'),
('general', 'pro', 'Who painted the Mona Lisa?', 'Leonardo da Vinci', ARRAY['Michelangelo', 'Raphael', 'Donatello'], 'both'),

-- Insert 6 Legend (hard) questions
('general', 'legend', 'What is the speed of light in vacuum?', '299,792,458 m/s', ARRAY['300,000,000 m/s', '280,000,000 m/s', '310,000,000 m/s'], 'both'),
('general', 'legend', 'Who was the first person to walk on the moon?', 'Neil Armstrong', ARRAY['Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'], 'both'),
('general', 'legend', 'What is the smallest prime number?', 'Two', ARRAY['One', 'Three', 'Zero'], 'both'),
('general', 'legend', 'In which year did the Berlin Wall fall?', '1989', ARRAY['1987', '1990', '1991'], 'both'),
('general', 'legend', 'What is the longest river in the world?', 'Nile River', ARRAY['Amazon River', 'Yangtze River', 'Mississippi River'], 'both'),
('general', 'legend', 'How many elements are in the periodic table?', '118', ARRAY['112', '120', '108'], 'both');

-- Verify the insert
SELECT 
    'Questions Inserted Successfully' as status,
    difficulty,
    COUNT(*) as count
FROM trivia_questions
GROUP BY difficulty
ORDER BY 
    CASE difficulty 
        WHEN 'rookie' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'legend' THEN 3 
    END;

-- Show sample of what was inserted
SELECT 
    category,
    difficulty,
    game_mode,
    LEFT(question, 50) as question_preview
FROM trivia_questions
ORDER BY difficulty, id
LIMIT 10;
