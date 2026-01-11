import { neon } from "@neondatabase/serverless"

// Initialize database connection
const sql = neon(process.env.NEON_POSTGRES_URL)

// Category mapping: Open Trivia DB → Our database
const CATEGORY_MAP = {
  9: "general", // General Knowledge
  17: "science", // Science & Nature
  21: "sports", // Sports
  22: "geography", // Geography
  23: "history", // History
  25: "arts", // Art
  11: "entertainment", // Film
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
  const entities = {
    "&quot;": '"',
    "&#039;": "'",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&rsquo;": "'",
    "&lsquo;": "'",
    "&ldquo;": '"',
    "&rdquo;": '"',
  }
  return text.replace(/&[#\w]+;/g, (match) => entities[match] || match)
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
async function importQuestions(questions, dbCategory) {
  console.log(`[v0] Importing ${questions.length} questions into category '${dbCategory}'...`)

  let imported = 0
  let skipped = 0

  for (const q of questions) {
    try {
      // Decode HTML entities
      const question = decodeHTML(q.question)
      const correctAnswer = decodeHTML(q.correct_answer)
      const incorrectAnswers = q.incorrect_answers.map((a) => decodeHTML(a))

      // Shuffle answers and determine correct position
      const allAnswers = [correctAnswer, ...incorrectAnswers]
      const shuffled = allAnswers.sort(() => Math.random() - 0.5)
      const correctIndex = shuffled.indexOf(correctAnswer)
      const correctLetter = ["A", "B", "C", "D"][correctIndex]

      // Map difficulty
      const difficulty = DIFFICULTY_MAP[q.difficulty] || "pro"

      // Insert into database
      await sql`
        INSERT INTO trivia_questions (
          question, 
          option_a, 
          option_b, 
          option_c, 
          option_d, 
          correct_answer, 
          category, 
          difficulty
        ) VALUES (
          ${question},
          ${shuffled[0]},
          ${shuffled[1]},
          ${shuffled[2]},
          ${shuffled[3]},
          ${correctLetter},
          ${dbCategory},
          ${difficulty}
        )
      `

      imported++
    } catch (error) {
      console.log(`[v0] Error importing question: ${error.message}`)
      skipped++
    }
  }

  console.log(`[v0] Imported: ${imported}, Skipped: ${skipped}`)
  return imported
}

// Main import function
async function main() {
  console.log("[v0] Starting trivia question import from Open Trivia Database...\n")

  let totalImported = 0

  // Import questions for each category and difficulty
  for (const [categoryId, dbCategory] of Object.entries(CATEGORY_MAP)) {
    console.log(`\n[v0] Processing category: ${dbCategory} (ID: ${categoryId})`)

    for (const difficulty of ["easy", "medium", "hard"]) {
      const questions = await fetchQuestionsFromAPI(categoryId, difficulty, 50)

      if (questions.length > 0) {
        const imported = await importQuestions(questions, dbCategory)
        totalImported += imported
      }

      // Rate limit: wait 5 seconds between requests to respect API limits
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }

  console.log(`\n[v0] Import complete! Total questions imported: ${totalImported}`)

  // Show final counts
  const counts = await sql`
    SELECT category, difficulty, COUNT(*) as count
    FROM trivia_questions
    GROUP BY category, difficulty
    ORDER BY category, difficulty
  `

  console.log("\n[v0] Current question counts:")
  console.table(counts)
}

// Run the import
main().catch((error) => {
  console.error("[v0] Import failed:", error)
  process.exit(1)
})
