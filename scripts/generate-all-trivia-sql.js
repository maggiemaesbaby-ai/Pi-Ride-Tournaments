import { writeFileSync } from "fs"

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
    .replace(/&eacute;/g, "é")
    .replace(/&Eacute;/g, "É")
    .replace(/&ouml;/g, "ö")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&aring;/g, "å")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;s/g, "'s")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "—")
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

// Convert question to SQL INSERT
function convertToSQL(question) {
  const allAnswers = [question.correct_answer, ...question.incorrect_answers]
  const shuffled = shuffleArray(allAnswers)
  const correctIndex = shuffled.indexOf(question.correct_answer)
  const correctLetter = ["A", "B", "C", "D"][correctIndex]

  const difficulty = {
    easy: "rookie",
    medium: "pro",
    hard: "legend",
  }[question.difficulty]

  const questionText = escapeSql(decodeHTML(question.question))
  const optionA = escapeSql(decodeHTML(shuffled[0]))
  const optionB = escapeSql(decodeHTML(shuffled[1]))
  const optionC = escapeSql(decodeHTML(shuffled[2]))
  const optionD = escapeSql(decodeHTML(shuffled[3]))

  return `('${questionText}', '${optionA}', '${optionB}', '${optionC}', '${optionD}', '${correctLetter}', 'general', '${difficulty}')`
}

// All 9 JSON batches (pasted directly from your files)
const batches = [
  // Your 9 remaining JSON responses would go here
]

console.log("[v0] Generating SQL INSERT statements for all 450 questions...")

let sql = `-- =====================================================
-- BATCHES 2-10: General Knowledge Questions (~450 questions)
-- From Open Trivia Database
-- =====================================================

INSERT INTO trivia_questions (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty) VALUES
`

const values = []
let totalQuestions = 0

for (let batchNum = 0; batchNum < batches.length; batchNum++) {
  const batch = batches[batchNum]
  console.log(`[v0] Processing batch ${batchNum + 2}... (${batch.results.length} questions)`)

  for (const question of batch.results) {
    values.push(convertToSQL(question))
    totalQuestions++
  }
}

sql += values.join(",\n")
sql += ";\n"

// Write to file
const outputFile = "batches-2-10-trivia-questions.sql"
writeFileSync(outputFile, sql)

console.log(`[v0] ✓ Generated SQL script with ${totalQuestions} questions`)
console.log(`[v0] ✓ Saved to: ${outputFile}`)
console.log(`[v0] Copy and paste this entire SQL script into Supabase SQL Editor!`)
