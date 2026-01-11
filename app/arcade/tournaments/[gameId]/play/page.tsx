"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function TournamentPlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [gameId, setGameId] = useState<string>("")
  const [isLinked, setIsLinked] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    params.then((p) => {
      setGameId(p.gameId)
    })
  }, [params])

  useEffect(() => {
    console.log("[v0] Tournament play page - Checking URL parameters")
    const entry = searchParams.get("tournamentEntry")
    const userId = searchParams.get("userId")
    const username = searchParams.get("username")
    const match = searchParams.get("match")

    console.log("[v0] URL params:", { entry, userId, username, match })

    if (entry && gameId) {
      console.log("[v0] Storing tournament entry in localStorage")
      const entryData = {
        entryId: entry,
        gameId: gameId,
        tierId: searchParams.get("tierId") || "tier-0",
        played: false,
        matchNumber: match || "1",
      }
      localStorage.setItem("pwa_tournament_entry", JSON.stringify(entryData))
      console.log("[v0] Tournament entry stored:", entryData)
    }

    if (userId && username) {
      console.log("[v0] Storing PWA credentials in localStorage")
      try {
        localStorage.setItem("pwa_user_id", userId)
        localStorage.setItem("pwa_username", decodeURIComponent(username))

        // Verify storage worked
        const stored = localStorage.getItem("pwa_user_id")
        console.log("[v0] Verification - userId stored:", stored === userId)

        if (stored === userId) {
          setIsLinked(true)
          setShowInstallPrompt(true) // Show install prompt after successful linking
          console.log("[v0] PWA account linked successfully!")
        } else {
          console.error("[v0] Failed to store userId in localStorage")
        }
      } catch (error) {
        console.error("[v0] localStorage error:", error)
      }
    } else {
      // Check if already linked
      const storedUserId = localStorage.getItem("pwa_user_id")
      if (storedUserId) {
        console.log("[v0] PWA already linked with userId:", storedUserId)
        setIsLinked(true)
      }
    }

    if (entry && gameId) {
      const gameUrl = `/arcade/game/${gameId}?pwa=true`
      console.log("[v0] Redirecting to game:", gameUrl)
      setTimeout(() => router.push(gameUrl), 2000) // 2 second delay to show linking status
    }
  }, [searchParams, gameId, router])

  // Handle PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support install prompt
      alert(
        "To add to your home screen:\n\n" +
          "iOS: Tap Share button > Add to Home Screen\n" +
          "Android: Tap Menu (⋮) > Add to Home Screen\n\n" +
          "Your login will be saved!",
      )
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log("[v0] PWA install outcome:", outcome)
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        <h1 className="text-4xl font-bold text-white mb-4">🎮 Launching Tournament...</h1>
        <p className="text-white/80 mb-6">
          Game: <span className="font-bold text-cyan-400">{gameId || "Loading..."}</span>
        </p>

        {isLinked && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
            <p className="text-green-300 font-semibold mb-1">✓ PWA Account Linked!</p>
            <p className="text-green-200 text-sm mb-3">
              Your balance and entries are now synced between Pi Browser and PWA.
            </p>
            {showInstallPrompt && (
              <Button
                onClick={handleInstallPWA}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              >
                📲 Add to Home Screen
              </Button>
            )}
            <p className="text-green-200/70 text-xs mt-2">💡 Add to home screen to save your login and play anytime!</p>
          </div>
        )}

        <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-4 mb-6">
          <p className="text-cyan-300 font-semibold mb-1">🚀 Game Starting...</p>
          <p className="text-cyan-200 text-sm">Redirecting you to the tournament game in a moment...</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/arcade/dashboard")}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => router.push(`/arcade/tournaments/${gameId}`)}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium"
          >
            ← Back to Tournament Page
          </Button>
        </div>
      </div>
    </div>
  )
}
