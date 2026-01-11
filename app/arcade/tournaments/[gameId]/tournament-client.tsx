"use client"
console.log("[v0] 🚀 TOURNAMENT CLIENT LOADED - VERSION: 1957")
console.log("[v0] ========== TOURNAMENT CLIENT COMPONENT MOUNTING ==========")

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Coins, Zap } from "@/lib/icons"
import { fetchBalance } from "@/lib/fetch-balance"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { setPWAUser } from "@/lib/pwa-auth"
import { piSDK } from "@/lib/pi-sdk"
import { usePWADetection } from "@/hooks/use-pwa-detection" // Import usePWADetection
import { useSWRConfig } from "swr" // Added import for useSWRConfig
import { PiVolatilityDisclaimer } from "@/components/pi-volatility-disclaimer"

// Define PaymentDTO interface
interface PaymentDTO {
  amount: number
  memo: string
  metadata: {
    service: string
    gameId: string
    tier: string
    userId: string
    timestamp: number
    platform: "pwa" | "browser"
  }
}

// Constants and Interfaces
// const PENDING_PAYMENT_KEY = "pi_tournament_pending_payment" // Removed PENDING_PAYMENT_KEY

interface TournamentTier {
  id: string
  name: string
  players: number
  entry: number
  payouts: Record<string, number>
  icon: string
  color: string
  border: string
  isTest?: boolean
  isMega?: boolean
  maxPlayers?: number
}

interface GameTheme {
  name: string
  icon: string
  headerBg: string
  tagline: string
  tierDecoration: string
}

interface ActiveEntry {
  entryId: string
  matchNumber: number
  matchId: string
}

const TOURNAMENT_TIERS: TournamentTier[] = [
  {
    id: "tier-0",
    name: "Newbie Practice",
    players: 10,
    entry: 0.1,
    payouts: { 1: 0.3, 2: 0.2, 3: 0.1, 4: 0.1, 5: 0.1 },
    icon: "🌱",
    color: "from-green-400 via-emerald-500 to-teal-500",
    border: "border-green-300",
  },
  {
    id: "tier-1",
    name: "Rookie Arena",
    players: 7,
    entry: 1.0,
    payouts: { 1: 3.0, 2: 2.0, 3: 1.0 },
    icon: "🥉",
    color: "from-orange-400 via-amber-500 to-yellow-500",
    border: "border-orange-400",
  },
  {
    id: "tier-2",
    name: "Silver Circuit",
    players: 7,
    entry: 5.0,
    payouts: { 1: 15.0, 2: 10.0, 3: 5.0 },
    icon: "🥈",
    color: "from-slate-400 via-gray-300 to-zinc-400",
    border: "border-gray-300",
  },
  {
    id: "tier-3",
    name: "Gold Championship",
    players: 7,
    entry: 10.0,
    payouts: { 1: 30.0, 2: 20.0, 3: 10.0, 4: 3.0, 5: 2.0 },
    icon: "🥇",
    color: "from-yellow-300 via-amber-400 to-orange-400",
    border: "border-yellow-300",
  },
  {
    id: "tier-4",
    name: "Elite Masters",
    players: 5,
    entry: 15.0,
    payouts: { 1: 30.0, 2: 20.0, 3: 15.0, 4: 5.0 },
    icon: "💎",
    color: "from-cyan-400 via-blue-500 to-indigo-600",
    border: "border-blue-300",
  },
  {
    id: "tier-5",
    name: "Champion's Duel",
    players: 3,
    entry: 20.0,
    payouts: { 1: 45.0, 2: 10.0 },
    icon: "👑",
    color: "from-fuchsia-400 via-purple-500 to-pink-600",
    border: "border-pink-300",
  },
  {
    id: "mega",
    name: "MEGA TOURNAMENT",
    players: 100,
    entry: 1.0,
    payouts: {
      1: 25.0,
      2: 15.0,
      3: 10.0,
      4: 8.0,
      5: 7.0,
      6: 6.0,
      7: 5.0,
      8: 4.0,
      9: 3.0,
      10: 3.0,
      11: 2.0,
      12: 2.0,
      13: 2.0,
      14: 2.0,
      15: 2.0,
      16: 1.0,
      17: 1.0,
      18: 1.0,
      19: 1.0,
      20: 1.0,
    },
    icon: "🏆",
    color: "from-red-500 via-orange-500 to-yellow-400",
    border: "border-orange-500",
    isMega: true,
  },
]

const GAME_DATA: Record<string, GameTheme> = {
  asteroids: {
    name: "ASTEROIDS",
    icon: "🚀",
    headerBg: "from-indigo-600 via-purple-600 to-pink-600",
    tagline: "Blast Through Space!",
    tierDecoration: "🚀",
  },
  trivia: {
    name: "IQ ARENA",
    icon: "🧠",
    headerBg: "from-violet-600 via-purple-600 to-fuchsia-600",
    tagline: "Test Your Knowledge!",
    tierDecoration: "🎯",
  },
  "trivia-general-knowledge": {
    name: "General Knowledge",
    icon: "🌍",
    headerBg: "from-blue-500 to-cyan-600",
    tagline: "Test your knowledge across all topics",
    tierDecoration: "🧠",
  },
  "trivia-science": {
    name: "Science & Nature",
    icon: "🔬",
    headerBg: "from-green-500 to-emerald-600",
    tagline: "Biology, Chemistry, Physics & more",
    tierDecoration: "🧪",
  },
  "trivia-history": {
    name: "History",
    icon: "📜",
    headerBg: "from-amber-500 to-orange-600",
    tagline: "Ancient civilizations to modern times",
    tierDecoration: "📚",
  },
  "trivia-entertainment": {
    name: "Entertainment",
    icon: "🎬",
    headerBg: "from-purple-500 to-pink-600",
    tagline: "Movies, TV, Music & Pop Culture",
    tierDecoration: "🎭",
  },
  "trivia-sports": {
    name: "Sports",
    icon: "⚽",
    headerBg: "from-red-500 to-rose-600",
    tagline: "From football to Formula 1",
    tierDecoration: "🏆",
  },
  "trivia-geography": {
    name: "Geography",
    icon: "🗺️",
    headerBg: "from-teal-500 to-cyan-600",
    tagline: "Countries, capitals & landmarks",
    tierDecoration: "🌎",
  },
  pacman: {
    name: "Pac-Man",
    icon: "🟡",
    headerBg: "from-blue-950 via-indigo-950 to-black",
    tagline: "Eat pellets, dodge ghosts, dominate the maze",
    tierDecoration: "👻",
  },
  galaga: {
    name: "Galaga",
    icon: "🚀",
    headerBg: "from-indigo-950 via-blue-950 to-black",
    tagline: "Defend against the alien invasion",
    tierDecoration: "👾",
  },
  "double-dragon": {
    name: "Double Dragon",
    icon: "🐉",
    headerBg: "from-red-950 via-orange-950 to-black",
    tagline: "Fight through the streets",
    tierDecoration: "🥋",
  },
  minesweeper: {
    name: "Minesweeper",
    icon: "💣",
    headerBg: "from-gray-950 via-slate-950 to-black",
    tagline: "Clear the field without hitting mines",
    tierDecoration: "💥",
  },
  frogger: {
    name: "Frogger",
    icon: "🐸",
    headerBg: "from-green-950 via-teal-950 to-black",
    tagline: "Hop to safety across traffic and rivers",
    tierDecoration: "🚗",
  },
  "space-invaders": {
    name: "Space Invaders",
    icon: "👾",
    headerBg: "from-purple-950 via-indigo-950 to-black",
    tagline: "Defend Earth from the invasion",
    tierDecoration: "🛸",
  },
  "donkey-kong": {
    name: "Donkey Kong",
    icon: "🦍",
    headerBg: "from-amber-950 via-orange-950 to-black",
    tagline: "Rescue the princess from the ape",
    tierDecoration: "🔨",
  },
  "street-fighter": {
    name: "Street Fighter",
    icon: "🥊",
    headerBg: "from-red-950 via-yellow-950 to-black",
    tagline: "Master the combos and dominate",
    tierDecoration: "⚡",
  },
  centipede: {
    name: "Centipede",
    icon: "🐛",
    headerBg: "from-green-950 via-lime-950 to-black",
    tagline: "Shoot through the mushroom field",
    tierDecoration: "🍄",
  },
}

const getTierBackground = (tier: TournamentTier, decoration: string) => {
  return `bg-gradient-to-br ${tier.color} opacity-50 ${decoration}`
}

const getRankSuffix = (rank: string) => {
  const num = Number.parseInt(rank)
  if (num === 1) return "st"
  if (num === 2) return "nd"
  if (num === 3) return "rd"
  return "th"
}

interface TournamentPageClientProps {
  gameId: string
}

export function TournamentPageClient({ gameId }: TournamentPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  // Use the destructured values from usePiWallet hook
  const { user, connect, disconnect, isConnected, isLoading: piWalletLoading } = usePiWallet()
  const { toast } = useToast()
  // Use the hook for PWA detection
  const { isPWA } = usePWADetection()
  const { mutate } = useSWRConfig() // Get mutate from useSWRConfig

  const [userBalance, setUserBalance] = useState<number | undefined>(undefined)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [gameTheme, setGameTheme] = useState<GameTheme | null>(null)
  const [tiers] = useState<TournamentTier[]>(TOURNAMENT_TIERS)
  const [activeEntries, setActiveEntries] = useState<
    Record<string, { entryId: string; matchNumber: number; matchId: string }>
  >({})
  const [loading, setLoading] = useState(true)
  const [pwaUserId, setPwaUserId] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<(typeof TOURNAMENT_TIERS)[keyof typeof TOURNAMENT_TIERS] | null>(
    null,
  )
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [showPlatformChoice, setShowPlatformChoice] = useState(false)
  const [showPWALink, setShowPWALink] = useState(false)
  const [pwaLinkUrl, setPWALinkUrl] = useState("")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [balanceProcessing, setBalanceProcessing] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [showBalanceConfirmation, setShowBalanceConfirmation] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"balance" | "pi">("pi")
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [showManualVerify, setShowManualVerify] = useState(false)
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null)
  const [joinData, setJoinData] = useState<any>(null)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [platformChoiceCompleted, setPlatformChoiceCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    const completed = localStorage.getItem("platform_choices_completed")
    if (completed) {
      setPlatformChoiceCompleted(new Set(JSON.parse(completed)))
    }
  }, [])
  // </CHANGE>

  const [chosenPlatform, setChosenPlatform] = useState<"browser" | "pwa" | null>(null)
  // State to control the visibility of the copy link modal
  const [showCopyLink, setShowCopyLink] = useState(false)

  const isCreatingPayment = useRef(false)
  const currentPaymentId = useRef<string | null>(null)

  console.log("[v0] 🚀 TOURNAMENT CLIENT RENDERED - VERSION: 1962")
  console.log("[v0] showPaymentMethodModal:", showPaymentMethodModal)
  console.log("[v0] userBalance:", userBalance)
  console.log("[v0] user?.username:", user?.username)
  console.log(
    "[v0] localStorage pwa_user_id:",
    typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null,
  )

  useEffect(() => {
    const checkForRecentPayment = () => {
      console.log("[v0] Checking for recent payment entries...")
      const entriesJson = localStorage.getItem("active_tournament_entries")

      if (!entriesJson) {
        console.log("[v0] No active tournament entries found")
        return
      }

      const entries = JSON.parse(entriesJson)
      const tierIds = Object.keys(entries)

      for (const tierId of tierIds) {
        const entry = entries[tierId]

        if (entry.gameId !== gameId) continue

        const entryAge = Date.now() - new Date(entry.createdAt).getTime()
        console.log("[v0] Checking entry:", entry.entryId, "Age:", entryAge / 1000, "seconds")

        if (platformChoiceCompleted.has(entry.entryId)) {
          console.log("[v0] Platform choice already completed for entry:", entry.entryId)
          continue
        }
        // </CHANGE>

        // If entry was created in last 60 seconds and platform isn't set or is 'browser'
        if (entryAge < 60000 && (!entry.platform || entry.platform === "browser")) {
          console.log("[v0] Recent payment found without platform choice!")
          setCurrentEntryId(entry.entryId)

          // Only show platform choice if NOT in PWA
          if (!isPWA) {
            setTimeout(() => {
              console.log("[v0] Opening platform choice modal for recent payment")
              setShowPlatformChoice(true)
            }, 500)
          } else {
            console.log("[v0] In PWA mode - navigating to game immediately")
            setTimeout(() => {
              router.push(`/arcade/game/${gameId}?pwa=true&entryId=${entry.entryId}&tier=${tierId}`)
            }, 500)
          }

          break
        }
      }
    }

    checkForRecentPayment()
  }, [gameId, router, isPWA, platformChoiceCompleted])
  // </CHANGE>

  useEffect(() => {
    localStorage.removeItem("pending_payment")
    localStorage.removeItem("pending_entry_id")
    console.log("[v0] ✅ Cleared any stale payment data on mount")
  }, [])

  useEffect(() => {
    console.log("[v0] MODAL STATE UPDATE:")
    console.log("[v0]   - showPlatformChoice:", showPlatformChoice)
    console.log("[v0]   - showPWALink:", showPWALink)
    console.log("[v0]   - currentEntryId:", currentEntryId)
    console.log("[v0]   - pwaLinkUrl:", pwaLinkUrl)
    console.log("[v0]   - chosenPlatform:", chosenPlatform) // Log chosenPlatform
    console.log("[v0]   - showCopyLink:", showCopyLink) // Log showCopyLink
  }, [showPlatformChoice, showPWALink, currentEntryId, pwaLinkUrl, chosenPlatform, showCopyLink])

  // FIX: Removed user?.username from dependency array as it's too specific
  useEffect(() => {
    console.log("[v0] User state changed:", {
      hasUser: !!user,
      username: user?.username,
      isConnected: isConnected, // Log connection status
      piWalletLoading: piWalletLoading, // Log loading status
      isPWA: isPWA, // Log PWA status
    })
  }, [user, isConnected, piWalletLoading, isPWA]) // Added isConnected and piWalletLoading to dependency array

  console.log("[v0] Extracted gameId:", gameId)

  useEffect(() => {
    console.log("[v0] Checking for stored credentials on mount")

    if (typeof window !== "undefined") {
      const storedPiUsername = localStorage.getItem("pi_username")
      if (storedPiUsername) {
        console.log("[v0] Found stored Pi username, will use for balance loading:", storedPiUsername)
      }

      // Found stored PWA user ID:
      const storedPwaUserId = localStorage.getItem("pwa_user_id")
      if (storedPwaUserId) {
        console.log("[v0] Found stored PWA user ID:", storedPwaUserId)
      }
    }
  }, [])

  useEffect(() => {
    console.log("[v0] 💰 Balance loading useEffect triggered", {
      showPaymentMethodModal,
      userUid: user?.uid,
      isPWA,
    })

    // Only load balance when payment modal opens
    if (!showPaymentMethodModal) {
      console.log("[v0] Payment modal not open, skipping balance load")
      return
    }

    // Get user ID from multiple sources in priority order
    const getUserId = () => {
      if (typeof window !== "undefined") {
        const storedId = localStorage.getItem("pwa_user_id")
        if (storedId) {
          console.log("[v0] Found user ID in localStorage:", storedId)
          return storedId
        }
      }
      if (user?.uid) {
        console.log("[v0] Found user ID from user object:", user.uid)
        return user.uid
      }
      if (pwaUserId) {
        console.log("[v0] Found user ID from pwaUserId:", pwaUserId)
        return pwaUserId
      }
      return null
    }

    const userId = getUserId()

    if (!userId) {
      console.log("[v0] ⚠️ No userId available yet - waiting for user data")
      setLoadingBalance(false)
      setUserBalance(undefined)
      return
    }

    console.log("[v0] 💰 Loading balance for userId:", userId)
    setLoadingBalance(true)

    fetchBalance(userId)
      .then((balance) => {
        console.log("[v0] ✅ Balance loaded successfully:", balance, "π")
        setUserBalance(balance)
      })
      .catch((error) => {
        console.error("[v0] ❌ Balance loading error:", error)
        setUserBalance(0)
      })
      .finally(() => {
        setLoadingBalance(false)
      })
  }, [showPaymentMethodModal, user?.uid, pwaUserId, isPWA])
  // </CHANGE>

  useEffect(() => {
    console.log("[v0] Balance load check (second useEffect):", {
      showPaymentMethodModal,
      isPWA,
      userUid: user?.uid,
    })
    if (showPaymentMethodModal && !isPWA) {
      console.log("[v0] 💰 Payment modal opened, reloading balance...")

      const reloadBalance = async () => {
        const userId = localStorage.getItem("pwa_user_id") || user?.uid // Use user.uid

        if (!userId) {
          console.log("[v0] No user ID available yet")
          return
        }

        console.log("[v0] Loading balance for user:", userId)
        setLoadingBalance(true)

        try {
          const balance = await fetchBalance(userId)
          console.log("[v0] ✅ Balance loaded:", balance, "π")
          setUserBalance(balance)
        } catch (error) {
          console.error("[v0] ❌ Failed to load balance:", error)
          setUserBalance(0)
        } finally {
          setLoadingBalance(false)
        }
      }

      reloadBalance()
    } else if (showPaymentMethodModal && isPWA) {
      console.log("[v0] 💰 Payment modal opened in PWA mode, checking for stored user ID...")
      const userId = localStorage.getItem("pwa_user_id") || user?.uid
      if (userId) {
        console.log("[v0] Loading balance for PWA user:", userId)
        setLoadingBalance(true)
        fetchBalance(userId)
          .then((balance) => {
            console.log("[v0] ✅ PWA Balance loaded:", balance, "π")
            setUserBalance(balance)
          })
          .catch((error) => {
            console.error("[v0] ❌ PWA Balance loading error:", error)
            setUserBalance(0)
          })
          .finally(() => {
            setLoadingBalance(false)
          })
      } else {
        console.log("[v0] ⚠️ No PWA user ID found, cannot load balance")
        setLoadingBalance(false)
      }
    }
  }, [showPaymentMethodModal, isPWA, user]) // Fixed: Changed user?.username to user

  useEffect(() => {
    try {
      console.log("[v0] Component initialization started")
      setLoading(true)

      // Detect PWA mode
      const pwaParam = searchParams?.get("pwa")
      const isStandalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches

      if (pwaParam === "true" || isStandalone) {
        console.log("[v0] PWA mode detected")
        // Removed setIsPWA state, relying on the hook
        // setIsPWA(true)

        // Get PWA user ID from URL or localStorage
        const userIdFromUrl = searchParams?.get("userId")
        const storedUserId = typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null

        if (userIdFromUrl) {
          console.log("[v0] PWA userId from URL:", userIdFromUrl)
          setPwaUserId(userIdFromUrl)
          if (typeof window !== "undefined") {
            localStorage.setItem("pwa_user_id", userIdFromUrl)
          }
        } else if (storedUserId) {
          console.log("[v0] PWA userId from localStorage:", storedUserId)
          setPwaUserId(storedUserId)
        }
      }

      // Load game theme
      if (gameId && GAME_DATA[gameId]) {
        console.log("[v0] Setting game theme for:", gameId)
        setGameTheme(GAME_DATA[gameId])
        setLoading(false)
      } else {
        console.error("[v0] Game not found:", gameId)
        console.error("[v0] Available games:", Object.keys(GAME_DATA))
        toast({
          title: "Game Not Found",
          description: `The game "${gameId}" does not exist.`,
          variant: "destructive",
        })
        setTimeout(() => router.push("/arcade"), 2000)
      }
    } catch (error) {
      console.error("[v0] 🚨 Error in tournament page initialization:", error)
      setHasError(true)
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred")
      toast({
        title: "Error Loading Tournament",
        description: "An error occurred. Redirecting to arcade...",
        variant: "destructive",
      })
      setTimeout(() => router.push("/arcade"), 2000)
    }
  }, [gameId, searchParams, router, toast])

  const handleConfirmBalancePayment = async () => {
    setBalanceProcessing(true)
    setShowBalanceConfirmation(false)

    try {
      console.log("[v0] Balance payment confirmed. Deducting", selectedTier.entry, "π")

      const effectiveUserId =
        (typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null) || user?.uid || pwaUserId

      if (!effectiveUserId) {
        throw new Error("User ID not found. Please ensure you're logged in.")
      }

      console.log("[v0] Calling join-balance API with:", {
        gameId,
        tierId: selectedTier.id,
        userId: effectiveUserId,
        entryFee: selectedTier.entry,
        platform: chosenPlatform || (isPWA ? "pwa" : "browser"),
      })

      const response = await fetch("/api/arcade/tournament/join-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: gameId,
          tierId: selectedTier.id,
          userId: effectiveUserId,
          entryFee: selectedTier.entry,
          platform: chosenPlatform || (isPWA ? "pwa" : "browser"),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] Balance payment API error:", error)
        throw new Error(error.error || "Failed to process balance payment")
      }

      const data = await response.json()
      console.log("[v0] Balance payment successful, new balance:", data.newBalance)
      setUserBalance(data.newBalance)

      toast({
        title: "Payment Successful!",
        description: `You've successfully paid ${selectedTier.entry} π using your balance.`,
      })

      setActiveEntries((prev) => ({
        ...prev,
        [selectedTier.id]: {
          entryId: data.entryId,
          matchNumber: 1,
          matchId: data.matchId,
        },
      }))
      setCurrentEntryId(data.entryId)

      const entryData = {
        entryId: data.entryId,
        gameId: gameId,
        tierId: selectedTier.id,
        tierName: selectedTier.name,
        userId: effectiveUserId,
        createdAt: new Date().toISOString(),
        platform: chosenPlatform || (isPWA ? "pwa" : "browser"),
        played: false,
      }

      const localStorageEntries = JSON.parse(localStorage.getItem("active_tournament_entries") || "{}")
      localStorageEntries[selectedTier.id] = entryData
      localStorage.setItem("active_tournament_entries", JSON.stringify(localStorageEntries))

      if (isPWA) {
        console.log("[v0] Storing PWA tournament entry for game page:", entryData)
        localStorage.setItem("pwa_tournament_entry", JSON.stringify(entryData))
      }

      setShowPaymentMethodModal(false)

      if (!isPWA) {
        setTimeout(() => setShowPlatformChoice(true), 200)
      } else {
        console.log("[v0] PWA mode - navigating to game with entry:", data.entryId)
        setTimeout(
          () => router.push(`/arcade/game/${gameId}?pwa=true&entryId=${data.entryId}&tier=${selectedTier.id}`),
          200,
        )
      }
    } catch (error: any) {
      console.error("[v0] Balance payment failed:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during balance payment.",
        variant: "destructive",
      })
    } finally {
      setBalanceProcessing(false)
    }
  }

  const handlePaymentMethodSelect = (method: "balance" | "pi") => {
    setPaymentMethod(method)
    setShowPaymentMethodModal(false)

    if (method === "balance") {
      setShowBalanceConfirmation(true)
    } else if (method === "pi") {
      handlePayment("pi") // Changed from handlePayment("wallet") to handlePayment("pi")
    }
  }

  const handleEnterTournament = async (tier: (typeof tiers)[0]) => {
    console.log("[v0] ENTER TOURNAMENT CLICKED:", tier)
    setSelectedTier(tier)

    if (!isPWA) {
      console.log("[v0] Pi Browser detected - checking wallet connection")
      try {
        if (!user) {
          console.log("[v0] No user found, connecting wallet...")
          await connect()
          console.log("[v0] Wallet connection initiated, waiting for state update...")

          let connectedUser = null
          for (let i = 0; i < 20; i++) {
            await new Promise((resolve) => setTimeout(resolve, 200))
            const storedUsername = localStorage.getItem("pi_username")
            if (storedUsername) {
              console.log("[v0] Found connected user in localStorage:", storedUsername)
              connectedUser = storedUsername
              break
            }
          }

          if (connectedUser) {
            const userId = localStorage.getItem("pwa_user_id") || user?.uid // Use user.uid
            console.log("[v0] Wallet connected successfully! Loading balance for userId:", userId)
            setLoadingBalance(true)
            try {
              const balance = await fetchBalance(userId)
              console.log("[v0] Balance loaded after connection:", balance, "π")
              setUserBalance(balance)
            } catch (error) {
              console.error("[v0] Failed to load balance:", error)
              setUserBalance(0)
            } finally {
              setLoadingBalance(false)
            }
          } else {
            console.log("[v0] Wallet connection failed or was cancelled")
            return
          }
        } else {
          console.log("[v0] Wallet already connected, user:", user.username)

          const userId = localStorage.getItem("pwa_user_id") || user.uid // Use user.uid
          console.log("[v0] Loading fresh balance for userId:", userId)
          setLoadingBalance(true)
          try {
            const balance = await fetchBalance(userId)
            console.log("[v0] Balance loaded for connected user:", balance, "π")
            setUserBalance(balance)
          } catch (error) {
            console.error("[v0] Failed to load balance:", error)
            setUserBalance(0)
          } finally {
            setLoadingBalance(false)
          }
        }

        console.log("[v0] Opening payment method modal...")
        setShowPaymentMethodModal(true)
      } catch (error: any) {
        console.error("[v0] Wallet connection failed:", error)
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect wallet",
          variant: "destructive",
        })
        return
      }
    } else {
      // PWA mode: Always proceed to payment method selection
      console.log("[v0] PWA mode detected, opening payment method modal...")
      const userId = localStorage.getItem("pwa_user_id") || user?.uid // Use user.uid
      if (userId) {
        console.log("[v0] PWA - Loading balance for userId:", userId)
        setLoadingBalance(true)
        try {
          const balance = await fetchBalance(userId)
          console.log("[v0] PWA - Balance loaded:", balance, "π")
          setUserBalance(balance)
        } catch (error) {
          console.error("[v0] PWA - Failed to load balance:", error)
          setUserBalance(0)
        } finally {
          setLoadingBalance(false)
        }
      }
      setShowPaymentMethodModal(true)
    }
  }

  // </CHANGE> Adding handlePayWithPiWallet function
  const handlePayWithPiWallet = async (tier?: TournamentTier) => {
    const tierToUse = tier || selectedTier
    if (!tierToUse) {
      console.error("[v0] ASTEROIDS - No tier selected for Pi Wallet payment")
      toast({
        title: "Error",
        description: "Please select a tournament tier",
        variant: "destructive",
      })
      return
    }

    const effectiveUserId =
      user?.uid || pwaUserId || (typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null)

    if (!effectiveUserId) {
      console.error("[v0] ASTEROIDS - No user ID found for Pi Wallet payment")
      toast({
        title: "Authentication Required",
        description: "Please connect your Pi Wallet or ensure PWA account is linked",
        variant: "destructive",
      })
      return
    }

    if (isCreatingPayment.current) {
      toast({
        title: "Payment in Progress",
        description: "Please wait for the current payment to complete.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] ASTEROIDS - handlePayWithPiWallet called", {
      tier: tierToUse.name,
      amount: tierToUse.entry,
      userId: effectiveUserId,
      isPWA,
      chosenPlatform: chosenPlatform,
    })

    try {
      const paymentData: PaymentDTO = {
        amount: tierToUse.entry,
        memo: `${GAME_DATA[gameId]?.name || "Tournament"} - ${tierToUse.name}`,
        metadata: {
          service: "arcade",
          gameId,
          tier: tierToUse.id,
          userId: effectiveUserId,
          timestamp: Date.now(),
          platform: chosenPlatform || (isPWA ? "pwa" : "browser"),
        },
      }

      let currentPaymentIdForCallbacks: string | undefined
      let approvalCallbackFired = false

      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          try {
            approvalCallbackFired = true

            if (currentPaymentIdForCallbacks === paymentId) {
              console.log("[v0] ASTEROIDS - Approval already processed, skipping")
              return
            }
            currentPaymentIdForCallbacks = paymentId
            currentPaymentId.current = paymentId

            console.log("[v0] ASTEROIDS - ===== PAYMENT APPROVAL STARTING =====")
            console.log("[v0] ASTEROIDS - Payment ID:", paymentId)

            console.log("[v0] ASTEROIDS - Calling server approval endpoint...")
            const response = await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            })

            const data = await response.json()
            console.log("[v0] ASTEROIDS - Server approval response:", {
              ok: response.ok,
              status: response.status,
              data,
            })

            if (!response.ok) {
              console.error("[v0] ASTEROIDS - Server approval failed:", data)
              toast({
                title: "Payment Approval Failed",
                description: data.error || "Could not approve payment",
                variant: "destructive",
              })
              return
            }

            console.log("[v0] ASTEROIDS - ===== PAYMENT APPROVED SUCCESSFULLY =====")
          } catch (error) {
            console.error("[v0] ASTEROIDS - Error in onReadyForServerApproval:", error)
            toast({
              title: "Payment Error",
              description: "Could not process payment approval",
              variant: "destructive",
            })
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            console.log("[v0] ===== PAYMENT COMPLETION STARTING =====")
            console.log("[v0] Payment ID:", paymentId)
            console.log("[v0] Transaction ID:", txid)
            console.log("[v0] Current isPWA:", isPWA)
            console.log("[v0] Current chosenPlatform:", chosenPlatform)

            const response = await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            })

            const data = await response.json()
            console.log("[v0] Server completion response:", data)

            if (!response.ok) {
              console.error("[v0] Server completion failed:", data)
              toast({
                title: "Payment Completion Failed",
                description: data.error || "Could not complete payment",
                variant: "destructive",
              })
              return
            }

            console.log("[v0] ===== PAYMENT COMPLETED SUCCESSFULLY =====")

            if (data.entryId) {
              setCurrentEntryId(data.entryId)
              console.log("[v0] Entry ID captured from response:", data.entryId)

              const entryData = {
                entryId: data.entryId,
                gameId: gameId,
                tierId: tierToUse.id,
                tierName: tierToUse.name,
                userId: effectiveUserId,
                createdAt: new Date().toISOString(),
                platform: null, // Don't set platform yet - let user choose
                played: false,
              }

              const localStorageEntries = JSON.parse(localStorage.getItem("active_tournament_entries") || "{}")
              localStorageEntries[tierToUse.id] = entryData
              localStorage.setItem("active_tournament_entries", JSON.stringify(localStorageEntries))
              console.log("[v0] Stored entry in localStorage:", entryData)

              if (isPWA) {
                console.log("[v0] Storing PWA tournament entry for game page:", entryData)
                localStorage.setItem("pwa_tournament_entry", JSON.stringify({ ...entryData, platform: "pwa" }))
              }
              // </CHANGE>

              toast({
                title: "Payment Successful!",
                description: `You've successfully paid ${tierToUse.entry} π using Pi Wallet.`,
              })

              setShowPaymentMethodModal(false)
              setShowPaymentModal(false)

              if (!isPWA) {
                console.log("[v0] Pi Browser - showing platform choice modal")
                setTimeout(() => {
                  setShowPlatformChoice(true)
                }, 500)
              } else {
                console.log("[v0] PWA mode - navigating to game immediately with entry:", data.entryId)
                setTimeout(() => {
                  router.push(`/arcade/game/${gameId}?pwa=true&entryId=${data.entryId}&tier=${tierToUse.id}`)
                }, 500)
              }
              // </CHANGE>
            }
          } catch (error: any) {
            console.error("[v0] Error in completion:", error)
            toast({
              title: "Completion Error",
              description: error.message || "An error occurred during payment completion",
              variant: "destructive",
            })
          }
        },

        onCancel: () => {
          console.log("[v0] ASTEROIDS - Payment cancelled by user")
          isCreatingPayment.current = false
          currentPaymentId.current = null
        },

        onError: (error: Error) => {
          console.error("[v0] ASTEROIDS - Payment error:", error)
          isCreatingPayment.current = false
          currentPaymentId.current = null
          toast({
            title: "Payment Error",
            description: error.message || "An occurred during payment",
            variant: "destructive",
          })
        },
      }

      console.log("[v0] ASTEROIDS - Creating Pi payment:", paymentData)
      try {
        isCreatingPayment.current = true
        currentPaymentIdForCallbacks = null
        currentPaymentId.current = null

        piSDK.createPayment(paymentData, paymentCallbacks)
        console.log("[v0] ASTEROIDS - Payment creation initiated")
      } catch (error) {
        console.error("[v0] ASTEROIDS - Payment creation failed:", error)
        isCreatingPayment.current = false
        currentPaymentId.current = null
        toast({
          title: "Payment Error",
          description: "Failed to initiate payment. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("[v0] ASTEROIDS - Error in handlePayWithPiWallet:", error)
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred during payment.",
        variant: "destructive",
      })
      isCreatingPayment.current = false
      currentPaymentId.current = null
    }
  }

  // </CHANGE> Updated handlePayment to accept tier parameter and directly create Pi payment
  const handlePayment = async (method: "balance" | "pi", tier?: TournamentTier) => {
    const tierToUse = tier || selectedTier
    if (!tierToUse) {
      console.error("[v0] ASTEROIDS - No tier selected")
      toast({
        title: "Error",
        description: "Please select a tier",
        variant: "destructive",
      })
      return
    }

    const effectiveUserId =
      user?.uid || pwaUserId || (typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null) // Use user.uid

    if (!effectiveUserId) {
      console.error("[v0] ASTEROIDS - No user ID found")
      toast({
        title: "Authentication Required",
        description: "Please connect your Pi Wallet or ensure PWA account is linked",
        variant: "destructive",
      })
      return
    }

    if (method === "pi") {
      await handlePayWithPiWallet(tierToUse)
    } else if (method === "balance") {
      // Handle balance payment
      setShowPaymentMethodModal(false) // Close payment method modal
      setShowBalanceConfirmation(true) // Show balance confirmation modal
    }
  }

  // Helper function to process the final completion of a payment and tournament entry
  // const processPaymentCompletion = async (paymentId: string, txid: string) => {
  //   console.log("[v0] ==================== ASTEROIDS - PROCESSING PAYMENT COMPLETION ====================")
  //   console.log("[v0] ASTEROIDS - Payment ID:", paymentId)
  //   console.log("[v0] ASTEROIDS - TX ID:", txid)
  //   console.log("[v0] ASTEROIDS - Selected Tier:", selectedTier)
  //   console.log("[v0] ASTEROIDS - Game ID:", gameId)

  //   if (!selectedTier) {
  //     console.error("[v0] No selected tier available for payment completion")
  //     toast({
  //       title: "Error",
  //       description: "Tournament tier information missing. Please try again.",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   try {
  //     setShowConfirmationModal(false)
  //     setShowPaymentMethodModal(false)
  //     setShowPaymentModal(false)

  //     const effectiveUserId =
  //       user?.uid || pwaUserId || (typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null) // Use user.uid

  //     if (!effectiveUserId) {
  //       throw new Error("User ID not found")
  //     }

  //     console.log("[v0] Calling /api/arcade/tournament/join-wallet (unified payment + join)...")
  //     const joinResponse = await fetch("/api/arcade/tournament/join-wallet", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         userId: effectiveUserId,
  //         gameId: gameId,
  //         tierId: selectedTier.id,
  //         paymentId: paymentId,
  //         txid: txid,
  //         entryFee: selectedTier.entry,
  //         maxPlayers: selectedTier.maxPlayers || (selectedTier.isMega ? 100 : 10),
  //         platform: chosenPlatform || (isPWA ? "pwa" : "browser"),
  //       }),
  //     })

  //     const joinData = await joinResponse.json()
  //     console.log("[v0] join-wallet response:", joinData)

  //     if (!joinResponse.ok || !joinData.entryId) {
  //       throw new Error(joinData.error || "Failed to join tournament")
  //     }

  //     const entryData = {
  //       entryId: joinData.entryId,
  //       matchNumber: 1,
  //       matchId: "",
  //       tierName: selectedTier.name,
  //       status: "active",
  //       readyToPlay: true,
  //     }

  //     setActiveEntries((prev) => ({
  //       ...prev,
  //       [selectedTier.id]: {
  //         entryId: joinData.entryId,
  //         matchNumber: entryData.matchNumber,
  //         matchId: entryData.matchId,
  //       },
  //     }))

  //     const localStorageEntries = JSON.parse(localStorage.getItem("active_tournament_entries") || "{}")
  //     localStorageEntries[selectedTier.id] = entryData
  //     localStorage.setItem("active_tournament_entries", JSON.stringify(localStorageEntries))

  //     console.log("[v0] ✅ Entry stored:", entryData.entryId)

  //     toast({
  //       title: "Payment Successful!",
  //       description: `You've joined the ${selectedTier.name} tournament!`,
  //     })

  //     if (!isPWA) {
  //       if (typeof window !== "undefined") {
  //         const platformChoiceData = {
  //           entryId: joinData.entryId,
  //           gameId: gameId,
  //           tierId: selectedTier.id,
  //           timestamp: Date.now(),
  //           platform: chosenPlatform || "browser",
  //         }

  //         // Store multiple times to ensure it persists through any redirects
  //         for (let i = 0; i < 5; i++) {
  //           localStorage.setItem("pending_platform_choice", JSON.stringify(platformChoiceData))
  //           console.log(
  //             `[v0] 💾 INCOMPLETE PAYMENT - Storing platform choice data (attempt ${i + 1}):`,
  //             platformChoiceData,
  //           )
  //         }

  //         // Verify storage
  //         const verification = localStorage.getItem("pending_platform_choice")
  //         console.log("[v0] 💾 INCOMPLETE PAYMENT - Verification:", verification ? "YES" : "NO")
  //         if (verification) {
  //           console.log("[v0] 💾 INCOMPLETE PAYMENT - Stored data:", verification)
  //         }
  //       }

  //       setShowPlatformChoice(true)
  //       setCurrentEntryId(joinData.entryId)
  //     } else {
  //       // In PWA, navigate to game
  //       const pwaEntryData = {
  //         entryId: joinData.entryId,
  //         userId: effectiveUserId,
  //         gameId: gameId,
  //         tierId: selectedTier.id,
  //         tierName: selectedTier.name,
  //         createdAt: new Date().toISOString(),
  //         platform: "pwa",
  //         played: false,
  //       }
  //       localStorage.setItem("pwa_tournament_entry", JSON.stringify(pwaEntryData))
  //       console.log("[v0] Stored PWA tournament entry:", pwaEntryData)

  //       router.push(`/arcade/game/${gameId}?pwa=true`)
  //     }
  //     // </CHANGE>
  //   } catch (error: any) {
  //     console.error("[v0] Completion error:", error)
  //     toast({
  //       title: "Payment Error",
  //       description: error.message || "Failed to process payment. Please contact support.",
  //     })
  //   }
  // }

  // Helper function to start auto-verification polling
  const startAutoVerification = async (paymentId: string) => {
    console.log("[v0] ASTEROIDS - Starting auto-verification for payment:", paymentId)
    let attempts = 0
    const maxAttempts = 20 // 1 minute total

    const checkInterval = setInterval(async () => {
      attempts++
      console.log(`[v0] ASTEROIDS - Auto-verification attempt ${attempts}/${maxAttempts}`)

      try {
        const response = await fetch(`/api/pi/check-payment?paymentId=${paymentId}`)
        const data = await response.json()

        console.log("[v0] ASTEROIDS - Payment status check:", data)

        if (data.status === "completed" && data.txid) {
          console.log("[v0] ASTEROIDS - ✅ Payment completed! Processing...")
          clearInterval(checkInterval)
          // Removed call to processPaymentCompletion as it's no longer needed
          // await processPaymentCompletion(paymentId, data.txid)
        } else if (attempts >= maxAttempts) {
          console.log("[v0] ASTEROIDS - ⏱️ Max attempts reached, stopping auto-verification")
          clearInterval(checkInterval)
          toast({
            title: "Verification Taking Longer",
            description: "Click 'Verify Payment' button to check payment status manually",
          })
        }
      } catch (error) {
        console.error("[v0] ASTEROIDS - Auto-verification error:", error)
      }
    }, 3000) // Check every 3 seconds
  }

  // Handler for when a payment is completed (e.g., from Pi SDK callbacks)
  const handlePaymentComplete = async (payment: any) => {
    console.log("[v0] Payment completed:", payment.identifier)

    const selectedTierForPaymentComplete = TOURNAMENT_TIERS.find((t) => t.id === payment.metadata.tierId)
    const userId = user?.uid || pwaUserId || payment.metadata.userId // Use user.uid and pwaUserId for PWA context

    if (userId) {
      setPWAUser(userId, user?.username)
    }

    try {
      const response = await fetch("/api/arcade/tournament/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          gameId: gameId,
          tierId: selectedTierForPaymentComplete?.id || "",
          piPaymentId: payment.identifier,
          entryFee: selectedTierForPaymentComplete?.entry || 1,
          platform: payment.metadata.platform || chosenPlatform || (isPWA ? "pwa" : "browser"), // Use platform from metadata, chosenPlatform, or detect
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join tournament")
      }

      console.log("[v0] Tournament entry created:", data.entryId)

      const entryData = {
        entryId: data.entryId,
        gameId: gameId,
        tierId: selectedTierForPaymentComplete?.id || "",
        tierName: selectedTierForPaymentComplete?.name || "Unknown",
        paymentId: payment.identifier,
        createdAt: new Date().toISOString(),
      }

      // Update local state
      setActiveEntries((prev) => ({
        ...prev,
        [selectedTierForPaymentComplete?.id || ""]: {
          entryId: data.entryId,
          matchNumber: data.matchNumber || 1,
          matchId: data.matchId || "",
        },
      }))

      localStorage.setItem("tournament_entry_temp", JSON.stringify(entryData))

      if (!isPWA) {
        // Only show platform choice if not in PWA
        setShowPlatformChoice(true)
        setCurrentEntryId(data.entryId) // Set currentEntryId for platform choice
      } else {
        // If in PWA, navigate to game
        router.push(
          `/arcade/game/${gameId}?pwa=true&entryId=${data.entryId}&tier=${selectedTierForPaymentComplete?.id || ""}`,
        )
      }

      toast({
        title: "Payment Successful!",
        description: `Entry fee of ${selectedTierForPaymentComplete?.entry} π paid!`,
      })
    } catch (error: any) {
      console.error("[v0] Tournament join error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to join tournament",
        variant: "destructive",
      })
    }
  }

  const handlePlayInPiBrowser = () => {
    console.log("[v0] 🎮 Play in Pi Browser clicked")

    setChosenPlatform("browser")

    const newCompleted = new Set(platformChoiceCompleted)
    if (currentEntryId) {
      newCompleted.add(currentEntryId)
      localStorage.setItem("platform_choices_completed", JSON.stringify(Array.from(newCompleted)))
      setPlatformChoiceCompleted(newCompleted)

      // Update localStorage entry with platform
      const entriesJson = localStorage.getItem("active_tournament_entries")
      if (entriesJson) {
        const entries = JSON.parse(entriesJson)
        for (const tierId in entries) {
          if (entries[tierId].entryId === currentEntryId) {
            entries[tierId].platform = "browser"
            localStorage.setItem("active_tournament_entries", JSON.stringify(entries))
            break
          }
        }
      }
    }
    // </CHANGE>

    setShowPlatformChoice(false)

    // Use currentEntryId as it's actively managed for platform choice
    const entryIdToUse = currentEntryId

    if (!entryIdToUse) {
      console.error("[v0] No entry ID available to navigate to game")
      toast({
        title: "Error",
        description: "No tournament entry found. Please try re-entering the tournament.",
        variant: "destructive",
      })
      return
    }

    if (entryIdToUse) {
      const effectiveUserId = user?.uid
      console.log(
        `[v0] Navigating to Pi Browser game with entryId: ${entryIdToUse}, userId: ${effectiveUserId}, tier: ${selectedTier.id}`,
      )
      router.push(`/arcade/game/${gameId}?entryId=${entryIdToUse}&tier=${selectedTier.id}&userId=${effectiveUserId}`)
    }
  }

  const handlePlayOnPWA = async () => {
    console.log("[v0] 🎮 ===== handlePlayOnPWA START =====")
    console.log("[v0] Current entry ID:", currentEntryId)
    console.log("[v0] Game ID:", gameId)
    console.log("[v0] User:", user?.username, user?.uid)

    setChosenPlatform("pwa")

    console.log("[v0] 🔄 Updating entry platform to PWA...")
    try {
      const updateResponse = await fetch("/api/arcade/tournament/update-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: currentEntryId,
          platform: "pwa",
        }),
      })

      const updateData = await updateResponse.json()
      console.log("[v0] Platform update response:", updateData)

      if (!updateResponse.ok) {
        console.error("[v0] Failed to update platform:", updateData.error)
        throw new Error(updateData.error || "Failed to update platform")
      }

      console.log("[v0] ✅ Entry platform updated to PWA successfully!")

      const newCompleted = new Set(platformChoiceCompleted)
      if (currentEntryId) {
        newCompleted.add(currentEntryId)
        localStorage.setItem("platform_choices_completed", JSON.stringify(Array.from(newCompleted)))
        setPlatformChoiceCompleted(newCompleted)

        // Update localStorage entry with platform
        const entriesJson = localStorage.getItem("active_tournament_entries")
        if (entriesJson) {
          const entries = JSON.parse(entriesJson)
          for (const tierId in entries) {
            if (entries[tierId].entryId === currentEntryId) {
              entries[tierId].platform = "pwa"
              localStorage.setItem("active_tournament_entries", JSON.stringify(entries))
              break
            }
          }
        }
      }
      // </CHANGE>
    } catch (error) {
      console.error("[v0] ❌ Error updating platform:", error)
      toast({
        title: "Error",
        description: "Failed to update tournament platform. Please try again.",
        variant: "destructive",
      })
      return
    }

    setShowPlatformChoice(false)
    setShowCopyLink(true)

    const effectiveUserId = (typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null) || user?.uid
    const effectiveUsername =
      (typeof window !== "undefined" ? localStorage.getItem("pwa_username") : null) || user?.username

    if (!effectiveUserId || !effectiveUsername) {
      console.error("[v0] No user ID or username available for PWA link", { effectiveUserId, effectiveUsername })
      toast({
        title: "Error",
        description: "User information missing. Please try again.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] 📋 Generating PWA link")
    console.log("[v0] Effective user ID:", effectiveUserId)
    console.log("[v0] Effective username:", effectiveUsername)

    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const pwaUrl = `${baseUrl}/arcade/link-pwa?uid=${effectiveUserId}&entryId=${currentEntryId}&gameId=${gameId}&username=${effectiveUsername}&tier=${selectedTier?.id}`

    console.log("[v0] ✅ Generated PWA URL:", pwaUrl)
    console.log("[v0] 🔍 URL contains entryId:", currentEntryId)
    console.log("[v0] 🔍 URL contains userId:", effectiveUserId)

    // Copy to clipboard
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(pwaUrl)
        .then(() => {
          console.log("[v0] Link copied to clipboard")
          toast({
            title: "Link Copied!",
            description: "Paste this link in your PWA to play",
          })
        })
        .catch((err) => {
          console.error("[v0] Failed to copy link:", err)
        })
    }

    setPWALinkUrl(pwaUrl)

    // Show PWA link modal after short delay
    setTimeout(() => {
      console.log("[v0] Showing PWA link modal")
      setShowPWALink(true)
    }, 200)
  }

  const handleResetPWALink = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pwa_user_id")
      localStorage.removeItem("pwa_username")
      console.log("[v0] 🔄 PWA link reset - removed pwa_user_id and pwa_username from localStorage")
      toast({
        title: "PWA Link Reset",
        description: "You can now copy a new link to re-connect your PWA app.",
      })
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading tournament...</p>
      </div>
    )
  }

  // Render error state
  if (hasError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-500">Error: {errorMessage}</p>
        <Button onClick={() => router.push("/arcade")}>Go to Arcade</Button>
      </div>
    )
  }

  // Render the main tournament page
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-black">
      <div className="container mx-auto px-4 py-8">
        {gameTheme && (
          <div
            className={`relative mb-8 rounded-2xl p-8 shadow-2xl bg-gradient-to-r ${gameTheme.headerBg} overflow-hidden border-4 border-white/20`}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <Link
                href="/arcade"
                className="flex items-center gap-2 text-xl font-bold text-white hover:text-yellow-300 transition-colors drop-shadow-lg"
              >
                <ArrowLeft size={24} className="drop-shadow-lg" />
                <span className="drop-shadow-lg">Back to Arcade</span>
              </Link>
              <h1 className="text-5xl md:text-6xl font-black text-center text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                {gameTheme.icon} {gameTheme.name}
              </h1>
              <Badge className="text-xl px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold border-2 border-yellow-300 shadow-2xl animate-pulse">
                {gameTheme.tagline}
              </Badge>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text drop-shadow-[0_0_20px_rgba(139,92,246,0.8)]">
            Choose Your Arena
          </h2>
          <p className="text-center text-xl text-cyan-300 mb-8 drop-shadow-lg">
            Select your skill level and compete for prizes
          </p>
        </div>

        <div className="grid gap-6 px-0 sm:grid-cols-1 md:grid-cols-2 max-w-full mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative overflow-hidden rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.6)] hover:scale-[1.03] transition-all duration-300 ease-in-out border-[12px] ${tier.border} animate-border-glow hover:shadow-[0_0_60px_rgba(168,85,247,0.8)]`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} animate-rolling-gradient opacity-95`} />

              {tier.isMega && (
                <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 px-4 py-2 rounded-bl-2xl shadow-xl animate-rolling-gradient-fast z-10">
                  <span className="text-black font-black text-lg drop-shadow-lg">MEGA</span>
                </div>
              )}
              <CardContent className="p-8 relative z-10">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-4 text-4xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                    <span className="text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] animate-float">
                      {tier.icon}
                    </span>
                    {tier.name}
                  </h2>
                  {tier.isMega ? (
                    <Badge className="bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 animate-rolling-gradient text-white text-2xl px-5 py-3 font-black shadow-2xl animate-pulse">
                      100 PLAYERS
                    </Badge>
                  ) : (
                    <Badge className="bg-black/50 backdrop-blur-sm text-white text-2xl px-5 py-3 font-black shadow-2xl border-4 border-white/60">
                      {tier.players} Players
                    </Badge>
                  )}
                </div>

                <div className="mb-6 bg-black/50 backdrop-blur-sm rounded-xl p-5 shadow-2xl border-4 border-white/40">
                  <p className="text-3xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    Entry: {tier.entry}π
                  </p>
                  {selectedTier && selectedTier.id === tier.id && (
                    <div className="mt-2">
                      <PiVolatilityDisclaimer variant="inline" />
                    </div>
                  )}
                  {/* </CHANGE> */}
                </div>

                <div className="bg-black/50 backdrop-blur-sm rounded-xl p-5 border-4 border-white/40 shadow-2xl">
                  <h3 className="mb-4 font-black text-2xl text-yellow-300 drop-shadow-[0_2px_10px_rgba(250,204,21,0.8)]">
                    Prize Pool:
                  </h3>
                  <ul className="space-y-3">
                    {Object.entries(tier.payouts).map(([rank, amount]) => (
                      <li key={rank} className="flex justify-between text-xl font-black text-white">
                        <span className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                          {rank === "1" && "🥇"}
                          {rank === "2" && "🥈"}
                          {rank === "3" && "🥉"}
                          {rank !== "1" && rank !== "2" && rank !== "3" && "🏅"} {rank}
                          {getRankSuffix(rank)} Place
                        </span>
                        <span className="text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.9)]">{amount}π</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="relative z-10 p-6">
                {isPWA && gameId?.startsWith("trivia") ? (
                  <Button
                    onClick={() => {
                      setSelectedTier(tier)
                      handlePaymentMethodSelect("balance")
                    }}
                    size="lg"
                    className="w-full font-black text-2xl py-8 transition-all duration-300 ease-in-out hover:ring-8 hover:ring-white/60 bg-white/25 backdrop-blur-sm hover:bg-white/40 text-white shadow-[0_0_25px_rgba(255,255,255,0.4)] border-4 border-white/60 hover:scale-105"
                    disabled={loadingBalance || userBalance === undefined || userBalance < tier.entry}
                  >
                    <Coins className="w-6 h-6 mr-2" />
                    {loadingBalance
                      ? "Loading Balance..."
                      : userBalance !== undefined && userBalance >= tier.entry
                        ? `Pay ${tier.entry}π with Balance`
                        : "Insufficient Balance"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleEnterTournament(tier)}
                    size="lg"
                    className="w-full font-black text-2xl py-8 transition-all duration-300 ease-in-out hover:ring-8 hover:ring-white/60 bg-white/25 backdrop-blur-sm hover:bg-white/40 text-white shadow-[0_0_25px_rgba(255,255,255,0.4)] border-4 border-white/60 hover:scale-105"
                  >
                    <Zap className="w-6 h-6 mr-2" />
                    {!isPWA && !user ? "Connect Wallet" : "Enter Arena!"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
        {/* End of Updates Section */}

        {/* Removed original Tiers mapping here as it's now in the Updates Section */}
      </div>

      {/* Payment Method Selection Modal */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h2 className="mb-4 text-center text-2xl font-bold">Choose Payment Method</h2>

              {userBalance !== undefined && (
                <div className="mb-6 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-center">
                  <p className="text-sm font-medium text-white/80">Your Balance</p>
                  <p className="text-3xl font-bold text-white">{userBalance.toFixed(2)} π</p>
                  {selectedTier && userBalance < selectedTier.entry && (
                    <p className="mt-2 text-xs text-white/70">Insufficient funds for this tier</p>
                  )}
                </div>
              )}
              {loadingBalance && (
                <div className="mb-6 rounded-lg bg-gray-100 p-4 text-center">
                  <p className="text-sm text-gray-600">Loading balance...</p>
                </div>
              )}

              <div className="space-y-4">
                <Button
                  onClick={() => handlePaymentMethodSelect("balance")}
                  variant="outline"
                  className="w-full justify-center gap-2"
                  disabled={balanceProcessing || userBalance === undefined || userBalance < (selectedTier?.entry || 0)}
                >
                  {balanceProcessing ? "Processing..." : "Pay with Pi Balance"}
                  {balanceProcessing ? <Zap size={16} className="animate-pulse" /> : <Coins size={16} />}
                </Button>

                {!isPWA && (
                  <Button
                    onClick={() => {
                      handlePayment("pi")
                    }}
                    variant="default"
                    className="w-full justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                    disabled={piWalletLoading}
                  >
                    {piWalletLoading ? "Connecting..." : "Pay with Pi Wallet"}
                    <Zap size={16} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Balance Confirmation Modal */}
      {showBalanceConfirmation && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h2 className="mb-4 text-center text-2xl font-bold">Confirm Balance Payment</h2>
              <p className="text-center">
                Are you sure you want to pay <span className="font-bold">{selectedTier.entry} π</span> using your
                balance for the {selectedTier.name} tournament?
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Button onClick={() => setShowBalanceConfirmation(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleConfirmBalancePayment} disabled={balanceProcessing}>
                  {balanceProcessing ? "Processing..." : "Confirm Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Choice Modal */}
      {showPlatformChoice && currentEntryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h2 className="mb-4 text-center text-2xl font-bold">How do you want to play?</h2>

              {typeof window !== "undefined" && localStorage.getItem("pwa_user_id") && (
                <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <p className="text-sm text-green-400 text-center font-medium">✓ PWA Already Linked</p>
                  <p className="text-xs text-gray-400 text-center mt-1">Your game will automatically appear in PWA</p>
                </div>
              )}

              <div className="space-y-4">
                <Button onClick={handlePlayInPiBrowser} className="w-full justify-center gap-2">
                  Play in Pi Browser
                </Button>
                {!isPWA && (
                  <Button
                    onClick={handlePlayOnPWA}
                    className="w-full justify-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    Play on PWA
                  </Button>
                )}

                {!isPWA && typeof window !== "undefined" && localStorage.getItem("pwa_user_id") && (
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2 text-center">
                      Reinstalled your PWA app? Reset the link to reconnect:
                    </p>
                    <Button
                      onClick={handleResetPWALink}
                      variant="outline"
                      className="w-full justify-center gap-2 text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent"
                    >
                      Reset PWA Link
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showPWALink && pwaLinkUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="mb-4 text-center text-2xl font-bold">Link Your PWA Account</h2>
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  To play this tournament on PWA, copy this link and open it in your PWA app:
                </p>
                <div className="rounded-lg bg-muted p-3">
                  <p className="break-all text-xs">{pwaLinkUrl}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Link copied to clipboard
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  1. Open your PWA app
                  <br />
                  2. Paste this link in the browser
                  <br />
                  3. Your tournament entry will be linked
                </p>
                <Button
                  onClick={() => {
                    setShowPWALink(false)
                    router.push("/arcade")
                  }}
                  className="w-full"
                >
                  Return to Arcade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Copy Link Modal - Shown after clicking "Play on PWA" */}
      {showCopyLink &&
        pwaLinkUrl && ( // Ensure pwaLinkUrl is defined
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <h2 className="mb-4 text-center text-2xl font-bold">Copy Your PWA Link</h2>
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Copy the link below and paste it into your PWA browser to link your tournament entry.
                  </p>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="break-all text-xs">{pwaLinkUrl}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Link copied to clipboard
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Open this link in your PWA app to start playing.
                  </p>
                  <Button
                    onClick={() => {
                      setShowCopyLink(false)
                      router.push("/arcade") // Navigate back to arcade after closing
                    }}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  )
}

export default TournamentPageClient
