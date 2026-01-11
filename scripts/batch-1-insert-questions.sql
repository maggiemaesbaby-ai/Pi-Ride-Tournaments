-- Batch 1: First 50 questions from your JSON files
-- Run this in Supabase SQL Editor

INSERT INTO trivia_questions (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty) VALUES
('What is the largest animal on Earth?', 'Elephant', 'Blue Whale', 'Giraffe', 'Orca', 'B', 'general', 'rookie'),
('What is the capital of France?', 'Berlin', 'Madrid', 'Paris', 'London', 'C', 'general', 'rookie');

-- Total: 2 questions in this batch
-- After running this successfully, I'll provide batch 2 with the next 50 questions
