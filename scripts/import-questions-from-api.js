import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL)

// Category mapping: Open Trivia DB ID → Your Database
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

// Difficulty mapping
const DIFFICULTY_MAP = {
  easy: "rookie",
  medium: "pro",
  hard: "legend",
}

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

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

async function fetchQuestions(categoryId, difficulty, amount = 50) {
  const url = `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&difficulty=${difficulty}&type=multiple`
  console.log(`[v0] Fetching ${amount} ${difficulty} questions for category ${categoryId}...`)

  const response = await fetch(url)
  const data = await response.json()

  if (data.response_code !== 0) {
    console.log(`[v0] No questions available (code ${data.response_code})`)
    return []
  }

  return data.results
}

function convertQuestion(question) {
  const allAnswers = [question.correct_answer, ...question.incorrect_answers]
  const shuffled = shuffleArray(allAnswers)
  const correctIndex = shuffled.indexOf(question.correct_answer)
  const correctLetter = ["A", "B", "C", "D"][correctIndex]

  return {
    question: decodeHTML(question.question),
    option_a: decodeHTML(shuffled[0]),
    option_b: decodeHTML(shuffled[1]),
    option_c: decodeHTML(shuffled[2]),
    option_d: decodeHTML(shuffled[3]),
    correct_answer: correctLetter,
    category: CATEGORY_MAP[Number.parseInt(question.category)],
    difficulty: DIFFICULTY_MAP[question.difficulty],
  }
}

async function importQuestions() {
  console.log("[v0] Starting trivia import from Open Trivia Database...\n")

  let totalImported = 0
  let totalSkipped = 0
  const categories = [9, 17, 21, 22, 23, 25, 11, 14, 12]
  const difficulties = ["easy", "medium", "hard"]

  for (const categoryId of categories) {
    for (const difficulty of difficulties) {
      const questions = await fetchQuestions(categoryId, difficulty, 50)

      if (questions.length === 0) {
        console.log(`[v0] Skipping ${difficulty} for category ${categoryId} - no questions\n`)
        continue
      }

      for (const q of questions) {
        try {
          const converted = convertQuestion(q)

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

      // Respect API rate limits
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

importQuestions().catch((error) => {
  console.error("[v0] Fatal error:", error)
})
