import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL)

// Category mapping: The Trivia API → Your Database
const CATEGORY_MAP = {
  general_knowledge: "general",
  science: "science",
  sport_and_leisure: "sports",
  geography: "geography",
  history: "history",
  arts_and_literature: "arts",
  film_and_tv: "entertainment",
  music: "entertainment",
  food_and_drink: "general",
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

async function fetchTriviaBatch(category, difficulty, limit = 50) {
  const url = `https://the-trivia-api.com/v2/questions?categories=${category}&difficulties=${difficulty}&limit=${limit}`

  console.log(`[v0] Fetching from: ${url}`)
  const response = await fetch(url)
  const data = await response.json()

  return data
}

function convertToMultipleChoice(question) {
  const allAnswers = [question.correctAnswer, ...question.incorrectAnswers]

  const shuffled = shuffleArray(allAnswers)
  const correctIndex = shuffled.indexOf(question.correctAnswer)
  const correctLetter = ["A", "B", "C", "D"][correctIndex]

  return {
    question: question.question.text,
    option_a: shuffled[0],
    option_b: shuffled[1],
    option_c: shuffled[2],
    option_d: shuffled[3],
    correct_answer: correctLetter,
    category: CATEGORY_MAP[question.category] || "general",
    difficulty: DIFFICULTY_MAP[question.difficulty] || "pro",
  }
}

async function importQuestions() {
  console.log("[v0] Starting trivia import from The Trivia API...")
  console.log("[v0] Target: ~5,000 questions across 10 categories and 3 difficulties")

  let totalImported = 0
  let totalSkipped = 0
  const categories = Object.keys(CATEGORY_MAP)
  const difficulties = ["easy", "medium", "hard"]

  for (const apiCategory of categories) {
    for (const difficulty of difficulties) {
      console.log(`\n[v0] === Processing ${apiCategory} (${difficulty}) ===`)

      // Fetch 4 batches of 50 questions = 200 per difficulty per category
      for (let batch = 1; batch <= 4; batch++) {
        console.log(`[v0] Batch ${batch}/4 for ${apiCategory} (${difficulty})...`)

        try {
          const questions = await fetchTriviaBatch(apiCategory, difficulty, 50)

          if (!questions || questions.length === 0) {
            console.log(`[v0] No questions returned for batch ${batch}`)
            continue
          }

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
              if (error.message.includes("duplicate") || error.message.includes("unique")) {
                batchSkipped++
                totalSkipped++
              } else {
                console.log(`[v0] Error importing question: ${error.message}`)
              }
            }
          }

          console.log(
            `[v0] ✓ Batch ${batch} complete: ${batchImported} imported, ${batchSkipped} skipped (Running total: ${totalImported})`,
          )

          // Small delay between batches
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.log(`[v0] Error fetching batch ${batch}: ${error.message}`)
        }
      }
    }
  }

  console.log(`\n[v0] ========================================`)
  console.log(`[v0] Import Complete!`)
  console.log(`[v0] Total imported: ${totalImported}`)
  console.log(`[v0] Total skipped (duplicates): ${totalSkipped}`)
  console.log(`[v0] ========================================\n`)

  // Show final counts by category and difficulty
  const counts = await sql`
    SELECT category, difficulty, COUNT(*) as count
    FROM trivia_questions
    GROUP BY category, difficulty
    ORDER BY category, difficulty
  `

  console.log("[v0] Final question counts by category and difficulty:")
  console.table(counts)

  // Show grand total
  const total = await sql`
    SELECT COUNT(*) as total FROM trivia_questions
  `

  console.log(`\n[v0] Grand Total Questions in Database: ${total[0].total}`)
}

importQuestions().catch(console.error)
