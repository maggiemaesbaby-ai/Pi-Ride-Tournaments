"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Play, Gamepad2 } from "lucide-react"
import { GamePlayer } from "@/components/arcade/game-player"

const TOURNAMENT_TIERS = {
  "tier-0": {
    id: "tier-0",
    name: "Newbie Practice",
    entryFee: 0.1,
    playerCount: 10,
    payouts: [0.3, 0.2, 0.1, 0.1, 0.1],
  },
  "tier-1": { id: "tier-1", name: "Bronze Blaster", entryFee: 0.5, playerCount: 7, payouts: [2.5, 0.75, 0.25] },
  "tier-2": { id: "tier-2", name: "Silver Slayer", entryFee: 1.0, playerCount: 7, payouts: [5.0, 1.5, 0.5] },
  "tier-3": { id: "tier-3", name: "Gold Gunner", entryFee: 5.0, playerCount: 7, payouts: [25.0, 7.5, 2.5] },
}

const ARCADE_GAMES: { [key: string]: any } = {
  asteroids: { name: "Asteroids", icon: "🌑", description: "Classic Asteroids game where you shoot asteroids." },
  snake: { name: "Snake", icon: "🐍", description: "Classic Snake game where you control a snake eating apples." },
  tetris: { name: "Tetris", icon: "🧱", description: "Classic Tetris game where you stack blocks." },
  pacman: { name: "Pac-Man", icon: "👻", description: "Classic Pac-Man game where you eat dots and avoid ghosts." },
  trivia: { name: "Trivia", icon: "🧠", description: "Trivia game where you answer questions." },
}

interface GamePageProps {
  params: Promise<{ gameId: string }>
}

export default function GamePage({ params }: GamePageProps) {
  const [gameId, setGameId] = useState<string | null>(null)
  const [isTournamentGame, setIsTournamentGame] = useState(false)
  const [tournamentTier, setTournamentTier] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const { user, connect } = usePiWallet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [showStartButton, setShowStartButton] = useState(false)
  const [tournamentEntryId, setTournamentEntryId] = useState<string | null>(null)
  const [showPlatformChoice, setShowPlatformChoice] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [pwaUserId, setPwaUserId] = useState<string | null>(null)
  const [storedGameUserId, setStoredGameUserId] = useState<string | null>(null)

  const game = gameId ? ARCADE_GAMES[gameId] : null
  const tierInfo = tournamentTier ? TOURNAMENT_TIERS[tournamentTier as keyof typeof TOURNAMENT_TIERS] : null
  const displayEntry = tierInfo ? tierInfo.entryFee : 0
  const displayPrize = tierInfo ? tierInfo.payouts[0] : 0

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "GAME_COMPLETE") {
        console.log("[v0] 🎮 ===== RECEIVED GAME_COMPLETE MESSAGE =====")
        console.log("[v0] 🎮 Message data:", event.data)
        console.log("[v0] 🎮 Score:", event.data.score)
        console.log("[v0] 🎮 Game Time:", event.data.gameTime)

        if (event.data.score !== undefined && event.data.gameTime !== undefined) {
          console.log("[v0] 🎮 Calling handleGameComplete with score and time")
          handleGameComplete(event.data.score, event.data.gameTime)
        } else {
          console.error("[v0] ❌ Missing score or gameTime in GAME_COMPLETE message")
        }
      }

      if (event.data.type === "GAME_VIBRATE") {
        console.log("[v0] 📳 Received vibration request from game:", event.data)

        if ("vibrate" in navigator) {
          try {
            const pattern = event.data.pattern || [200]
            const result = navigator.vibrate(pattern)
            console.log("[v0] ✅ Vibration triggered:", { pattern, result })

            if (!result) {
              console.log("[v0] ⚠️ Vibration returned false - trying alternative")
              navigator.vibrate(200)
            }
          } catch (error) {
            console.error("[v0] ❌ Vibration error:", error)
          }
        } else {
          console.log("[v0] ⚠️ Vibration API not supported on this device")
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  useEffect(() => {
    const getGameId = async () => {
      const resolvedParams = await params

      console.log("[v0] 🎮 ===== GAME PAGE LOADED v1444 =====")
      console.log("[v0] Game ID:", resolvedParams.gameId)

      if (resolvedParams.gameId === "trivia") {
        console.log("[v0] Trivia/IQ Arena detected - redirecting to /arcade/trivia")
        window.location.href = "/arcade/trivia"
        return
      }

      console.log("[v0] Search params:", {
        tournament: searchParams.get("tournament"),
        tier: searchParams.get("tier"),
        matchId: searchParams.get("matchId"),
        entryId: searchParams.get("entryId"),
        pwa: searchParams.get("pwa"),
        userId: searchParams.get("userId"),
      })

      setGameId(resolvedParams.gameId)

      const isPWAMode =
        searchParams.get("pwa") === "true" ||
        (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches)
      setIsPWA(isPWAMode)

      console.log("[v0] 📱 Platform detected:", isPWAMode ? "PWA" : "Pi Browser")

      const urlEntryId = searchParams.get("entryId")
      const urlTier = searchParams.get("tier")
      const urlUserId = searchParams.get("userId")

      if (urlUserId) {
        console.log("[v0] 📡 User ID from URL:", urlUserId)
        setPwaUserId(urlUserId)
        setStoredGameUserId(urlUserId)
      }

      if (urlEntryId && urlTier) {
        console.log("[v0] 🎯 Pi Browser tournament entry detected from URL parameters")
        console.log("[v0] 📡 Entry ID:", urlEntryId)
        console.log("[v0] 📡 Tier:", urlTier)
        console.log("[v0] 📡 User ID:", urlUserId)

        console.log("[v0] 📡 Calling verify-entry API...")

        try {
          const response = await fetch(`/api/arcade/tournament/verify-entry`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entryId: urlEntryId }),
          })

          console.log("[v0] 📡 Verify-entry response status:", response.status)
          const verification = await response.json()
          console.log("[v0] 📡 Verify-entry response data:", verification)

          if (!response.ok || !verification.valid) {
            console.error("[v0] ❌ Entry verification failed:", verification)
            alert("Tournament entry could not be verified. Please rejoin the tournament.")
            router.push("/arcade")
            return
          }

          const entryData = verification.entry // Fixed to use verification.entry instead of verification.entryData

          if (entryData.userId) {
            console.log("[v0] 📡 Storing userId from entry:", entryData.userId)
            setStoredGameUserId(entryData.userId)
          }

          console.log("[v0] ✅ Valid tournament entry - setting up tournament game")
          localStorage.removeItem("arcade_free_play_mode")
          localStorage.removeItem("arcade_free_play_game")
          setTournamentEntryId(urlEntryId)
          setIsTournamentGame(true)
          setTournamentTier(urlTier)
          setShowStartButton(true)
          return
        } catch (error) {
          console.error("[v0] ❌ Error verifying Pi Browser entry:", error)
          alert("Failed to verify tournament entry. Please try again.")
          router.push("/arcade")
          return
        }
      }

      const gameSpecificEntry = localStorage.getItem(`pwa_tournament_entry_${resolvedParams.gameId}`)
      console.log("[v0] 🔍 Checking localStorage for game-specific entry:", gameSpecificEntry ? "FOUND" : "NOT FOUND")

      const globalEntry = localStorage.getItem("pwa_tournament_entry")
      console.log("[v0] 🔍 Checking localStorage for global entry:", globalEntry ? "FOUND" : "NOT FOUND")

      const entryToUse = gameSpecificEntry || globalEntry // Prioritize game-specific entry

      if (entryToUse) {
        try {
          const entryData = JSON.parse(entryToUse)
          console.log("[v0] 🎯 PWA tournament entry found in localStorage:", entryData)

          if (entryData.played) {
            console.log("[v0] ⚠️ This entry has already been played - clearing")
            localStorage.removeItem("pwa_tournament_entry")
            localStorage.removeItem(`pwa_tournament_entry_${gameId}`) // Clear game-specific entry too
            localStorage.removeItem("arcade_free_play_mode")
            localStorage.removeItem("arcade_free_play_game")
            alert("This tournament entry has already been played.")
            router.push("/arcade")
            return
          }

          if (entryData.gameId === resolvedParams.gameId) {
            console.log("[v0] ✅ Game ID matches - Verifying tournament entry in database...")
            console.log("[v0] 📡 Calling verify-entry API with entryId:", entryData.entryId)

            const response = await fetch(`/api/arcade/tournament/verify-entry`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ entryId: entryData.entryId }),
            })

            console.log("[v0] 📡 Verify-entry response status:", response.status)
            const verification = await response.json()
            console.log("[v0] 📡 Verify-entry response data:", verification)

            if (!response.ok || !verification.valid) {
              console.error("[v0] ❌ Entry verification failed:", verification)
              localStorage.removeItem("pwa_tournament_entry")
              localStorage.removeItem(`pwa_tournament_entry_${gameId}`) // Clear game-specific entry too
              localStorage.removeItem("arcade_free_play_mode")
              localStorage.removeItem("arcade_free_play_game")
              alert("Tournament entry could not be verified. Please rejoin the tournament.")
              router.push("/arcade")
              return
            }

            const pwEntry = verification.entry // Fixed to use verification.entry instead of verification.entryData

            if (pwEntry.userId) {
              console.log("[v0] 📡 Storing userId from PWA entry:", pwEntry.userId)
              setStoredGameUserId(pwEntry.userId)
            }

            console.log("[v0] ✅ Valid PWA tournament entry - setting up tournament game")
            localStorage.removeItem("pwa_tournament_entry")
            localStorage.removeItem(`pwa_tournament_entry_${gameId}`) // Clear game-specific entry too
            localStorage.removeItem("arcade_free_play_mode")
            localStorage.removeItem("arcade_free_play_game")
            setTournamentEntryId(entryData.entryId)
            setIsTournamentGame(true)
            setTournamentTier(entryData.tierId)
            setShowStartButton(true)
            return
          } else {
            console.log("[v0] ⚠️ PWA entry game mismatch:", {
              expected: resolvedParams.gameId,
              found: entryData.gameId,
            })
          }
        } catch (error) {
          console.error("[v0] ❌ Error parsing PWA entry:", error)
          localStorage.removeItem("pwa_tournament_entry")
          localStorage.removeItem(`pwa_tournament_entry_${gameId}`) // Clear game-specific entry too
        }
      } else {
        console.log("[v0] ℹ️ No pwa_tournament_entry found in localStorage")
      }

      const freePlayMode = localStorage.getItem("arcade_free_play_mode")
      const freePlayGame = localStorage.getItem("arcade_free_play_game")

      console.log("[v0] 🆓 Free play check:", { freePlayMode, freePlayGame, gameId: resolvedParams.gameId })

      if (freePlayMode === "true" && freePlayGame === resolvedParams.gameId) {
        console.log("[v0] ✅ FREE PLAY MODE DETECTED - Starting free play immediately")
        localStorage.removeItem("arcade_free_play_mode")
        localStorage.removeItem("arcade_free_play_game")
        setIsTournamentGame(false)
        setShowStartButton(true)
        setTournamentEntryId(null)
        setTournamentTier(null)
        setIsPlaying(false)
        return
      }

      console.log("[v0] ℹ️ No tournament entry or free play detected - setting up free play")
      setIsTournamentGame(false)
      setShowStartButton(true)
    }

    getGameId()
  }, [params, searchParams, router])

  const startTournamentGame = async () => {
    console.log("[v0] 🚀 Starting game", { isTournamentGame, tournamentEntryId })

    if (isTournamentGame && tournamentEntryId) {
      console.log("[v0] 🎮 Tournament game - marking entry as played")
      const gameSpecificEntry = localStorage.getItem(`pwa_tournament_entry_${gameId}`)
      const globalEntry = localStorage.getItem("pwa_tournament_entry")
      const entryToUse = gameSpecificEntry || globalEntry

      if (entryToUse) {
        try {
          const entryData = JSON.parse(entryToUse)
          entryData.played = true
          if (gameSpecificEntry) {
            localStorage.setItem(`pwa_tournament_entry_${gameId}`, JSON.stringify(entryData))
          } else {
            localStorage.setItem("pwa_tournament_entry", JSON.stringify(entryData))
          }
          console.log("[v0] ✅ Entry marked as played in localStorage")
        } catch (error) {
          console.error("[v0] ❌ Error updating entry:", error)
        }
      }
    }

    setShowStartButton(false)
    setIsPlaying(true)

    if (isPWA) {
      try {
        await document.documentElement.requestFullscreen()
        console.log("[v0] 📱 PWA fullscreen enabled")
      } catch (err) {
        console.log("[v0] ⚠️ Fullscreen not available:", err)
      }
    }
  }

  const handleGameComplete = (finalScore: number, completionTime: number) => {
    console.log("[v0] 🎮 ===== GAME PAGE handleGameComplete CALLED =====")
    console.log("[v0] 🎮 Final Score:", finalScore)
    console.log("[v0] 🎮 Completion Time:", completionTime)
    console.log("[v0] 🎮 Is Tournament:", isTournamentGame)
    console.log("[v0] 🎮 Tournament Entry ID:", tournamentEntryId)
    console.log("[v0] 🎮 User ID:", user?.uid)

    setScore(finalScore)

    if (isTournamentGame && tournamentEntryId) {
      console.log("[v0] 🏆 Tournament game - submitting score immediately")
      submitTournamentScore(finalScore, completionTime)
    }
  }

  const submitTournamentScore = async (score: number, time: number) => {
    const gameSpecificEntry = localStorage.getItem(`pwa_tournament_entry_${gameId}`)
    const globalEntry = localStorage.getItem("pwa_tournament_entry")
    const storedEntry = gameSpecificEntry || globalEntry

    let storedUserId: string | null = null

    if (storedEntry) {
      try {
        const entryData = JSON.parse(storedEntry)
        storedUserId = entryData.userId
        console.log("[v0] 📡 Found userId in stored entry:", storedUserId)
      } catch (error) {
        console.error("[v0] ❌ Error parsing stored entry:", error)
      }
    }

    const effectiveUserId =
      storedGameUserId ||
      storedUserId ||
      (typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null) ||
      user?.uid ||
      pwaUserId

    console.log("[v0] 📡 ===== USER ID RESOLUTION =====")
    console.log("[v0] 📡 Stored Game User ID (from URL/localStorage):", storedGameUserId)
    console.log("[v0] 📡 Stored Entry User ID:", storedUserId)
    console.log(
      "[v0] 📡 PWA User ID (localStorage):",
      typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null,
    )
    console.log("[v0] 📡 Pi Wallet User ID:", user?.uid)
    console.log("[v0] 📡 PWA User ID (state):", pwaUserId)
    console.log("[v0] 📡 EFFECTIVE USER ID (WILL USE):", effectiveUserId)

    if (!tournamentEntryId || !effectiveUserId) {
      console.error("[v0] ❌ Cannot submit score - missing data:", {
        tournamentEntryId,
        storedGameUserId,
        storedUserId,
        piWalletUserId: user?.uid,
        pwaUserId,
        effectiveUserId,
      })
      return false
    }

    const platform = isPWA ? "pwa" : "pi-browser"

    console.log("[v0] 📡 ===== SUBMITTING TOURNAMENT SCORE =====")
    console.log("[v0] 📡 Entry ID:", tournamentEntryId)
    console.log("[v0] 📡 Effective User ID (will use):", effectiveUserId)
    console.log("[v0] 📡 Game ID:", gameId)
    console.log("[v0] 📡 Score:", score)
    console.log("[v0] 📡 Platform:", platform)

    try {
      console.log("[v0] 📡 Making fetch request...")
      const response = await fetch("/api/arcade/tournament/submit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: tournamentEntryId,
          userId: effectiveUserId,
          gameId,
          score,
          platform,
        }),
      })

      console.log("[v0] 📡 Response received. Status:", response.status)
      console.log("[v0] 📡 Response ok:", response.ok)
      console.log("[v0] 📡 Response status text:", response.statusText)

      const responseText = await response.text()
      console.log("[v0] 📡 Raw response text:", responseText)

      let result
      try {
        result = JSON.parse(responseText)
        console.log("[v0] 📡 Parsed response data:", result)
      } catch (jsonError) {
        console.error("[v0] ❌ Failed to parse response JSON:", jsonError)
        console.error("[v0] ❌ Response was:", responseText)
        return true
      }

      if (!response.ok) {
        console.error("[v0] ❌ Score submission failed with status:", response.status)
        console.error("[v0] ❌ Error details:", result)
        return true
      }

      if (result && result.success === false) {
        console.error("[v0] ❌ Server returned non-success result:", result)
        return true
      }

      console.log("[v0] ✅ ===== SCORE SUBMITTED SUCCESSFULLY =====")
      console.log("[v0] ✅ Result details:", result)
      console.log("[v0] ✅ Clearing PWA tournament entry from localStorage...")
      localStorage.removeItem("pwa_tournament_entry")
      localStorage.removeItem(`pwa_tournament_entry_${gameId}`)

      const activeEntriesJson = localStorage.getItem("active_tournament_entries")
      if (activeEntriesJson) {
        try {
          const activeEntries = JSON.parse(activeEntriesJson)
          let updated = false

          for (const tierId in activeEntries) {
            if (activeEntries[tierId].entryId === tournamentEntryId) {
              delete activeEntries[tierId]
              updated = true
              console.log("[v0] ✅ Removed completed entry from active_tournament_entries:", tournamentEntryId)
              break
            }
          }

          if (updated) {
            localStorage.setItem("active_tournament_entries", JSON.stringify(activeEntries))
          }
        } catch (error) {
          console.error("[v0] ❌ Error removing from active_tournament_entries:", error)
        }
      }

      console.log("[v0] ✅ PWA tournament entry cleared from localStorage")

      localStorage.setItem("arcade_needs_refresh", "true")

      return true
    } catch (error) {
      console.error("[v0] ❌ ===== ERROR SUBMITTING SCORE =====")
      console.error("[v0] ❌ Error type:", error instanceof Error ? error.constructor.name : typeof error)
      console.error("[v0] ❌ Error message:", error instanceof Error ? error.message : String(error))
      console.error("[v0] ❌ Error stack:", error instanceof Error ? error.stack : "No stack trace")
      console.error("[v0] ❌ Full error object:", error)

      return false
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {!isPlaying && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <Link href="/arcade">
              <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                <ArrowLeft className="w-5 h-5" />
                Back to Arcade
              </Button>
            </Link>
          </div>

          {game && (
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
                {game.name}
              </h1>
              <p className="text-gray-400 text-lg">{game.description}</p>
            </div>
          )}
        </div>
      )}

      {!isPlaying && showStartButton && (
        <div className="container mx-auto px-4 py-8">
          {isTournamentGame && tournamentEntryId ? (
            <Card className="bg-gradient-to-br from-green-900/90 via-emerald-900/90 to-teal-900/90 border-4 border-green-500">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <Play className="w-12 h-12 text-green-400 animate-pulse" />
                    <h2 className="text-4xl font-bold text-green-400">Tournament Ready!</h2>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xl text-green-200">
                      Your entry is confirmed for <span className="font-bold text-yellow-400">{tierInfo?.name}</span>
                    </p>
                    <p className="text-lg text-green-300">
                      Entry Fee: <span className="font-bold">{displayEntry}π</span> | Top Prize:{" "}
                      <span className="font-bold text-yellow-400">{displayPrize}π</span>
                    </p>
                  </div>

                  <Button
                    onClick={startTournamentGame}
                    size="lg"
                    className="w-full max-w-md mx-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-2xl py-8 shadow-2xl animate-pulse"
                  >
                    <Play className="w-8 h-8 mr-3" />
                    Start Game Now!
                  </Button>

                  <p className="text-sm text-green-300/80">
                    {isPWA ? "Playing in Landscape Mode 🎯" : "Playing in Portrait Mode 📱"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900/90 border-4 border-cyan-500">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <Gamepad2 className="w-12 h-12 text-cyan-400 animate-pulse" />
                    <h2 className="text-4xl font-bold text-cyan-400">Free Play Ready!</h2>
                  </div>

                  <p className="text-xl text-cyan-200">Play {game?.name} for free - no wallet needed!</p>

                  <Button
                    onClick={startTournamentGame}
                    size="lg"
                    className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-2xl py-8 shadow-2xl animate-pulse"
                  >
                    <Play className="w-8 h-8 mr-3" />
                    Start Free Play!
                  </Button>

                  <p className="text-sm text-cyan-300/80">Practice mode - Play as many times as you want!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {isPlaying && game && (
        <div className="fixed inset-0 z-[9999] bg-black">
          <GamePlayer
            gameId={gameId}
            gameName={game.name}
            onGameComplete={handleGameComplete}
            isTournament={isTournamentGame}
            matchId={matchId}
            tournamentEntryId={tournamentEntryId}
            userId={user?.uid}
            username={user?.username}
          />
        </div>
      )}
    </div>
  )
}
