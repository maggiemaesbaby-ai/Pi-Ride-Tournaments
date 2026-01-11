import { neon } from "@neondatabase/serverless"

// Initialize database connection
const sql = neon(process.env.NEON_DATABASE_URL)

// Category mapping: Open Trivia DB → Our database
const CATEGORY_MAP = {
  9: "general", // General Knowledge
  17: "science", // Science & Nature
  21: "sports", // Sports
  22: "geography", // Geography
  23: "history", // History
  25: "arts", // Art
  11: "entertainment", // Film
  14: "entertainment", // Television
  12: "entertainment", // Music
}

// Difficulty mapping: Open Trivia DB → Our database
const DIFFICULTY_MAP = {
  easy: "rookie",
  medium: "pro",
  hard: "legend",
}

// Decode HTML entities
function decodeHTML(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ouml;/g, "ö")
    .replace(/&aring;/g, "å")
    .replace(/&auml;/g, "ä")
    .replace(/&eacute;/g, "é")
    .replace(/&Eacute;/g, "É")
}

// Fetch questions from Open Trivia Database
async function fetchQuestionsFromAPI(categoryId, difficulty, amount = 50) {
  const url = `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&difficulty=${difficulty}&type=multiple`

  console.log(`[v0] Fetching ${amount} ${difficulty} questions for category ${categoryId}...`)

  const response = await fetch(url)
  const data = await response.json()

  if (data.response_code !== 0) {
    console.log(
      `[v0] Warning: API returned code ${data.response_code} for category ${categoryId}, difficulty ${difficulty}`,
    )
    return []
  }

  return data.results
}

// Transform and insert questions into database
async function importQuestions() {
  console.log("[v0] Starting trivia import from Open Trivia Database...\n")

  let totalImported = 0
  let totalSkipped = 0
  const categories = Object.keys(CATEGORY_MAP).map(Number)
  const difficulties = ["easy", "medium", "hard"]

  for (const categoryId of categories) {
    for (const difficulty of difficulties) {
      const questions = await fetchQuestionsFromAPI(categoryId, difficulty, 50)

      if (questions.length === 0) {
        console.log(`[v0] Skipping ${difficulty} for category ${categoryId} - no questions\n`)
        continue
      }

      for (const q of questions) {
        try {
          const allAnswers = [q.correct_answer, ...q.incorrect_answers]
          const shuffled = [...allAnswers].sort(() => Math.random() - 0.5)
          const correctIndex = shuffled.indexOf(q.correct_answer)
          const correctLetter = ["A", "B", "C", "D"][correctIndex]

          await sql`
            INSERT INTO trivia_questions (
              question, option_a, option_b, option_c, option_d, 
              correct_answer, category, difficulty
            )
            VALUES (
              ${decodeHTML(q.question)}, ${decodeHTML(shuffled[0])}, ${decodeHTML(shuffled[1])}, 
              ${decodeHTML(shuffled[2])}, ${decodeHTML(shuffled[3])}, ${correctLetter}, 
              ${CATEGORY_MAP[categoryId]}, ${DIFFICULTY_MAP[difficulty]}
            )
          `
          totalImported++
        } catch (error) {
          if (error.message.includes("duplicate")) {
            totalSkipped++
          } else {
            console.log(`[v0] Error: ${error.message}`)
          }
        }
      }

      console.log(`[v0] ✓ Category ${categoryId} ${difficulty}: Imported ${questions.length} questions`)

      // Respect API rate limits - 5 second delay between requests
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }

  console.log(`\n[v0] ======================================`)
  console.log(`[v0] Import Complete!`)
  console.log(`[v0] Total Imported: ${totalImported}`)
  console.log(`[v0] Total Skipped (duplicates): ${totalSkipped}`)
  console.log(`[v0] ======================================\n`)

  // Show final counts
  const counts = await sql`
    SELECT category, difficulty, COUNT(*) as count
    FROM trivia_questions
    GROUP BY category, difficulty
    ORDER BY category, difficulty
  `

  console.log("[v0] Final question counts:")
  console.table(counts)
}

// Run the import
importQuestions().catch((error) => {
  console.error("[v0] Fatal error:", error)
})
