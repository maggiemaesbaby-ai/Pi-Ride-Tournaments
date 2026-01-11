"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Pause, Play } from "lucide-react"

const QUESTIONS_PER_LEVEL = 6
const TOURNAMENT_TIME_LIMIT = 180 // 3 minutes in seconds
const MAX_GAME_TIME = 2 * 60 // 2 minutes auto-complete

const TRIVIA_CATEGORIES: Record<string, { name: string; icon: string; dbCategory: string }> = {
  "general-knowledge": { name: "General Knowledge", icon: "🌍", dbCategory: "general_knowledge" },
  science: { name: "Science & Nature", icon: "🔬", dbCategory: "science_tech" },
  history: { name: "History", icon: "📜", dbCategory: "history_geography" },
  entertainment: { name: "Entertainment", icon: "🎬", dbCategory: "entertainment" },
  sports: { name: "Sports", icon: "⚽", dbCategory: "sports" },
  geography: { name: "Geography", icon: "🗺️", dbCategory: "history_geography" },
}

interface Question {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
}

interface GameState {
  currentLevel: number
  currentQuestionIndex: number
  questions: Question[]
  level1Answers: { questionId: string; answer: string; correct: boolean }[]
  level2Answers: { questionId: string; answer: string; correct: boolean }[]
  level3Answers: { questionId: string; answer: string; correct: boolean }[]
  level1Time: number
  level2Time: number
  level3Time: number
  correctAnswers: number
  isPaused: boolean
  isCompleted: boolean
  pauseStartTime: number | null
}

export default function TriviaPlayPage() {
  console.log("[v0] IQ Arena TOURNAMENT PAGE - Component mounting/rendering")

  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = params.categoryId as string
  const tier = searchParams.get("tier") || "bronze"
  const isFreePlay = searchParams.get("freeplay") === "true"
  const entryId = searchParams.get("entryId")

  console.log("[v0] IQ Arena TOURNAMENT PAGE - URL params:", {
    categoryId,
    tier,
    isFreePlay,
    entryId,
    allSearchParams: Object.fromEntries(searchParams.entries()),
  })

  const category = TRIVIA_CATEGORIES[categoryId] || { name: "Trivia", icon: "🧠", dbCategory: categoryId }
  const dbCategory = category.dbCategory

  console.log("[v0] IQ Arena TOURNAMENT PAGE - Category resolved:", {
    categoryId,
    dbCategory,
    categoryName: category.name,
  })

  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    currentQuestionIndex: 0,
    questions: [],
    level1Answers: [],
    level2Answers: [],
    level3Answers: [],
    level1Time: 0,
    level2Time: 0,
    level3Time: 0,
    correctAnswers: 0,
    isPaused: false,
    isCompleted: false,
    pauseStartTime: null,
  })

  const [loading, setLoading] = useState(true)
  const [progressId, setProgressId] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [pauseTimeRemaining, setPauseTimeRemaining] = useState(180) // 3 minutes in seconds
  const [totalGameTime, setTotalGameTime] = useState(0) // Track total game time including pauses
  const [showLevelTransition, setShowLevelTransition] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const totalGameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const levelStartTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    console.log("[v0] IQ Arena TOURNAMENT PAGE - useEffect triggered, calling loadGameSession")
    loadGameSession()
  }, [])

  useEffect(() => {
    if (!gameState.isPaused && !gameState.isCompleted && !loading) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 0.1)
      }, 100)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState.isPaused, gameState.isCompleted, loading])

  useEffect(() => {
    if (isFreePlay && gameState.isPaused && !gameState.isCompleted) {
      pauseTimerRef.current = setInterval(() => {
        setPauseTimeRemaining((prev) => {
          if (prev <= 0.1) {
            console.log("[v0] ⏱️ Pause timer expired - auto-completing game")
            handleGameComplete()
            return 0
          }
          return prev - 0.1
        })
      }, 100)
    } else {
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current)
      }
    }

    return () => {
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current)
      }
    }
  }, [isFreePlay, gameState.isPaused, gameState.isCompleted])

  useEffect(() => {
    if (!gameState.isCompleted && !loading) {
      totalGameTimerRef.current = setInterval(() => {
        setTotalGameTime((prev) => {
          const newTime = prev + 0.1
          if (newTime >= MAX_GAME_TIME) {
            console.log("[v0] ⏱️ 2-minute total game limit reached - game over")
            handleGameComplete()
            return prev
          }
          return newTime
        })
      }, 100)
    } else {
      if (totalGameTimerRef.current) {
        clearInterval(totalGameTimerRef.current)
      }
    }

    return () => {
      if (totalGameTimerRef.current) {
        clearInterval(totalGameTimerRef.current)
      }
    }
  }, [gameState.isCompleted, loading])

  const loadGameSession = async () => {
    try {
      console.log("[v0] IQ Arena TOURNAMENT - Loading game session", {
        categoryId,
        dbCategory,
        tier,
        isFreePlay,
        entryId,
        url: `/api/arcade/trivia/start-game?category=${dbCategory}&tier=${tier}&freeplay=${isFreePlay}&entryId=${entryId || ""}`,
      })

      const response = await fetch(
        `/api/arcade/trivia/start-game?category=${dbCategory}&tier=${tier}&freeplay=${isFreePlay}&entryId=${entryId || ""}`,
      )

      console.log("[v0] IQ Arena TOURNAMENT - API response status", {
        status: response.status,
        ok: response.ok,
      })

      const responseText = await response.text()
      console.log("[v0] IQ Arena TOURNAMENT - Raw API response:", responseText.substring(0, 500))

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError: any) {
        console.error("[v0] IQ Arena TOURNAMENT - Failed to parse JSON:", parseError)
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`)
      }

      console.log("[v0] IQ Arena TOURNAMENT - API response data", {
        success: data.success,
        hasQuestions: !!data.questions,
        questionCount: data.questions?.length,
        progressId: data.progressId,
        error: data.error,
        fullData: data,
      })

      if (data.success && data.questions && data.questions.length > 0) {
        console.log("[v0] IQ Arena TOURNAMENT - Setting game state with questions:", {
          questionCount: data.questions.length,
          firstQuestion: data.questions[0],
        })

        setGameState((prev) => ({
          ...prev,
          questions: data.questions,
        }))
        setProgressId(data.progressId)
        levelStartTimeRef.current = Date.now()
        console.log("[v0] IQ Arena TOURNAMENT - Game session loaded successfully")
      } else {
        console.error("[v0] IQ Arena TOURNAMENT - No questions in response:", data)
        throw new Error(data.error || "No questions loaded from API")
      }
    } catch (error: any) {
      console.error("[v0] IQ Arena TOURNAMENT - Failed to load game", {
        error: error.message,
        stack: error.stack,
      })
      alert(
        `Failed to load game: ${error.message}\n\nThe IQ Arena API endpoints may not be set up yet. Please check the console for details.`,
      )
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback || gameState.isCompleted) return

    setSelectedAnswer(answer)
    const currentQuestion = getCurrentQuestion()
    const isCorrect = answer === currentQuestion.correct_answer

    const answerRecord = {
      questionId: currentQuestion.id,
      answer,
      correct: isCorrect,
    }

    setGameState((prev) => ({
      ...prev,
      [`level${prev.currentLevel}Answers`]: [
        ...(prev[`level${prev.currentLevel}Answers` as keyof GameState] as any[]),
        answerRecord,
      ],
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
    }))

    setShowFeedback(true)

    setTimeout(() => {
      moveToNext(isCorrect)
    }, 1000)
  }

  const moveToNext = async (wasCorrect: boolean) => {
    const levelQuestions = QUESTIONS_PER_LEVEL
    const isLastQuestionInLevel = (gameState.currentQuestionIndex + 1) % levelQuestions === 0
    const levelTime = (Date.now() - levelStartTimeRef.current) / 1000
    const currentLevelProgress = (gameState.currentQuestionIndex % QUESTIONS_PER_LEVEL) + 1

    console.log("[v0] 📝 Question complete - FULL DEBUG:", {
      currentIndex: gameState.currentQuestionIndex,
      nextIndex: gameState.currentQuestionIndex + 1,
      level: gameState.currentLevel,
      questionInLevel: currentLevelProgress,
      isLastInLevel: isLastQuestionInLevel,
      correctAnswers: gameState.correctAnswers,
      totalQuestionsAvailable: gameState.questions.length,
      calculation: `(${gameState.currentQuestionIndex} + 1) % ${levelQuestions} = ${(gameState.currentQuestionIndex + 1) % levelQuestions}`,
      willMoveTo:
        isLastQuestionInLevel && gameState.currentLevel < 3
          ? "Next Level"
          : isLastQuestionInLevel && gameState.currentLevel === 3
            ? "Game Complete"
            : "Next Question",
    })

    // If this is the last question of level 3, complete the game
    if (isLastQuestionInLevel && gameState.currentLevel === 3) {
      console.log("[v0] 🏆 Game Complete - Last question of level 3 answered")
      await handleGameComplete(levelTime)
      return
    }

    // Now check if we have more questions for the next move
    if (gameState.currentQuestionIndex + 1 >= gameState.questions.length) {
      console.error("[v0] ❌ NO MORE QUESTIONS AVAILABLE!", {
        currentIndex: gameState.currentQuestionIndex,
        totalQuestions: gameState.questions.length,
        needsIndex: gameState.currentQuestionIndex + 1,
      })
      alert("Error: No more questions available. The game loaded insufficient questions.")
      return
    }

    if (isLastQuestionInLevel && gameState.currentLevel < 3) {
      console.log("[v0] 🎯 Completing level", gameState.currentLevel, "moving to level", gameState.currentLevel + 1)

      setGameState((prev) => ({
        ...prev,
        [`level${prev.currentLevel}Time`]: levelTime,
      }))

      try {
        await saveProgress(levelTime)
      } catch (error) {
        console.error("[v0] Failed to save level progress:", error)
      }

      setShowLevelTransition(true)
      setShowFeedback(false)
      setSelectedAnswer(null)

      setTimeout(() => {
        setShowLevelTransition(false)
        setGameState((prev) => ({
          ...prev,
          currentLevel: prev.currentLevel + 1,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
        }))
        levelStartTimeRef.current = Date.now()
      }, 3000)
    } else {
      setShowFeedback(false)
      setSelectedAnswer(null)
      setGameState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }))
    }
  }

  const togglePause = async () => {
    if (!isFreePlay) return

    if (gameState.isPaused) {
      setGameState((prev) => ({ ...prev, isPaused: false, pauseStartTime: null }))
      setPauseTimeRemaining(180) // Reset to 3 minutes
    } else {
      setGameState((prev) => ({ ...prev, isPaused: true, pauseStartTime: Date.now() }))
      setPauseTimeRemaining(180) // Reset to 3 minutes
    }
  }

  const saveProgress = async (completedLevelTime?: number) => {
    try {
      await fetch("/api/arcade/trivia/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progressId,
          currentLevel: gameState.currentLevel,
          level1Answers: gameState.level1Answers,
          level2Answers: gameState.level2Answers,
          level3Answers: gameState.level3Answers,
          level1Time: gameState.level1Time,
          level2Time: gameState.level2Time,
          level3Time: completedLevelTime || 0,
          correctAnswers: gameState.correctAnswers,
          isPaused: gameState.isPaused,
          elapsedTime,
          totalGameTime,
        }),
      })
    } catch (error) {
      console.error("Failed to save progress:", error)
    }
  }

  const handleGameComplete = async (finalLevelTime?: number) => {
    const totalTime = elapsedTime
    const levelTime = finalLevelTime || (Date.now() - levelStartTimeRef.current) / 1000

    setGameState((prev) => ({
      ...prev,
      level3Time: levelTime,
      isCompleted: true,
    }))

    const baseScore = gameState.correctAnswers * 1000
    const timeBonus = Math.max(0, Math.floor((TOURNAMENT_TIME_LIMIT - totalTime) * 10))
    const finalScore = baseScore + timeBonus

    console.log("[v0] 🏆 IQ Arena Game complete:", {
      progressId,
      entryId,
      correctAnswers: gameState.correctAnswers,
      baseScore,
      timeBonus,
      finalScore,
      totalTime,
      level1Time: gameState.level1Time,
      level2Time: gameState.level2Time,
      level3Time: levelTime,
    })

    if (window.parent && entryId) {
      console.log("[v0] 🎮 IQ Arena: Sending GAME_COMPLETE message to parent...")
      const message = {
        type: "GAME_COMPLETE",
        gameId: "trivia",
        score: finalScore,
        gameTime: totalTime,
        victory: true,
      }
      console.log("[v0] 🎮 Message being sent:", message)
      window.parent.postMessage(message, "*")
      console.log("[v0] 🎮 postMessage called successfully")
    }

    try {
      if (entryId) {
        console.log("[v0] 🔍 Fetching tournament entry to get user_id...")

        const entryResponse = await fetch(`/api/arcade/tournament/entry/${entryId}`)
        const entryData = await entryResponse.json()

        if (!entryResponse.ok || !entryData.entry) {
          console.error("[v0] ❌ Failed to fetch tournament entry:", entryData)
          throw new Error("Failed to fetch tournament entry")
        }

        const userId = entryData.entry.user_id
        const platform = entryData.entry.platform || "browser"

        console.log("[v0] 🎯 Submitting tournament score:", {
          entryId,
          userId,
          gameId: "trivia",
          score: finalScore,
          platform,
        })

        const scoreResponse = await fetch("/api/arcade/tournament/submit-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryId,
            userId,
            gameId: "trivia",
            score: finalScore,
            platform,
          }),
        })

        const scoreData = await scoreResponse.json()

        if (!scoreResponse.ok) {
          console.error("[v0] ❌ Failed to submit tournament score:", scoreData)
          throw new Error(scoreData.error || "Failed to submit tournament score")
        }

        console.log("[v0] ✅ Tournament score submitted successfully:", scoreData)

        if (typeof window !== "undefined") {
          console.log("[v0] 🔄 Triggering arcade page refresh...")

          // Clear all tournament-related localStorage
          const keysToRemove = [
            `tournament_entry_trivia_${tier}`,
            `tournament_platform_choice_trivia`,
            `recent_payment_trivia`,
            "pwa_tournament_entry",
          ]
          keysToRemove.forEach((key) => {
            localStorage.removeItem(key)
            console.log(`[v0] Removed localStorage key: ${key}`)
          })

          // Set a flag to force refetch on arcade page
          localStorage.setItem("arcade_needs_refresh", "true")

          // Dispatch storage event to notify other tabs/windows
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "arcade_needs_refresh",
              newValue: "true",
            }),
          )

          console.log("[v0] ✅ Refresh flags set, arcade page will refetch on navigation")
        }
      }

      const response = await fetch("/api/arcade/trivia/complete-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progressId,
          entryId,
          correctAnswers: gameState.correctAnswers,
          totalTime,
          level1Time: gameState.level1Time,
          level2Time: gameState.level2Time,
          level3Time: levelTime,
          score: finalScore,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete game")
      }

      console.log("[v0] ✅ Game completed successfully:", data)

      setTimeout(() => {
        if (entryId) {
          router.push("/arcade/dashboard")
        } else {
          router.push(`/arcade/trivia/results?progressId=${progressId}&score=${finalScore}&time=${totalTime}`)
        }
      }, 2000)
    } catch (error) {
      console.error("[v0] ❌ Failed to complete game:", error)
      if (typeof window !== "undefined" && entryId) {
        console.log("[v0] 🧹 Cleaning up tournament localStorage (error path)")
        const keysToRemove = [
          `tournament_entry_trivia_${tier}`,
          `tournament_platform_choice_trivia`,
          `recent_payment_trivia`,
          "pwa_tournament_entry", // Also clear PWA tournament entry
        ]
        keysToRemove.forEach((key) => {
          localStorage.removeItem(key)
        })
      }
      setTimeout(() => {
        router.push("/arcade/dashboard")
      }, 2000)
    }
  }

  const getCurrentQuestion = (): Question => {
    return gameState.questions[gameState.currentQuestionIndex]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="text-center text-white max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400 mx-auto mb-4" />
          <div className="text-xl font-bold mb-4">Loading Game...</div>
          <p className="text-sm text-gray-400 mb-6">
            Setting up your tournament game. If this takes too long, the API endpoints may need to be created.
          </p>
          <Button
            onClick={() => router.push("/arcade/trivia")}
            variant="outline"
            className="text-white border-white/30"
          >
            Back to Categories
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const currentLevelProgress = (gameState.currentQuestionIndex % QUESTIONS_PER_LEVEL) + 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 text-white">
          <div>
            <div className="text-sm opacity-80">Level {gameState.currentLevel}</div>
            <div className="text-2xl font-bold">
              Question {currentLevelProgress} of {QUESTIONS_PER_LEVEL}
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold">
              {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toFixed(1).padStart(4, "0")}
            </div>
            <div className="text-sm opacity-80">Game Time</div>
            <div className="text-xs opacity-60 mt-1">
              Total: {Math.floor(totalGameTime / 60)}:{(totalGameTime % 60).toFixed(0).padStart(2, "0")} / 2:00
            </div>
          </div>
        </div>

        <div className="mb-4 text-white text-center">
          <div className="text-lg">
            Correct: <span className="font-bold text-green-400">{gameState.correctAnswers}</span> /{" "}
            <span className="font-bold">{gameState.currentQuestionIndex + 1}</span>
          </div>
        </div>

        {showLevelTransition && (
          <Card className="p-12 text-center mb-6 bg-gradient-to-r from-yellow-400 to-orange-500">
            <div className="text-3xl font-bold text-white mb-4">Level {gameState.currentLevel} Complete!</div>
            <div className="text-xl text-white">Level {gameState.currentLevel + 1} Begins Now</div>
          </Card>
        )}

        {!showLevelTransition && currentQuestion && (
          <Card className="p-8 mb-6">
            <div className="text-2xl font-bold mb-8 text-center">{currentQuestion.question}</div>

            <div className="space-y-4">
              {["A", "B", "C", "D"].map((letter) => (
                <Button
                  key={letter}
                  onClick={() => handleAnswerSelect(letter)}
                  disabled={showFeedback || gameState.isPaused}
                  className={`w-full h-20 text-xl ${
                    showFeedback && selectedAnswer === letter
                      ? selectedAnswer === currentQuestion.correct_answer
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                      : ""
                  }`}
                  variant={selectedAnswer === letter ? "default" : "outline"}
                >
                  <div className="flex items-center justify-start w-full gap-4">
                    <div className="font-bold text-2xl">{letter}</div>
                    <div className="text-left">
                      {currentQuestion[`option_${letter.toLowerCase()}` as keyof Question]}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        )}

        {isFreePlay && (
          <div className="flex justify-center">
            <Button onClick={togglePause} size="lg" variant="secondary" disabled={showLevelTransition}>
              {gameState.isPaused ? (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Resume Game
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause Game
                </>
              )}
            </Button>
          </div>
        )}

        {isFreePlay && gameState.isPaused && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center">
              <div className="text-4xl mb-4">⏸️</div>
              <div className="text-2xl font-bold mb-4">Game Paused</div>
              <div className="text-gray-600 mb-6">
                Your game clock has stopped. You have {Math.floor(pauseTimeRemaining / 60)}:
                {(pauseTimeRemaining % 60).toFixed(0).padStart(2, "0")} to return or the game will end automatically.
              </div>
              <div className="mb-6">
                <div className="text-5xl font-bold text-orange-500">
                  {Math.floor(pauseTimeRemaining / 60)}:{(pauseTimeRemaining % 60).toFixed(0).padStart(2, "0")}
                </div>
                <div className="text-sm text-gray-500 mt-2">Time to return</div>
              </div>
              <div className="space-y-3">
                <Button onClick={togglePause} className="w-full bg-green-600 hover:bg-green-700">
                  Resume Game
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
