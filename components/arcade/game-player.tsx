"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Pause, Play, Maximize, RotateCcw, Home } from "@/lib/icons"
import { useRouter } from "next/navigation"

interface GamePlayerProps {
  gameId: string
  gameName: string
  onGameComplete: (score: number, completionTime: number) => void
  isTournament: boolean
  matchId?: string | null
  tournamentEntryId?: string | null
  userId?: string
  username?: string
}

const FULLSCREEN_GAMES = [
  "asteroids",
  "galaga",
  "space-invaders",
  "pacman",
  "frogger",
  "donkey-kong",
  "centipede",
  "double-dragon",
  "street-fighter",
]

const isPWA = () => {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true
}

const isPiBrowser = () => {
  if (typeof window === "undefined") return false
  return /pibrowser|pi browser/i.test(navigator.userAgent) || !!(window as any).Pi
}

export function GamePlayer({
  gameId,
  gameName,
  onGameComplete,
  isTournament,
  matchId,
  tournamentEntryId,
  userId,
  username,
}: GamePlayerProps) {
  const router = useRouter()
  const [isPaused, setIsPaused] = useState(false)
  const [pauseTimeLeft, setPauseTimeLeft] = useState(180) // 3 minutes in seconds
  const [score, setScore] = useState(0)
  const [gameStartTime] = useState(Date.now())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPWAPauseMenu, setShowPWAPauseMenu] = useState(false)
  const [savedGameState, setSavedGameState] = useState<any>(null)
  const [gameEnded, setGameEnded] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const supportsFullscreen = FULLSCREEN_GAMES.includes(gameId)
  const isPWAMode = isPWA()
  const isPiBrowserMode = isPiBrowser()

  useEffect(() => {
    const savedState = localStorage.getItem(`arcade_game_${gameId}`)
    if (savedState) {
      const parsed = JSON.parse(savedState)
      setSavedGameState(parsed)
      setScore(parsed.score || 0)
    }
  }, [gameId])

  useEffect(() => {
    if (isPaused) {
      const gameState = {
        score,
        pausedAt: Date.now(),
        gameStartTime,
        timeLeft: pauseTimeLeft,
      }
      localStorage.setItem(`arcade_game_${gameId}`, JSON.stringify(gameState))
      console.log("[v0] Game state saved:", gameState)
    }
  }, [isPaused, score, gameId, gameStartTime, pauseTimeLeft])

  useEffect(() => {
    const enterFullscreen = async () => {
      if (gameContainerRef.current && !isFullscreen && supportsFullscreen && isPWAMode && !isPiBrowserMode) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500))
          await gameContainerRef.current.requestFullscreen()
          setIsFullscreen(true)
          console.log("[v0] Entered fullscreen mode for PWA")
        } catch (err) {
          console.error("[v0] Fullscreen error:", err)
        }
      }
    }

    if (isTournament && isPWAMode && !isPiBrowserMode) {
      enterFullscreen()
    }

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  }, [gameId, supportsFullscreen, isTournament, isPWAMode, isPiBrowserMode])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (isPaused && isTournament) {
      pauseTimerRef.current = setInterval(() => {
        setPauseTimeLeft((prev) => {
          if (prev <= 1) {
            if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)
            const completionTime = Math.floor((Date.now() - gameStartTime) / 1000)
            console.log("[v0] Tournament game forfeited due to 3-min pause timeout. Score:", score)
            onGameComplete(score, completionTime)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)
    }
  }, [isPaused, isTournament, score, gameStartTime, onGameComplete])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("[v0] 🎮 ===== GAMEPLAYER MESSAGE RECEIVED =====")
      console.log("[v0] 🎮 Message type:", event.data?.type)
      console.log("[v0] 🎮 Origin:", event.origin)
      console.log("[v0] 🎮 Full data:", JSON.stringify(event.data))
      console.log("[v0] 🎮 Is PWA:", isPWAMode)
      console.log("[v0] 🎮 Is Tournament:", isTournament)
      console.log("[v0] 🎮 Tournament Entry ID:", tournamentEntryId)

      if (event.data.type === "GAME_SCORE_UPDATE") {
        console.log("[v0] 📊 Score update received:", event.data.score)
        setScore(event.data.score)
      } else if (event.data.type === "GAME_OVER" || event.data.type === "GAME_COMPLETE") {
        const completionTime = event.data.gameTime || Math.floor((Date.now() - gameStartTime) / 1000)
        const gameScore = event.data.score || score

        console.log("[v0] 🎮 ===== GAME ENDED =====")
        console.log("[v0] 🎮 Type:", event.data.type)
        console.log("[v0] 🎮 Score:", gameScore)
        console.log("[v0] 🎮 Time:", completionTime)
        console.log("[v0] 🎮 Is Tournament:", isTournament)
        console.log("[v0] 🎮 Tournament Entry ID:", tournamentEntryId)

        setFinalScore(gameScore)
        setGameEnded(true)

        console.log("[v0] 🎮 Calling onGameComplete...")
        onGameComplete(gameScore, completionTime)
        console.log("[v0] 🎮 onGameComplete called successfully")
      }
    }

    console.log("[v0] 🎧 GamePlayer message listener installed")
    console.log("[v0] 🎧 Tournament mode:", isTournament)
    console.log("[v0] 🎧 Entry ID:", tournamentEntryId)

    window.addEventListener("message", handleMessage)

    return () => {
      console.log("[v0] 🎧 GamePlayer message listener removed")
      window.removeEventListener("message", handleMessage)
    }
  }, [score, gameStartTime, onGameComplete, isTournament, isPWAMode, tournamentEntryId])

  useEffect(() => {
    if (!iframeRef.current) return

    const handleLoad = () => {
      if (iframeRef.current?.contentWindow && isTournament && matchId) {
        // Send tournament seed - all players in same match get same seed
        iframeRef.current.contentWindow.postMessage(
          {
            type: "SET_TOURNAMENT_SEED",
            seed: matchId,
          },
          "*",
        )
        console.log("[v0] Sent tournament seed to game:", matchId)
      }

      if (iframeRef.current?.contentWindow && tournamentEntryId) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "SET_TOURNAMENT_ENTRY_ID",
            entryId: tournamentEntryId,
          },
          "*",
        )
        console.log("[v0] Sent tournament entry ID to game:", tournamentEntryId)
      }

      if (iframeRef.current?.contentWindow && userId) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "SET_USER_INFO",
            userId,
            username,
          },
          "*",
        )
      }
    }

    const iframe = iframeRef.current
    iframe.addEventListener("load", handleLoad)

    return () => {
      iframe.removeEventListener("load", handleLoad)
    }
  }, [isTournament, matchId, tournamentEntryId, userId, username])

  const handlePause = () => {
    setIsPaused(true)
    if (isPWAMode) {
      setShowPWAPauseMenu(true)
    }
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "PAUSE_GAME" }, "*")
    }
    console.log("[v0] Game paused. State saved to localStorage.")
  }

  const handleResume = () => {
    setIsPaused(false)
    setShowPWAPauseMenu(false)
    setPauseTimeLeft(180)
    if (pauseTimerRef.current) {
      clearInterval(pauseTimerRef.current)
      pauseTimerRef.current = null
    }
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "RESUME_GAME" }, "*")
    }
    console.log("[v0] Game resumed")
  }

  const handleRestart = () => {
    localStorage.removeItem(`arcade_game_${gameId}`)
    setSavedGameState(null)
    setScore(0)
    setGameEnded(false)
    setIsPaused(false)
    setShowPWAPauseMenu(false)
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src
      iframeRef.current.src = ""
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc
        }
      }, 100)
    }
    console.log("[v0] Game restarted")
  }

  const handleBackToArcade = () => {
    console.log("[v0] 🏠 Back to Arcade clicked")
    console.log("[v0] 🏠 Is tournament:", isTournament)
    console.log("[v0] 🏠 Tournament entry ID:", tournamentEntryId)
    console.log("[v0] 🏠 Current score:", score)
    console.log("[v0] 🏠 Game ended:", gameEnded)

    localStorage.removeItem(`arcade_game_${gameId}`)

    if (isTournament && tournamentEntryId && score > 0 && !gameEnded) {
      const completionTime = Math.floor((Date.now() - gameStartTime) / 1000)
      console.log("[v0] 🏆 Tournament game - submitting score from Back to Arcade button")
      console.log("[v0] 🏆 Score:", score, "Time:", completionTime)
      onGameComplete(score, completionTime)
    } else {
      console.log("[v0] 🏠 Redirecting to arcade with hard reload")
      if (typeof window !== "undefined") {
        window.location.href = "/arcade"
      }
    }
  }

  const handleFullscreenToggle = async () => {
    if (!supportsFullscreen) return

    try {
      if (!isFullscreen && gameContainerRef.current) {
        await gameContainerRef.current.requestFullscreen()
      } else if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error("[v0] Fullscreen toggle error:", err)
    }
  }

  return (
    <div
      ref={gameContainerRef}
      className={`${isTournament ? "fixed inset-0 z-[100]" : "relative"} w-full h-full bg-black`}
    >
      {/* Fullscreen Button - only show for supported games and not in Pi Browser portrait */}
      {supportsFullscreen && !isFullscreen && !isPiBrowserMode && (
        <button
          onClick={handleFullscreenToggle}
          className="absolute top-4 right-20 z-50 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full p-3 border-2 border-gray-600"
          title="Enter Fullscreen"
        >
          <Maximize className="w-6 h-6" />
        </button>
      )}

      {/* Pause Button */}
      {!isPaused && !gameEnded && (
        <button
          onClick={handlePause}
          className="absolute top-4 right-4 z-50 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full p-3 border-2 border-gray-600"
        >
          <Pause className="w-6 h-6" />
        </button>
      )}

      {!isTournament && (
        <div className="absolute top-4 left-4 z-50 bg-gray-800/80 rounded-lg p-3 border-2 border-cyan-500 pointer-events-none">
          <div className="text-white space-y-1">
            <p className="text-sm">
              Score: <span className="font-bold text-cyan-400">{score}</span>
            </p>
          </div>
        </div>
      )}

      {isPaused && showPWAPauseMenu && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-6">⏸️</div>
            <h2 className="text-4xl font-bold text-white mb-6">GAME PAUSED</h2>
            <div className="space-y-3">
              <Button
                onClick={handleResume}
                size="lg"
                className="w-64 bg-green-600 hover:bg-green-700 text-white text-xl px-12 py-6"
              >
                <Play className="w-6 h-6 mr-2" />
                Continue
              </Button>
              {!isTournament && (
                <Button
                  onClick={handleRestart}
                  size="lg"
                  variant="outline"
                  className="w-64 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black text-xl px-12 py-6 bg-transparent"
                >
                  <RotateCcw className="w-6 h-6 mr-2" />
                  Restart
                </Button>
              )}
              <Button
                onClick={handleBackToArcade}
                variant="outline"
                size="lg"
                className="w-64 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black text-xl px-12 py-6 bg-transparent"
              >
                <Home className="w-6 h-6 mr-2" />
                Back to Arcade
              </Button>
            </div>
          </div>
        </div>
      )}

      {isPaused && !showPWAPauseMenu && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-6">⏸️</div>
            <h2 className="text-4xl font-bold text-white mb-4">GAME PAUSED</h2>
            {isTournament && (
              <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-6 mb-6">
                <p className="text-red-400 text-lg mb-2">⏱️ Time Remaining to Resume:</p>
                <p className="text-5xl font-bold text-red-300">
                  {Math.floor(pauseTimeLeft / 60)}:{(pauseTimeLeft % 60).toString().padStart(2, "0")}
                </p>
                <p className="text-sm text-red-400 mt-2">Game will be forfeited if not resumed</p>
                <p className="text-xs text-red-300 mt-1">Your score will be saved at: {score} points</p>
              </div>
            )}
            <div className="space-y-3">
              <Button
                onClick={handleResume}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white text-xl px-12 py-6"
              >
                <Play className="w-6 h-6 mr-2" />
                Resume Game
              </Button>
              <Button
                onClick={handleBackToArcade}
                variant="outline"
                size="lg"
                className="w-64 border-gray-500 text-gray-300 hover:bg-gray-700 text-xl px-12 py-6 bg-transparent"
              >
                End Game
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameEnded && isTournament && (
        <>
          {/* Backdrop overlay to block all interaction with game */}
          <div className="fixed inset-0 bg-black z-[10000]" />

          {/* Completion screen content */}
          <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-auto">
            <div className="w-full h-full bg-gradient-to-br from-black via-purple-900/90 to-black backdrop-blur-xl flex items-center justify-center">
              <div className="text-center px-4 max-w-2xl">
                <div className="text-8xl mb-8 animate-bounce">🏆</div>
                <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                  TOURNAMENT COMPLETE!
                </h2>
                <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 md:p-12 mb-8 shadow-2xl">
                  <p className="text-7xl md:text-9xl font-bold text-white mb-2 drop-shadow-lg">{finalScore}</p>
                  <p className="text-3xl md:text-4xl text-white font-semibold">POINTS</p>
                </div>
                <p className="text-2xl md:text-3xl text-green-400 mb-8 animate-pulse font-bold drop-shadow-lg">
                  ✅ Score Submitted Successfully!
                </p>
                <Button
                  onClick={() => {
                    console.log("[v0] 🏠 Return to Arcade button clicked from completion screen")
                    localStorage.removeItem("pwa_tournament_entry")
                    if (typeof window !== "undefined") {
                      window.location.href = "/arcade"
                    }
                  }}
                  size="lg"
                  className="w-full max-w-md bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white text-2xl md:text-3xl px-12 py-8 md:py-10 shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 font-bold"
                >
                  <Home className="w-8 h-8 md:w-10 md:h-10 mr-3" />
                  Return to Arcade
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {gameEnded && !isTournament && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-8xl mb-8">🎮</div>
            <h2 className="text-5xl font-bold text-white mb-6">GAME OVER</h2>
            <div className="bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg p-8 mb-8">
              <p className="text-7xl font-bold text-white mb-2">{finalScore}</p>
              <p className="text-2xl text-white">POINTS</p>
            </div>
            <div className="space-y-4">
              <Button
                onClick={handleRestart}
                size="lg"
                className="w-72 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-2xl px-12 py-8"
              >
                <RotateCcw className="w-8 h-8 mr-3" />
                Play Again
              </Button>
              <Button
                onClick={handleBackToArcade}
                variant="outline"
                size="lg"
                className="w-72 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black text-2xl px-12 py-8 bg-transparent"
              >
                <Home className="w-8 h-8 mr-3" />
                Back to Arcade
              </Button>
            </div>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={`/games/${gameId}/index.html`}
        className="absolute inset-0 w-full h-full border-0 z-10"
        style={{
          width: "100%",
          height: "100%",
        }}
        title={gameName}
        allow="fullscreen"
      />
    </div>
  )
}
