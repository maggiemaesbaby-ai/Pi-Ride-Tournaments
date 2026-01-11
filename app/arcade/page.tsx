"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AccountButton } from "@/components/arcade/account-button"
import { DailyCheckInModal } from "@/components/arcade/daily-checkin-modal"
import { dailyCheckInDB } from "@/lib/daily-checkin-db"
import { PiAdInterstitial } from "@/components/arcade/pi-ad-interstitial"
import { PiAdRewarded } from "@/components/arcade/pi-ad-rewarded"
import type { User } from "@/types/user"

const ARCADE_GAMES = [
  { id: "asteroids", name: "Asteroids", icon: "🌑", status: "testing" },
  { id: "trivia", name: "IQ Arena", icon: "🧠", status: "testing" },
  { id: "pacman", name: "Pac-Man", icon: "🟡", status: "in-progress" },
  { id: "double-dragon", name: "Double Dragon", icon: "🐉", status: "upcoming" },
  { id: "galaga", name: "Galaga", icon: "🚀", status: "upcoming" },
  { id: "minesweeper", name: "Minesweeper", icon: "💣", status: "upcoming" },
  { id: "frogger", name: "Frogger", icon: "🐸", status: "upcoming" },
  { id: "space-invaders", name: "Space Invaders", icon: "👾", status: "upcoming" },
  { id: "donkey-kong", name: "Donkey Kong", icon: "🦍", status: "upcoming" },
  { id: "street-fighter", name: "Street Fighter", icon: "🥊", status: "upcoming" },
  { id: "centipede", name: "Centipede", icon: "🐛", status: "upcoming" },
]

const TOURNAMENT_TIERS = {
  tier1: { name: "Tier 1", entryFee: 1, payouts: [10, 5, 2] },
  tier2: { name: "Tier 2", entryFee: 2, payouts: [20, 10, 5] },
  tier3: { name: "Tier 3", entryFee: 3, payouts: [30, 15, 8] },
  tier4: { name: "Tier 4", entryFee: 4, payouts: [40, 20, 10] },
}

export default function ArcadePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [isPiBrowser, setIsPiBrowser] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [pwaUserId, setPwaUserId] = useState<string | null>(null)
  const [showLinkingBanner, setShowLinkingBanner] = useState(false)
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false)
  const [hasWeeklyUnlock, setHasWeeklyUnlock] = useState(false)
  const [showLegendsDashboard, setShowLegendsDashboard] = useState(false)
  const [showDailyAd, setShowDailyAd] = useState(false)
  const [freeTournamentEntries, setFreeTournamentEntries] = useState(0)
  const [activeEntries, setActiveEntries] = useState<Record<string, any>>({})
  const [userBalance, setUserBalance] = useState<number>(0)
  const [activeTournamentEntries, setActiveTournamentEntries] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const userIdFromUrl = urlParams.get("userId")
      const usernameFromUrl = urlParams.get("username")
      const fromTournament = urlParams.get("from")
      const gameId = urlParams.get("gameId")

      console.log("[v0] Arcade page loaded with params:", { userIdFromUrl, usernameFromUrl, fromTournament, gameId })

      if (userIdFromUrl) {
        console.log("[v0] Storing userId in localStorage:", userIdFromUrl)
        localStorage.setItem("pwa_user_id", userIdFromUrl)
        if (usernameFromUrl) {
          localStorage.setItem("pwa_username", usernameFromUrl)
        }

        // If coming from tournament payment, redirect to that tournament page
        if (fromTournament === "tournament" && gameId) {
          console.log("[v0] Redirecting to tournament page:", gameId)
          window.history.replaceState({}, "", "/arcade")
          router.push(`/arcade/tournaments/${gameId}`)
          return
        }

        // Clean up URL
        window.history.replaceState({}, "", "/arcade")
      }

      const isPWAMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://")

      const storedUserId = localStorage.getItem("pwa_user_id")
      setIsPWA(isPWAMode)
      setPwaUserId(storedUserId)

      if (isPWAMode && !storedUserId && !userIdFromUrl) {
        console.log("[v0] PWA mode without userId, showing linking banner")
        setShowLinkingBanner(true)
      }

      setIsPiBrowser((window as any).Pi !== undefined)
    }
  }, [])

  useEffect(() => {
    if (user?.uid) {
      const checkInData = dailyCheckInDB.getUserCheckIn(user.uid)
      setHasWeeklyUnlock(checkInData.weeklyTournamentUnlocked && !checkInData.weeklyTournamentPlayed)

      const hasCheckedIn = dailyCheckInDB.hasCheckedInToday(user.uid)
      console.log("[v0] Daily check-in status:", {
        userId: user.uid,
        hasCheckedIn,
        lastCheckIn: checkInData.lastCheckInDate,
      })

      if (!hasCheckedIn) {
        setShowDailyCheckIn(true)
      }
    }
  }, [user])

  useEffect(() => {
    if (!mounted) return

    const urlParams = new URLSearchParams(window.location.search)
    const userIdFromUrl = urlParams.get("userId")
    const usernameFromUrl = urlParams.get("username")
    if (userIdFromUrl) {
      const fromTournament = urlParams.get("from")
      const gameId = urlParams.get("gameId")

      console.log("[v0] Arcade page loaded with params:", { userIdFromUrl, usernameFromUrl, fromTournament, gameId })

      if (userIdFromUrl) {
        console.log("[v0] Storing userId in localStorage:", userIdFromUrl)
        localStorage.setItem("pwa_user_id", userIdFromUrl)
        if (usernameFromUrl) {
          localStorage.setItem("pwa_username", usernameFromUrl)
        }

        // If coming from tournament payment, redirect to that tournament page
        if (fromTournament === "tournament" && gameId) {
          console.log("[v0] Redirecting to tournament page:", gameId)
          window.history.replaceState({}, "", "/arcade")
          router.push(`/arcade/tournaments/${gameId}`)
          return
        }
      }

      window.history.replaceState({}, "", "/arcade")
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("[v0] 👀 Page became visible, refetching active tournament entries...")
        fetchActiveEntries()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [router, mounted])

  const fetchActiveEntries = () => {
    const urlUserId = new URLSearchParams(window.location.search).get("userId")
    const urlUsername = new URLSearchParams(window.location.search).get("username")
    if (urlUserId && urlUsername) {
      localStorage.setItem("pwa_user_id", urlUserId)
      localStorage.setItem("pwa_username", urlUsername)
    }

    const userId = localStorage.getItem("pwa_user_id") || user?.uid

    if (!userId) {
      console.log("[v0] ⚠️ No userId available, skipping active entries fetch")
      return
    }

    const currentPlatform = isPWA ? "pwa" : "pi-browser"
    console.log("[v0] 🎮 Fetching active tournament entries for userId:", userId)
    console.log("[v0] 🎮 Using platform filter:", currentPlatform)

    fetch(`/api/arcade/tournament/active-entries?userId=${userId}&platform=${currentPlatform}`)
      .then((res) => {
        console.log("[v0] Active entries API response status:", res.status)
        return res.json()
      })
      .then((data) => {
        console.log("[v0] 📊 Active entries API response data:", data)
        if (data.entries && Array.isArray(data.entries)) {
          console.log("[v0] 🔍 Received", data.entries.length, "entries with platform filter:", currentPlatform)
          const entries = data.entries.map((entry: any) => ({
            gameId: entry.game_id,
            tierId: `tier-${entry.tier_id}`, // Fixed tier ID format to match database
            platform: entry.platform || "pwa",
            createdAt: entry.created_at,
            entryId: entry.id,
            userId: userId, // Include userId from the entry
            categoryId: entry.categoryId || null, // Include categoryId if available
          }))
          setActiveTournamentEntries(entries)
          console.log("[v0] ✅ Active tournament entries loaded:", entries.length, "entries")
          entries.forEach((e: any) => {
            console.log("[v0] 📋 Entry:", e.gameId, e.tierId, e.platform, "ID:", e.entryId)
          })
        } else {
          console.log("[v0] ⚠️ No entries array in response")
          setActiveTournamentEntries([])
        }
      })
      .catch((error) => {
        console.error("[v0] ❌ Failed to fetch active entries:", error)
        setActiveTournamentEntries([])
      })
  }

  useEffect(() => {
    console.log("[v0] 🔄 fetchActiveEntries useEffect triggered")
    console.log("[v0] Conditions - mounted:", mounted, "user:", !!user, "isPWA:", isPWA)

    if (!mounted) {
      console.log("[v0] ⏳ Not mounted yet, skipping entry fetch")
      return
    }

    const storedUserId = typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null
    if (user || storedUserId) {
      console.log("[v0] 🎯 Fetching active entries (user or storedUserId exists)")
      fetchActiveEntries()
    }

    const needsRefresh = localStorage.getItem("arcade_needs_refresh")
    if (needsRefresh === "true") {
      console.log("[v0] 🔄 Refresh flag detected, clearing and refetching entries...")
      localStorage.removeItem("arcade_needs_refresh")
      fetchActiveEntries()
    }
  }, [mounted, user, isPWA]) // Added isPWA as dependency

  useEffect(() => {
    if (!mounted || !user) return

    const urlParams = new URLSearchParams(window.location.search)
    const urlUserId = urlParams.get("userId")
    const urlUsername = urlParams.get("username")

    if (urlUserId && urlUsername) {
      console.log("[v0] Arcade: Storing userId from URL:", urlUserId)
      localStorage.setItem("pwa_user_id", urlUserId)
      localStorage.setItem("pwa_username", urlUsername)
    }

    const userId = localStorage.getItem("pwa_user_id") || user?.uid

    console.log(
      "[v0] Arcade Dashboard - Fetching balance for userId:",
      userId,
      "(from:",
      user?.uid ? "wallet uid" : "pwa_user_id",
      ")",
    )

    if (userId) {
      const isPWAMode =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as any).standalone ||
          document.referrer.includes("android-app://"))

      const currentPlatform = isPWAMode ? "pwa" : "browser"
      console.log("[v0] 🎯 ===== PLATFORM DETECTION =====")
      console.log("[v0] isPWAMode:", isPWAMode)
      console.log("[v0] Current platform:", currentPlatform)
      console.log("[v0] User ID:", userId)
      console.log("[v0] Fetching active entries with filter: platform =", currentPlatform)

      fetch(`/api/arcade/tournament/active-entries?userId=${userId}&platform=${currentPlatform}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("[v0] Active entries API response status:", data)
          if (data.entries && Array.isArray(data.entries)) {
            console.log("[v0] 🔍 Received", data.entries.length, "entries with platform filter:", currentPlatform)
            const entries = data.entries.map((entry: any) => ({
              gameId: entry.game_id,
              tierId: `tier${entry.tier_id}`,
              platform: entry.platform || "PWA",
              createdAt: entry.created_at,
              entryId: entry.id,
              userId: userId, // Include userId from the entry
              categoryId: entry.categoryId || null, // Include categoryId if available
            }))
            setActiveTournamentEntries(entries)
            console.log("[v0] ✅ Active tournament entries loaded:", entries.length, "entries")
            entries.forEach((entry: any, index: number) => {
              console.log(`[v0] Entry ${index + 1}:`, entry)
            })
          } else {
            console.log("[v0] ⚠️ No active entries found for platform:", currentPlatform)
          }
        })
        .catch((error) => {
          console.error("[v0] ❌ Error fetching active entries:", error)
        })

      fetch(`/api/arcade/user/balance?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.balance !== undefined) {
            setUserBalance(data.balance)
            console.log("[v0] Arcade Dashboard - User balance loaded:", data.balance, "π for userId:", userId)
          }
        })
        .catch((error) => {
          console.error("[v0] Arcade Dashboard - Error fetching balance:", error)
        })
    } else {
      console.log("[v0] No userId available for fetching entries")
    }
  }, [user, searchParams])

  useEffect(() => {
    const handleFocus = () => {
      // Page gained focus - refresh entries for Pi Browser users
      if (isPiBrowser && user?.uid) {
        const currentPlatform = "browser"
        console.log("[v0] 🔄 Pi Browser page focused - refreshing active entries")

        fetch(`/api/arcade/tournament/active-entries?userId=${user.uid}&platform=${currentPlatform}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.entries && Array.isArray(data.entries)) {
              const entries = data.entries.map((entry: any) => ({
                gameId: entry.game_id,
                tierId: `tier${entry.tier_id}`,
                platform: entry.platform || "browser",
                createdAt: entry.created_at,
                entryId: entry.id,
                userId: user.uid, // Include userId from the entry
                categoryId: entry.categoryId || null, // Include categoryId if available
              }))
              setActiveTournamentEntries(entries)
              console.log("[v0] ✅ Pi Browser active entries refreshed:", entries.length, "entries")
            }
          })
          .catch((error) => {
            console.error("[v0] ❌ Error refreshing Pi Browser entries:", error)
          })
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [isPiBrowser, user])

  useEffect(() => {
    if (!mounted || !user) return

    const needsRefresh = localStorage.getItem("arcade_needs_refresh")
    if (needsRefresh === "true") {
      console.log("[v0] 🔄 Refresh flag detected, clearing and refetching entries...")
      localStorage.removeItem("arcade_needs_refresh")
      fetchActiveEntries()
    }
  }, [mounted, user])

  const handleDailyCheckInComplete = () => {
    setShowDailyCheckIn(false)
    setShowDailyAd(true)
  }

  const handleWeeklyUnlock = () => {
    setHasWeeklyUnlock(true)
  }

  const handleRewardGranted = (reward: string) => {
    setFreeTournamentEntries((prev) => prev + 1)
  }

  console.log("[v0] Arcade page - Checking for active tournament entries")
  console.log("[v0] activeTournamentEntries:", activeTournamentEntries)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      {showLinkingBanner && (
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-lg mb-1">🔗 Link Your PWA Account</p>
              <p className="text-sm text-yellow-100">
                Get the link from Pi Browser after payment and paste it in PWA to link your account
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/arcade/link-pwa")}
                className="bg-white text-orange-600 hover:bg-yellow-100 font-bold"
              >
                Paste Link Here
              </Button>
              <button
                onClick={() => setShowLinkingBanner(false)}
                className="px-3 py-1 bg-black/20 hover:bg-black/40 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {user?.uid && showDailyCheckIn && (
        <DailyCheckInModal userId={user.uid} onClose={handleDailyCheckInComplete} onWeeklyUnlock={handleWeeklyUnlock} />
      )}

      {showDailyAd && <PiAdInterstitial trigger="daily-checkin" onClose={() => setShowDailyAd(false)} />}

      <div className="relative">
        <Header />
        <div className="absolute top-4 right-4 z-50">
          <AccountButton />
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-4 border-b-2 border-purple-500">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 justify-center max-w-3xl mx-auto">
            <Link href="/arcade" className="flex-1">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl border-2 border-cyan-300 text-base sm:text-lg px-4 py-6"
              >
                <span className="mr-2 flex-shrink-0">🕹️</span>
                <span className="truncate">Pi Arcade Legends</span>
              </Button>
            </Link>
            <Link href="/marketplace" className="flex-1">
              <Button
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl border-2 border-purple-400 text-base sm:text-lg px-4 py-6"
              >
                <span className="w-5 h-5 mr-2 flex-shrink-0">🛍️</span>
                <span className="truncate">Marketplace</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/retro-arcade-neon-patterns.jpg')] opacity-20" />
        <div className="container mx-auto px-4 text-center relative z-10">
          {user?.uid && isPiBrowser && (
            <div className="mb-6 flex justify-center">
              <PiAdRewarded
                onRewardGranted={handleRewardGranted}
                rewardDescription="Free Tournament Entry"
                trigger={
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold text-lg px-8 py-6 rounded-xl border-4 border-green-300 shadow-2xl"
                  >
                    <span className="mr-2">🎁</span>
                    Watch Ad for Free Entry
                  </Button>
                }
              />
            </div>
          )}

          {freeTournamentEntries > 0 && (
            <div className="mb-4">
              <Badge className="bg-green-600 text-white text-xl px-6 py-3 animate-bounce">
                🎟️ {freeTournamentEntries} Free Tournament {freeTournamentEntries === 1 ? "Entry" : "Entries"} Available!
              </Badge>
            </div>
          )}

          <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-pulse">🕹️ Pi Arcade Legends 🕹️</h1>
          <p className="text-2xl mb-6">11 Classic Games • 5 Arenas Each • Win Real Pi</p>
          {!isPiBrowser && (
            <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
              <p className="text-yellow-200 font-semibold">⚠️ Standalone PWA Mode - Free Play Only</p>
              <p className="text-sm text-yellow-100 mt-1">Open in Pi Browser to join tournaments and win real Pi</p>
            </div>
          )}

          <div className="flex justify-center gap-4 flex-wrap mb-6">
            <Badge className="bg-orange-600 text-white text-lg px-4 py-2">
              <span className="w-4 h-4 mr-2">🏆</span>
              11 Classic Games
            </Badge>
            <Badge className="bg-green-600 text-white text-lg px-4 py-2">
              <span className="w-4 h-4 mr-2">👥</span>
              50 Total Arenas
            </Badge>
            <Badge className="bg-blue-600 text-white text-lg px-4 py-2">
              <span className="w-4 h-4 mr-2">⚡</span>
              Instant Payouts
            </Badge>
          </div>

          {/* Added tournament payment explanation box */}
          <div className="bg-cyan-500/20 border-2 border-cyan-400 rounded-lg p-6 max-w-2xl mx-auto mb-8">
            <h3 className="text-xl font-bold mb-4 text-cyan-300 text-center">💡 How to Join Tournaments</h3>

            <div className="space-y-4 text-sm">
              <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-400">
                <h4 className="font-bold text-purple-300 mb-2">🎮 Two Payment Options:</h4>
                <ul className="space-y-2 text-gray-200">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong className="text-white">Pi Wallet:</strong> Pay directly from Pi Browser wallet for each
                      tournament entry
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong className="text-white">Dashboard Balance:</strong> Add Pi to your account balance and pay
                      seamlessly
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-900/30 p-4 rounded-lg border border-green-400">
                <h4 className="font-bold text-green-300 mb-2">⚡ Recommended: Dashboard Balance</h4>
                <p className="text-gray-200 mb-2">For the smoothest experience:</p>
                <ul className="space-y-1 text-gray-200">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Add Pi once, play multiple tournaments instantly</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Play seamlessly in PWA with better landscape mode experience</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Tournament winnings automatically added to your balance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>
                      <strong className="text-green-200">Cash out anytime (min 1π)</strong> with 1-click button on
                      dashboard
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Updated tournaments coming soon box */}
          <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-lg p-6 max-w-2xl mx-auto mb-8">
            <h3 className="text-xl font-bold text-yellow-300 mb-2 text-center">Upcoming Tournament</h3>
            <p className="text-yellow-200 text-center">Tournament is being built and will be available shortly</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {activeTournamentEntries.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center text-cyan-400">🎮 My Active Tournaments</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeTournamentEntries.map((entry, idx) => {
                const game = ARCADE_GAMES.find((g) => g.id === entry.gameId)
                const tierKey = entry.tierId.replace("tier-", "tier") as keyof typeof TOURNAMENT_TIERS
                const tier = TOURNAMENT_TIERS[tierKey]

                console.log("[v0] 🎯 Rendering active tournament entry:", {
                  gameId: entry.gameId,
                  tierId: entry.tierId,
                  tierKey,
                  tier,
                  game: game?.name,
                })

                return (
                  <Card key={idx} className="bg-gradient-to-br from-green-900 to-black border-4 border-green-500">
                    <CardContent className="p-6 text-center">
                      <Badge className="mb-3 bg-green-600 text-white">{entry.platform} Entry</Badge>
                      <div className="text-6xl mb-3">{game?.icon}</div>
                      <h3 className="text-2xl font-bold mb-2 text-green-400">{game?.name}</h3>
                      <p className="text-gray-400 mb-2">{tier?.name || entry.tierId}</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Entry: {tier?.entryFee || "N/A"}π • Prize: {tier?.payouts?.[0] || "N/A"}π
                      </p>
                      <Button
                        onClick={() => {
                          console.log("[v0] 💰 Active Tournament clicked:", entry)

                          if (entry.gameId === "trivia") {
                            const categoryId = entry.categoryId || "general-knowledge"
                            const entryData = {
                              entryId: entry.entryId,
                              gameId: entry.gameId,
                              tierId: entry.tierId,
                              userId: entry.userId,
                              categoryId: categoryId,
                              played: false,
                            }
                            localStorage.setItem(`pwa_tournament_entry_trivia`, JSON.stringify(entryData))
                            console.log("[v0] ✅ Stored trivia tournament entry data:", entryData)
                            router.push(
                              `/arcade/trivia/play/${categoryId}?pwa=true&entryId=${entry.entryId}&tierId=${entry.tierId}`,
                            )
                          } else {
                            // Regular games (asteroids, etc.)
                            const entryData = {
                              entryId: entry.entryId,
                              gameId: entry.gameId,
                              tierId: entry.tierId,
                              userId: entry.userId,
                              played: false,
                            }
                            localStorage.setItem(`pwa_tournament_entry_${entry.gameId}`, JSON.stringify(entryData))
                            console.log("[v0] ✅ Stored tournament entry data for game:", entry.gameId, entryData)
                            router.push(`/arcade/game/${entry.gameId}?pwa=true`)
                          }
                        }}
                        size="lg"
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xl py-6"
                      >
                        💰 Entry Fee Paid - Play Now
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        <div className="min-h-screen bg-black text-white p-6">
          <div className="text-center mb-8">
            <Link href="/arcade/dashboard">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl border-2 border-amber-300 text-xl px-8 py-6"
              >
                <span className="mr-2">📊</span>
                <span>Arcade Dashboard</span>
              </Button>
            </Link>
          </div>

          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 rounded-full mb-4">
                <p className="text-lg font-bold text-white">Games Awaiting Testers for Payouts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {ARCADE_GAMES.filter((g) => g.status === "testing").map((game) => {
                return (
                  <Card key={game.id} className="bg-gradient-to-br from-purple-900 to-black border-4 border-purple-500">
                    <CardContent className="p-8 text-center">
                      <div className="text-8xl mb-4">{game.icon}</div>
                      <h3 className="text-3xl font-bold mb-4 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]">
                        {game.name}
                      </h3>
                      <p className="text-gray-400 mb-6">6 Tournament Arenas • 1π to 20π Entry</p>
                      <div className="space-y-3">
                        <Link href={`/arcade/tournaments/${game.id}`}>
                          <Button
                            size="lg"
                            onClick={() => {
                              console.log("[v0] 🎯 VIEW TOURNAMENTS CLICKED -", game.name)
                              console.log("[v0] Current URL:", window.location.href)
                              console.log("[v0] Navigating to: /arcade/tournaments/" + game.id)
                            }}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xl py-6"
                          >
                            View Tournaments
                          </Button>
                        </Link>
                        <Button
                          onClick={() => {
                            console.log("[v0] 🆓 Free Play clicked:", game.id)
                            localStorage.setItem("arcade_free_play_mode", "true")
                            localStorage.setItem("arcade_free_play_game", game.id)
                            router.push(`/arcade/game/${game.id}`)
                          }}
                          size="lg"
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-xl py-6"
                        >
                          Free Play
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Game Build in Progress Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-2 rounded-full mb-4">
                <p className="text-lg font-bold text-white">Game Build in Progress</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ARCADE_GAMES.filter((g) => g.status === "in-progress").map((game) => {
                return (
                  <Card key={game.id} className="bg-gradient-to-br from-purple-900 to-black border-4 border-yellow-500">
                    <CardContent className="p-8 text-center">
                      <div className="text-8xl mb-4">{game.icon}</div>
                      <h3 className="text-3xl font-bold mb-4 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]">
                        {game.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-6">6 Tournament Arenas • 1π to 20π Entry</p>
                      <div className="space-y-3">
                        <Link href={`/arcade/tournaments/${game.id}`}>
                          <Button
                            size="lg"
                            onClick={() => {
                              console.log("[v0] 🎯 VIEW TOURNAMENTS CLICKED -", game.name)
                              console.log("[v0] Current URL:", window.location.href)
                              console.log("[v0] Navigating to: /arcade/tournaments/" + game.id)
                            }}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xl py-6"
                          >
                            View Tournaments
                          </Button>
                        </Link>
                        <Button
                          onClick={() => {
                            console.log("[v0] 🆓 Free Play clicked:", game.id)
                            localStorage.setItem("arcade_free_play_mode", "true")
                            localStorage.setItem("arcade_free_play_game", game.id)
                            router.push(`/arcade/game/${game.id}`)
                          }}
                          size="lg"
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-xl py-6"
                        >
                          Free Play
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6 text-center">Upcoming Games</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ARCADE_GAMES.filter((g) => g.status === "upcoming").map((game) => {
              return (
                <Card key={game.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-4 rounded-lg">
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4">{game.icon}</div>
                    <h3 className="text-3xl font-bold mb-2 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                      {game.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">Practice Mode</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* How It Works */}
          <div className="mt-16 bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border-2 border-purple-500">
            <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-5xl mb-4">1️⃣</div>
                <h3 className="text-xl font-bold mb-2">Choose a Game</h3>
                <p className="text-gray-300">Pick from 11 classic arcade games across 4 tournament tiers</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">2️⃣</div>
                <h3 className="text-xl font-bold mb-2">Pay Entry Fee</h3>
                <p className="text-gray-300">Use Pi Browser to pay your entry fee and join the tournament queue</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">3️⃣</div>
                <h3 className="text-xl font-bold mb-2">Win Pi Prizes</h3>
                <p className="text-gray-300">Top 3 players win instant Pi payouts directly to their wallet</p>
              </div>
            </div>
            <div className="mt-8 p-6 bg-blue-900/30 rounded-lg border border-blue-500">
              <h3 className="text-xl font-bold mb-3 text-center">💡 Two Ways to Play</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-green-900/30 p-4 rounded border border-green-500">
                  <h4 className="font-bold text-green-400 mb-2">🎮 Free Play (PWA)</h4>
                  <p className="text-gray-300">
                    Play all 11 games offline for free in standalone app mode. Perfect for practice!
                  </p>
                </div>
                <div className="bg-purple-900/30 p-4 rounded border border-purple-500">
                  <h4 className="font-bold text-purple-400 mb-2">💰 Tournament Mode (Pi Browser)</h4>
                  <p className="text-gray-300">
                    Open in Pi Browser to pay entry fees, join live tournaments, and win real Pi prizes!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
