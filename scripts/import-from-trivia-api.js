import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL)

// Category mapping: The Trivia API → Your Database
const CATEGORY_MAP = {
  music: "entertainment",
  film_and_tv: "entertainment",
  food_and_drink: "general",
  general_knowledge: "general",
  geography: "geography",
  history: "history",
  science: "science",
  sport_and_leisure: "sports",
  arts_and_literature: "arts",
  society_and_culture: "general",
}

// Difficulty mapping
const DIFFICULTY_MAP = {
  easy: "rookie",
  medium: "pro",
  hard: "legend",
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

async function fetchQuestions(limit = 50, categories = [], difficulty = null) {
  let url = `https://the-trivia-api.com/v2/questions?limit=${limit}`

  if (categories.length > 0) {
    url += `&categories=${categories.join(",")}`
  }

  if (difficulty) {
    url += `&difficulties=${difficulty}`
  }

  console.log(`[v0] Fetching from: ${url}`)

  const response = await fetch(url)
  const data = await response.json()

  return data
}

function convertToMultipleChoice(question) {
  const allAnswers = [question.correctAnswer, ...question.incorrectAnswers]

  // Shuffle answers
  const shuffled = shuffleArray(allAnswers)
  const correctIndex = shuffled.indexOf(question.correctAnswer)
  const correctLetter = ["A", "B", "C", "D"][correctIndex]

  // Map category
  const dbCategory = CATEGORY_MAP[question.category] || "general"
  const dbDifficulty = DIFFICULTY_MAP[question.difficulty] || "pro"

  return {
    question: question.question.text,
    option_a: shuffled[0],
    option_b: shuffled[1],
    option_c: shuffled[2],
    option_d: shuffled[3],
    correct_answer: correctLetter,
    category: dbCategory,
    difficulty: dbDifficulty,
  }
}

async function importQuestions() {
  console.log("[v0] Starting trivia import from The Trivia API...")
  console.log("[v0] Target: ~5,000 questions across all categories and difficulties")

  let totalImported = 0
  let totalSkipped = 0

  // Categories available in The Trivia API
  const apiCategories = [
    "music",
    "film_and_tv",
    "food_and_drink",
    "general_knowledge",
    "geography",
    "history",
    "science",
    "sport_and_leisure",
    "arts_and_literature",
    "society_and_culture",
  ]

  const difficulties = ["easy", "medium", "hard"]

  // Calculate batches: 10 categories × 3 difficulties × ~170 questions = ~5100 questions
  const questionsPerBatch = 50 // Max per API call
  const batchesPerDifficultyPerCategory = 4 // 4 batches × 50 = 200 questions per difficulty per category

  for (const apiCategory of apiCategories) {
    for (const difficulty of difficulties) {
      console.log(`\n[v0] Fetching ${difficulty} questions for ${apiCategory}...`)

      for (let batch = 0; batch < batchesPerDifficultyPerCategory; batch++) {
        try {
          // Fetch batch of questions
          const questions = await fetchQuestions(questionsPerBatch, [apiCategory], difficulty)

          if (questions.length === 0) {
            console.log(`[v0] No more questions available for ${apiCategory} - ${difficulty}`)
            break
          }

          // Convert and insert questions
          let batchImported = 0
          let batchSkipped = 0

          for (const q of questions) {
            const converted = convertToMultipleChoice(q)

            try {
              await sql`
                INSERT INTO trivia_questions (
                  question, option_a, option_b, option_c, option_d, 
                  correct_answer, category, difficulty
                )
                VALUES (
                  ${converted.question}, ${converted.option_a}, ${converted.option_b}, 
                  ${converted.option_c}, ${converted.option_d}, ${converted.correct_answer}, 
                  ${converted.category}, ${converted.difficulty}
                )
              `
              batchImported++
              totalImported++
            } catch (error) {
              // Skip duplicates or errors
              if (error.message.includes("duplicate") || error.message.includes("unique")) {
                batchSkipped++
                totalSkipped++
              } else {
                console.log(`[v0] Error importing question: ${error.message}`)
              }
            }
          }

          console.log(
            `[v0] Batch ${batch + 1}/${batchesPerDifficultyPerCategory}: Imported ${batchImported}, Skipped ${batchSkipped} (Total: ${totalImported})`,
          )

          // Small delay to be respectful (no rate limit but still good practice)
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.log(`[v0] Error fetching batch: ${error.message}`)
          break
        }
      }
    }
  }

  console.log(`\n[v0] ========================================`)
  console.log(`[v0] Import complete!`)
  console.log(`[v0] Total questions imported: ${totalImported}`)
  console.log(`[v0] Total questions skipped (duplicates): ${totalSkipped}`)
  console.log(`[v0] ========================================\n`)

  // Show final counts
  const counts = await sql`
    SELECT category, difficulty, COUNT(*) as count
    FROM trivia_questions
    GROUP BY category, difficulty
    ORDER BY category, difficulty
  `

  console.log("[v0] Final question counts by category and difficulty:")
  console.table(counts)

  const totalCount = await sql`
    SELECT COUNT(*) as total FROM trivia_questions
  `

  console.log(`\n[v0] Total questions in database: ${totalCount[0].total}`)
}

importQuestions().catch(console.error)
