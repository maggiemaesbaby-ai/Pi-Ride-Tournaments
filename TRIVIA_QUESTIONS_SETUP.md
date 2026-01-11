# IQ Arena Tournament Questions Setup Guide

## Problem
Tournament questions appear un-randomized because only ONE SQL script per category has been run in Supabase.

## Solution
You need to run ALL question seed scripts for each category to get the full question pool.

## Required Scripts to Run (In Order)

### 1. Create Tables & Functions
Run these first (if not already done):
```sql
-- scripts/015_create_iq_arena_tables.sql
-- scripts/create-random-tournament-question-selector.sql
```

### 2. Seed ALL Question Scripts

For each category, run ALL versions (v1, v2, v3) to get maximum question variety:

#### Arts & Literature (Run all 3):
- `scripts/seed-arts-literature-questions.sql`
- `scripts/seed-arts-literature-questions-v2.sql`
- `scripts/seed-arts-literature-questions-v3.sql`

#### Entertainment (Run all 3):
- `scripts/seed-entertainment-questions.sql`
- `scripts/seed-entertainment-questions-v2.sql`
- `scripts/seed-entertainment-questions-v3.sql`

#### General Knowledge (Run all 3):
- `scripts/seed-general-knowledge-questions.sql`
- `scripts/seed-general-knowledge-questions-v2.sql`
- `scripts/seed-general-knowledge-questions-v3.sql`

#### History & Geography (Run all 3):
- `scripts/seed-history-geography-questions.sql`
- `scripts/seed-history-geography-questions-v2.sql`
- `scripts/seed-history-geography-questions-v3.sql`

#### Science & Technology (Run all 3):
- `scripts/seed-science-tech-questions.sql`
- `scripts/seed-science-tech-questions-v2.sql`
- `scripts/seed-science-tech-questions-v3.sql`

#### Sports (Run all 3):
- `scripts/seed-sports-questions.sql`
- `scripts/seed-sports-questions-v2.sql`
- `scripts/seed-sports-questions-v3.sql`

### 3. Verify Question Counts

After running all scripts, verify in Supabase SQL Editor:

```sql
-- Check total questions per category
SELECT 
    category,
    COUNT(*) as total_questions,
    COUNT(CASE WHEN difficulty = 'rookie' THEN 1 END) as rookie_count,
    COUNT(CASE WHEN difficulty = 'pro' THEN 1 END) as pro_count,
    COUNT(CASE WHEN difficulty = 'legend' THEN 1 END) as legend_count,
    COUNT(CASE WHEN game_mode = 'tournament' OR game_mode = 'both' THEN 1 END) as tournament_eligible
FROM trivia_questions
GROUP BY category
ORDER BY category;
```

Expected results (after running all scripts):
- Each category should have 150-200+ tournament questions
- Mix of rookie, pro, and legend difficulties
- Questions from multiple script versions

### 4. Test Randomization

Run this query multiple times to verify different questions appear:

```sql
SELECT * FROM get_random_tournament_questions('general', 18);
```

Run it 3-4 times - you should see different questions each time.

## How Randomization Works

The `get_random_tournament_questions()` PostgreSQL function:
1. Selects from ALL questions in the category
2. Excludes free play questions
3. Uses `ORDER BY RANDOM()` to shuffle
4. Returns requested count (default 18)

The randomization happens at the DATABASE level, ensuring true randomness across all question scripts that have been loaded.

## Current Status

Check which scripts you've already run:
```sql
SELECT category, COUNT(*) as question_count
FROM trivia_questions
WHERE game_mode IN ('tournament', 'both')
GROUP BY category;
```

If any category has less than 60 questions, you need to run more seed scripts for that category.
