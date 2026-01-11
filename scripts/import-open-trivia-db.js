import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL)

// Category mapping: Open Trivia DB → Your Database
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

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function decodeHTML(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
}

function convertToMultipleChoice(question) {
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
    category: CATEGORY_MAP[question.category],
    difficulty: DIFFICULTY_MAP[question.difficulty],
  }
}

async function fetchTriviaQuestions(categoryId, difficulty, amount = 50) {
  const url = `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&difficulty=${difficulty}&type=multiple`

  console.log(`[v0] Fetching from: ${url}`)

  const response = await fetch(url)
  const data = await response.json()

  if (data.response_code !== 0) {
    console.log(`[v0] No questions available for category ${categoryId}, difficulty ${difficulty}`)
    return []
  }

  return data.results
}

async function importQuestions() {
  console.log("[v0] Starting trivia import from Open Trivia Database...")

  let totalImported = 0
  const categories = [9, 17, 21, 22, 23, 25, 11, 14, 12]
  const difficulties = ["easy", "medium", "hard"]

  for (const categoryId of categories) {
    const dbCategory = CATEGORY_MAP[categoryId]
    console.log(`\n[v0] Processing category ${categoryId} (${dbCategory})...`)

    for (const difficulty of difficulties) {
      const dbDifficulty = DIFFICULTY_MAP[difficulty]
      console.log(`[v0] Fetching ${difficulty} (${dbDifficulty}) questions...`)

      try {
        // Fetch questions
        const questions = await fetchTriviaQuestions(categoryId, difficulty, 50)

        if (questions.length === 0) {
          console.log(`[v0] No questions returned, skipping...`)
          continue
        }

        console.log(`[v0] Received ${questions.length} questions, converting...`)

        // Convert and insert questions
        const converted = questions.map((q) => convertToMultipleChoice(q))

        for (const q of converted) {
          try {
            await sql`
              INSERT INTO trivia_questions (
                question, option_a, option_b, option_c, option_d, 
                correct_answer, category, difficulty
              )
              VALUES (
                ${q.question}, ${q.option_a}, ${q.option_b}, ${q.option_c}, ${q.option_d},
                ${q.correct_answer}, ${q.category}, ${q.difficulty}
              )
            `
            totalImported++
          } catch (error) {
            console.log(`[v0] Error importing question: ${error.message}`)
          }
        }

        console.log(`[v0] ✓ Imported ${converted.length} ${dbDifficulty} questions for ${dbCategory}`)

        // Respect API rate limits (5 seconds between requests)
        await new Promise((resolve) => setTimeout(resolve, 5000))
      } catch (error) {
        console.log(`[v0] Error processing category ${categoryId}, difficulty ${difficulty}: ${error.message}`)
      }
    }
  }

  console.log(`\n[v0] ========================================`)
  console.log(`[v0] Import complete! Total questions imported: ${totalImported}`)
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
}

importQuestions().catch(console.error)
