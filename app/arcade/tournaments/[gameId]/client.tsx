"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import React from "react"

console.log("[v0] ============ TOURNAMENT PAGE MODULE LOADED ============")

const PENDING_PAYMENT_KEY = "pi_tournament_pending_payment"

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
    color: "from-green-400 to-green-600",
    border: "border-green-300",
  },
  {
    id: "tier-1",
    name: "Rookie Arena",
    players: 7,
    entry: 1.0,
    payouts: { 1: 3.0, 2: 2.0, 3: 1.0 },
    icon: "🥉",
    color: "from-orange-400 to-red-500",
    border: "border-orange-400",
  },
  {
    id: "tier-2",
    name: "Silver Circuit",
    players: 7,
    entry: 5.0,
    payouts: { 1: 15.0, 2: 10.0, 3: 5.0 },
    icon: "🥈",
    color: "from-gray-400 to-gray-600",
    border: "border-gray-300",
  },
  {
    id: "tier-3",
    name: "Gold Championship",
    players: 7,
    entry: 10.0,
    payouts: { 1: 30.0, 2: 20.0, 3: 10.0, 4: 3.0, 5: 2.0 },
    icon: "🥇",
    color: "from-yellow-400 to-yellow-600",
    border: "border-yellow-300",
  },
  {
    id: "tier-4",
    name: "Elite Masters",
    players: 5,
    entry: 15.0,
    payouts: { 1: 30.0, 2: 20.0, 3: 15.0, 4: 5.0 },
    icon: "💎",
    color: "from-blue-400 to-blue-600",
    border: "border-blue-300",
  },
  {
    id: "tier-5",
    name: "Champion's Duel",
    players: 3,
    entry: 20.0,
    payouts: { 1: 45.0, 2: 10.0 },
    icon: "👑",
    color: "from-pink-400 to-purple-600",
    border: "border-pink-300",
  },
  {
    id: "tier-6",
    name: "MEGA TOURNAMENT",
    players: 100,
    entry: 1.0,
    payouts: { 1: 50.0, 2: 20.0, 3: 10.0, 4: 2.0, 5: 2.0, 6: 2.0, 7: 2.0, 8: 2.0, 9: 2.0, 10: 2.0 },
    icon: "🏆",
    color: "from-orange-400 to-red-600",
    border: "border-orange-400",
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

const APP_WALLET = "GP4C3UXKJRQKX7Y5FQQVQ6TZ6VHBBTCXW776QCXLRQKDMXZC3Q7KUGQJ"

export default function TournamentPageClient({ gameId }: { gameId: string }) {
  React.useEffect(() => {
    console.log("[v0] ============ Tournament CLIENT component mounted ============", gameId)
    if (typeof window !== "undefined") {
      console.log("[v0] localStorage pwa_user_id:", localStorage.getItem("pwa_user_id"))
      console.log("[v0] localStorage pwa_tournament_entry:", localStorage.getItem("pwa_tournament_entry"))
    }
  }, [gameId])

  console.log("[v0] ============ Tournament page rendering ============", gameId)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [gameTheme, setGameTheme] = useState<GameTheme | null>(null)
  const [tiers] = useState<TournamentTier[]>(TOURNAMENT_TIERS)
  const [activeEntries, setActiveEntries] = useState<
    Record<string, { entryId: string; matchNumber: number; matchId: string }>
  >({})
  const [loading, setLoading] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [pwaUserId, setPwaUserId] = useState<string | null>(null)
  const { user, connect } = usePiWallet()
  const { toast } = useToast()
  const [selectedTier, setSelectedTier] = useState<(typeof TOURNAMENT_TIERS)[number] | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPlatformChoice, setShowPlatformChoice] = useState(false)
  const [showPWALink, setShowPWALink] = useState(false)
  const [pwaLinkUrl, setPwaLinkUrl] = useState("")
  const [userBalance, setUserBalance] = useState(0)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [showBalanceConfirmation, setShowBalanceConfirmation] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"balance" | "pi">("pi")
  const [balanceProcessing, setBalanceProcessing] = useState(false)

  // ... rest of code here ...
}
