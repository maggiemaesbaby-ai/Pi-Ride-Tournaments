-- Disable RLS on trivia_questions table to allow API access
ALTER TABLE trivia_questions DISABLE ROW LEVEL SECURITY;

-- Create a policy that allows public read access
CREATE POLICY "Allow public read access to trivia questions"
ON trivia_questions
FOR SELECT
TO public
USING (true);

-- Re-enable RLS with the new policy
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;

-- Verify the table is accessible
SELECT COUNT(*) as total_questions FROM trivia_questions;
SELECT category, COUNT(*) as count 
FROM trivia_questions 
GROUP BY category 
ORDER BY category;
