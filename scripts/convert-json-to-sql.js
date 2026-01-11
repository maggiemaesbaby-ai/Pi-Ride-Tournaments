// HTML entity decoder
function decodeHTML(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&deg;/g, "°")
    .replace(/&eacute;/g, "é")
    .replace(/&uuml;/g, "ü")
}

// Shuffle array
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Escape single quotes for SQL
function escapeSql(text) {
  return text.replace(/'/g, "''")
}

// Difficulty mapping
const DIFFICULTY_MAP = {
  easy: "rookie",
  medium: "pro",
  hard: "legend",
}

// Your 10 JSON files content goes here
const jsonData = [
  {
    response_code: 0,
    results: [
      {
        type: "multiple",
        difficulty: "easy",
        category: "General Knowledge",
        question: "What is the largest animal on Earth?",
        correct_answer: "Blue Whale",
        incorrect_answers: ["Elephant", "Giraffe", "Orca"],
      },
      {
        type: "multiple",
        difficulty: "easy",
        category: "General Knowledge",
        question: "What is the capital of France?",
        correct_answer: "Paris",
        incorrect_answers: ["London", "Berlin", "Madrid"],
      },
    ],
  },
  // Add all your other JSON data here...
]

const sqlStatements = []
let questionCount = 0

jsonData.forEach((data, fileIndex) => {
  if (data.results) {
    data.results.forEach((q, qIndex) => {
      // Combine correct and incorrect answers
      const allAnswers = [q.correct_answer, ...q.incorrect_answers]
      const shuffled = shuffleArray(allAnswers)

      // Find which position has the correct answer
      const correctIndex = shuffled.indexOf(q.correct_answer)
      const correctLetter = ["A", "B", "C", "D"][correctIndex]

      // Decode HTML and escape for SQL
      const question = escapeSql(decodeHTML(q.question))
      const optionA = escapeSql(decodeHTML(shuffled[0]))
      const optionB = escapeSql(decodeHTML(shuffled[1]))
      const optionC = escapeSql(decodeHTML(shuffled[2]))
      const optionD = escapeSql(decodeHTML(shuffled[3]))

      // Map difficulty
      const difficulty = DIFFICULTY_MAP[q.difficulty] || "rookie"

      // Create SQL INSERT
      const sql = `INSERT INTO trivia_questions (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty)
VALUES ('${question}', '${optionA}', '${optionB}', '${optionC}', '${optionD}', '${correctLetter}', 'general', '${difficulty}');`

      sqlStatements.push(sql)
      questionCount++

      console.log(`[v0] Processed question ${questionCount} from file ${fileIndex + 1}`)
    })
  }
})

// Write to file
const output = `-- Generated SQL for ${questionCount} trivia questions
-- Run this in Supabase SQL Editor

${sqlStatements.join("\n\n")}

-- Total questions inserted: ${questionCount}`

console.log(output)
console.log(`\n[v0] Successfully converted ${questionCount} questions to SQL`)
