-- =====================================================
-- INSERT TRIVIA QUESTIONS FROM OPEN TRIVIA DB
-- Run this in Supabase SQL Editor
-- =====================================================

-- Sample 1: General Knowledge Easy
INSERT INTO trivia_questions (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty)
VALUES 
('What does a funambulist walk on?', 'A Tight Rope', 'Broken Glass', 'Balls', 'The Moon', 'A', 'general', 'rookie'),
('Which sign of the zodiac is represented by the Crab?', 'Cancer', 'Libra', 'Virgo', 'Sagittarius', 'A', 'general', 'rookie'),
('Who is depicted on the US hundred dollar bill?', 'Benjamin Franklin', 'George Washington', 'Abraham Lincoln', 'Thomas Jefferson', 'A', 'general', 'rookie');

-- Sample 2: General Knowledge Medium
INSERT INTO trivia_questions (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty)
VALUES 
('What is the name of the very first video uploaded to YouTube?', 'Me at the zoo', 'tribute', 'carrie rides a truck', 'Her new puppy from great grandpa vern.', 'A', 'general', 'pro'),
('What year was Apple Inc. founded?', '1976', '1978', '1980', '1974', 'A', 'general', 'pro'),
('Which essential condiment is also known as Japanese horseradish?', 'Wasabi', 'Mentsuyu', 'Karashi', 'Ponzu', 'A', 'general', 'pro');

-- Sample 3: General Knowledge Hard
INSERT INTO trivia_questions (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty)
VALUES 
('If you planted the seeds of Quercus robur, what would grow?', 'Trees', 'Grains', 'Vegetables', 'Flowers', 'A', 'general', 'legend'),
('How many notes are there on a standard grand piano?', '88', '98', '108', '78', 'A', 'general', 'legend'),
('What type of dog is "Handsome Dan", the mascot of Yale University?', 'Bulldog', 'Yorkshire Terrier', 'Boxer', 'Pug', 'A', 'general', 'legend');
