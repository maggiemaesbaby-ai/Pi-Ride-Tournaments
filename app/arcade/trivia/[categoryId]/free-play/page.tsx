"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TriviaFreePlay() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const [startTime] = useState(Date.now())
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [autoCompleteTimer, setAutoCompleteTimer] = useState<NodeJS.Timeout | null>(null)
  const [showLevelTransition, setShowLevelTransition] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(1)

  console.log("[v0] TRIVIA FREE PLAY - Component mounted!", { params })

  useEffect(() => {
    console.log("[v0] TRIVIA FREE PLAY - useEffect running")

    const categoryId = params.categoryId as string
    const dbCategory = categoryId === "general-knowledge" ? "general" : categoryId

    console.log("[v0] TRIVIA FREE PLAY - Fetching questions", { categoryId, dbCategory })

    fetch(`/api/arcade/trivia/questions?category=${dbCategory}&count=10&freePlay=true`)
      .then((res) => {
        console.log("[v0] TRIVIA FREE PLAY - Got response", { status: res.status })
        return res.json()
      })
      .then((data) => {
        console.log("[v0] TRIVIA FREE PLAY - Got data", { data })
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions)
          setGameStartTime(Date.now())
          setLoading(false)

          const timer = setTimeout(
            () => {
              console.log("[v0] TRIVIA - 7 minutes elapsed, auto-completing game")
              handleAutoComplete()
            },
            7 * 60 * 1000,
          )
          setAutoCompleteTimer(timer)
        } else {
          setError(data.error || "No questions found")
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error("[v0] TRIVIA FREE PLAY - Error", err)
        setError(err.message)
        setLoading(false)
      })

    // Cleanup timer on unmount
    return () => {
      if (autoCompleteTimer) {
        clearTimeout(autoCompleteTimer)
      }
    }
  }, [params])

  useEffect(() => {
    if (gameComplete && typeof window !== "undefined") {
      console.log("[v0] 🧹 Free Play - Cleaning up localStorage")
      // Clean up any stale tournament data
      const keysToCheck = Object.keys(localStorage).filter(
        (key) => key.includes("tournament_entry") || key.includes("platform_choice") || key.includes("recent_payment"),
      )
      keysToCheck.forEach((key) => {
        localStorage.removeItem(key)
        console.log(`[v0] Removed stale key: ${key}`)
      })
    }
  }, [gameComplete])

  const handleAutoComplete = () => {
    const totalTime = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0
    console.log("[v0] TRIVIA - Auto-completing game after 7 minutes", {
      correctAnswers,
      totalQuestions: questions.length,
      totalTime,
    })
    setGameComplete(true)
    if (autoCompleteTimer) {
      clearTimeout(autoCompleteTimer)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return // Already answered

    setSelectedAnswer(answer)

    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = answer === currentQuestion.correct_answer

    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1)
    }

    console.log("[v0] TRIVIA - Answer selected", {
      question: currentQuestionIndex + 1,
      answer,
      correct: currentQuestion.correct_answer,
      isCorrect,
    })

    // Move to next question after 1.5 seconds
    setTimeout(() => {
      if (currentQuestionIndex === 5 && currentLevel === 1) {
        // End of level 1, show transition to level 2
        setShowLevelTransition(true)
        setTimeout(() => {
          setShowLevelTransition(false)
          setCurrentLevel(2)
          setCurrentQuestionIndex(currentQuestionIndex + 1)
          setSelectedAnswer(null)
        }, 2000)
      } else if (currentQuestionIndex === 11 && currentLevel === 2) {
        // End of level 2, show transition to level 3
        setShowLevelTransition(true)
        setTimeout(() => {
          setShowLevelTransition(false)
          setCurrentLevel(3)
          setCurrentQuestionIndex(currentQuestionIndex + 1)
          setSelectedAnswer(null)
        }, 2000)
      } else if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedAnswer(null)
      } else {
        // Game complete
        const totalTime = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0
        console.log("[v0] TRIVIA - Game completed", {
          correctAnswers: correctAnswers + (isCorrect ? 1 : 0),
          totalQuestions: questions.length,
          totalTime,
        })
        setGameComplete(true)
        if (autoCompleteTimer) {
          clearTimeout(autoCompleteTimer)
        }
      }
    }, 1500)
  }

  const getElapsedTime = () => {
    if (!gameStartTime) return 0
    return Math.floor((Date.now() - gameStartTime) / 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="p-8 bg-slate-800/50 border-purple-500/20">
          <h1 className="text-3xl font-bold text-white mb-4">Loading IQ Arena...</h1>
          <p className="text-slate-300">Category: {params.categoryId as string}</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="p-8 bg-slate-800/50 border-purple-500/20 text-center">
          <h1 className="text-3xl font-bold text-red-400 mb-4">Error Loading Questions</h1>
          <p className="text-slate-300 mb-6">{error}</p>
          <Button onClick={() => router.push("/arcade/trivia")} variant="outline">
            Back to Categories
          </Button>
        </Card>
      </div>
    )
  }

  if (gameComplete) {
    const totalTime = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0
    const finalCorrectAnswers =
      selectedAnswer && selectedAnswer === questions[currentQuestionIndex]?.correct_answer
        ? correctAnswers + 1
        : correctAnswers
    const accuracy = ((finalCorrectAnswers / questions.length) * 100).toFixed(1)
    const score = finalCorrectAnswers * 100 + Math.max(0, 300 - totalTime)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="p-8 bg-slate-800/50 border-purple-500/20 max-w-2xl w-full">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">🎉 Game Complete!</h1>
            <p className="text-slate-300 mb-8">Free Play - {params.categoryId as string}</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-700/50 p-6 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Score</p>
                <p className="text-3xl font-bold text-purple-400">{Math.round(score)}</p>
              </div>
              <div className="bg-slate-700/50 p-6 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Accuracy</p>
                <p className="text-3xl font-bold text-green-400">{accuracy}%</p>
              </div>
              <div className="bg-slate-700/50 p-6 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Correct</p>
                <p className="text-3xl font-bold text-blue-400">
                  {finalCorrectAnswers}/{questions.length}
                </p>
              </div>
              <div className="bg-slate-700/50 p-6 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Time</p>
                <p className="text-3xl font-bold text-orange-400">{totalTime.toFixed(1)}s</p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push(`/arcade/trivia/${params.categoryId}/free-play`)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Play Again
              </Button>
              <Button onClick={() => router.push("/arcade/trivia")} variant="outline">
                Back to Categories
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (showLevelTransition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="p-12 bg-gradient-to-r from-yellow-400 to-orange-500 border-none text-center">
          <h1 className="text-4xl font-bold text-white mb-4">🎉 Level {currentLevel} Complete!</h1>
          <p className="text-2xl text-white font-semibold">Level {currentLevel + 1} Begins Now</p>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const options = [
    { label: "A", text: currentQuestion.option_a },
    { label: "B", text: currentQuestion.option_b },
    { label: "C", text: currentQuestion.option_c },
    { label: "D", text: currentQuestion.option_d },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button onClick={() => router.push("/arcade/trivia")} variant="ghost" className="text-white">
            ← Back
          </Button>
          <div className="text-white text-sm">
            <span className="text-slate-400">Time:</span> {getElapsedTime()}s
          </div>
        </div>

        <Card className="p-8 bg-slate-800/50 border-purple-500/20">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-purple-400 font-semibold">
                Level {currentLevel} - Question {currentQuestionIndex % 6 || 6} of 6
              </span>
              <span className="text-slate-400 text-sm">Score: {correctAnswers * 100}</span>
            </div>

            <div className="w-full bg-slate-700 rounded-full h-2 mb-6">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <h2 className="text-2xl font-bold text-white mb-8">{currentQuestion.question}</h2>

            <div className="space-y-3">
              {options.map((option) => {
                const isSelected = selectedAnswer === option.label
                const isCorrect = option.label === currentQuestion.correct_answer
                const showResult = selectedAnswer !== null

                let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all "
                if (!showResult) {
                  buttonClass +=
                    "border-slate-600 bg-slate-700/50 hover:border-purple-500 hover:bg-slate-700 text-white"
                } else if (isCorrect) {
                  buttonClass += "border-green-500 bg-green-500/20 text-white"
                } else if (isSelected && !isCorrect) {
                  buttonClass += "border-red-500 bg-red-500/20 text-white"
                } else {
                  buttonClass += "border-slate-600 bg-slate-700/50 text-slate-400"
                }

                return (
                  <button
                    key={option.label}
                    onClick={() => handleAnswerSelect(option.label)}
                    disabled={selectedAnswer !== null}
                    className={buttonClass}
                  >
                    <span className="font-bold mr-3">{option.label}.</span>
                    {option.text}
                    {showResult && isCorrect && <span className="float-right">✓</span>}
                    {showResult && isSelected && !isCorrect && <span className="float-right">✗</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-slate-400 text-sm text-center mt-6">💡 Game auto-completes after 7 minutes</p>
        </Card>
      </div>
    </div>
  )
}
