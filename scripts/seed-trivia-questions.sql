-- Seed IQ Trivia Questions (Sample set - add more through admin interface)

-- Updated to 2 difficulty levels: easy and hard

-- GENERAL KNOWLEDGE - Easy (Free Play and Levels 1-2)
INSERT INTO trivia_questions (category, difficulty, question, option_a, option_b, option_c, option_d, correct_answer, is_free_play) VALUES
('general_knowledge', 'easy', 'What is the capital of France?', 'London', 'Berlin', 'Paris', 'Madrid', 'C', true),
('general_knowledge', 'easy', 'How many continents are there?', '5', '6', '7', '8', 'C', true),
('general_knowledge', 'easy', 'What color is the sky on a clear day?', 'Green', 'Blue', 'Red', 'Yellow', 'B', true),
('general_knowledge', 'easy', 'How many days are in a week?', '5', '6', '7', '8', 'C', true),
('general_knowledge', 'easy', 'What is 2 + 2?', '3', '4', '5', '6', 'B', true),
('general_knowledge', 'easy', 'Which planet do we live on?', 'Mars', 'Venus', 'Earth', 'Jupiter', 'C', true),
('general_knowledge', 'easy', 'How many months are in a year?', '10', '11', '12', '13', 'C', true),
('general_knowledge', 'easy', 'What is the opposite of hot?', 'Warm', 'Cool', 'Cold', 'Freezing', 'C', true),
('general_knowledge', 'easy', 'How many legs does a spider have?', '6', '8', '10', '12', 'B', true),
('general_knowledge', 'easy', 'What is the primary color that is not red or blue?', 'Green', 'Yellow', 'Orange', 'Purple', 'B', true),
('general_knowledge', 'easy', 'What is the smallest country in the world?', 'Monaco', 'Vatican City', 'San Marino', 'Liechtenstein', 'B', false),
('general_knowledge', 'easy', 'Who painted the Mona Lisa?', 'Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello', 'B', false),
('general_knowledge', 'easy', 'What is the chemical symbol for gold?', 'Go', 'Gd', 'Au', 'Ag', 'C', false),
('general_knowledge', 'easy', 'In what year did World War II end?', '1943', '1944', '1945', '1946', 'C', false),
('general_knowledge', 'easy', 'What is the largest ocean on Earth?', 'Atlantic', 'Indian', 'Arctic', 'Pacific', 'D', false);

-- GENERAL KNOWLEDGE - Hard (Level 3)
INSERT INTO trivia_questions (category, difficulty, question, option_a, option_b, option_c, option_d, correct_answer, is_free_play) VALUES
('general_knowledge', 'hard', 'What is the rarest blood type?', 'O negative', 'AB positive', 'AB negative', 'B negative', 'C', false),
('general_knowledge', 'hard', 'Who was the first person to reach the South Pole?', 'Robert Peary', 'Roald Amundsen', 'Ernest Shackleton', 'Robert Scott', 'B', false),
('general_knowledge', 'hard', 'What is the hardest natural substance on Earth?', 'Steel', 'Titanium', 'Diamond', 'Tungsten', 'C', false),
('general_knowledge', 'hard', 'What is the speed of light in meters per second?', '299,792,458', '300,000,000', '299,000,000', '298,792,458', 'A', false),
('general_knowledge', 'hard', 'In which year was the United Nations founded?', '1943', '1944', '1945', '1946', 'C', false);

-- SPORTS - Easy (Free Play and Levels 1-2)
INSERT INTO trivia_questions (category, difficulty, question, option_a, option_b, option_c, option_d, correct_answer, is_free_play) VALUES
('sports', 'easy', 'How many players are on a soccer team?', '9', '10', '11', '12', 'C', true),
('sports', 'easy', 'What sport is played at Wimbledon?', 'Golf', 'Tennis', 'Cricket', 'Rugby', 'B', true),
('sports', 'easy', 'How many points is a touchdown worth in American football?', '4', '5', '6', '7', 'C', true),
('sports', 'easy', 'What color is a basketball?', 'Red', 'Orange', 'Brown', 'Yellow', 'B', true),
('sports', 'easy', 'How many bases are in baseball?', '3', '4', '5', '6', 'B', true),
('sports', 'easy', 'Which country won the first FIFA World Cup?', 'Brazil', 'Uruguay', 'Argentina', 'Germany', 'B', false),
('sports', 'easy', 'How many Olympic rings are there?', '4', '5', '6', '7', 'B', false),
('sports', 'easy', 'In which sport would you perform a slam dunk?', 'Volleyball', 'Basketball', 'Tennis', 'Badminton', 'B', false);

-- SPORTS - Hard (Level 3)
INSERT INTO trivia_questions (category, difficulty, question, option_a, option_b, option_c, option_d, correct_answer, is_free_play) VALUES
('sports', 'hard', 'What is the diameter of a basketball hoop in inches?', '16', '17', '18', '19', 'C', false),
('sports', 'hard', 'In which year were the first modern Olympics held?', '1892', '1894', '1896', '1898', 'C', false),
('sports', 'hard', 'What is the maximum break in snooker?', '147', '155', '160', '180', 'A', false);

-- ENTERTAINMENT - Easy (Free Play and Levels 1-2)
INSERT INTO trivia_questions (category, difficulty, question, option_a, option_b, option_c, option_d, correct_answer, is_free_play) VALUES
('entertainment', 'easy', 'Who is known as the King of Pop?', 'Elvis Presley', 'Michael Jackson', 'Prince', 'Freddie Mercury', 'B', true),
('entertainment', 'easy', 'What is the name of the cowboy in Toy Story?', 'Buzz', 'Rex', 'Woody', 'Andy', 'C', true),
('entertainment', 'easy', 'How many strings does a standard guitar have?', '4', '5', '6', '7', 'C', true);

-- ENTERTAINMENT - Hard (Level 3)
INSERT INTO trivia_questions (category, difficulty, question, option_a, option_b, option_c, option_d, correct_answer, is_free_play) VALUES
('entertainment', 'hard', 'Who directed the movie "Inception"?', 'Steven Spielberg', 'Christopher Nolan', 'Quentin Tarantino', 'Martin Scorsese', 'B', false);

-- Add similar patterns for SCIENCE_TECH, HISTORY_GEOGRAPHY, ARTS_LITERATURE
-- Each category needs ~100 easy questions (some marked is_free_play=true) and ~50 hard questions
