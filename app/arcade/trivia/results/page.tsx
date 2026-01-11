"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Clock, Target, Home } from "lucide-react"

export default function TriviaResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const progressId = searchParams.get("progressId")
  const score = searchParams.get("score")
  const time = searchParams.get("time")

  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      const response = await fetch(`/api/arcade/trivia/results?progressId=${progressId}`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Failed to load results:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold">Loading Results...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-blue-900 p-4 flex items-center justify-center">
      <Card className="p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <Trophy className="w-24 h-24 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-4xl font-bold mb-2">Game Over!</h1>
          <p className="text-xl text-muted-foreground">
            {results?.is_free_play ? "Free Play Complete" : "Tournament Complete"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="p-6 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-3xl font-bold">{results?.correct_answers || 0}</div>
            <div className="text-sm text-muted-foreground">Correct Answers</div>
            <div className="text-xs text-muted-foreground mt-1">out of {results?.total_questions || 30}</div>
          </Card>

          <Card className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-3xl font-bold">
              {Math.floor(Number.parseFloat(time || "0") / 60)}:
              {(Number.parseFloat(time || "0") % 60).toFixed(1).padStart(4, "0")}
            </div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </Card>
        </div>

        {/* Level Breakdown */}
        <div className="space-y-3 mb-8">
          <h3 className="font-bold text-lg">Level Breakdown</h3>
          {[1, 2, 3].map((level) => (
            <Card key={level} className="p-4">
              <div className="flex justify-between items-center">
                <div className="font-bold">Level {level}</div>
                <div className="text-sm text-muted-foreground">
                  Time: {results?.[`level_${level}_time`]?.toFixed(1)}s
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Final Score */}
        {!results?.is_free_play && (
          <Card className="p-6 text-center mb-8 bg-gradient-to-r from-yellow-400 to-orange-500">
            <div className="text-sm text-white/80 mb-2">Final Score</div>
            <div className="text-5xl font-bold text-white">{score}</div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => router.push("/arcade")} size="lg" className="flex-1">
            <Home className="mr-2 h-5 w-5" />
            Return to Arcade
          </Button>
        </div>
      </Card>
    </div>
  )
}
