"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Users, Coins } from "lucide-react"

interface TournamentTier {
  id: string
  name: string
  players: number
  entry: number
  payouts: Record<string, number>
  icon: string
  color: string
  border: string
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
  description: string
}

const TRIVIA_CATEGORIES: Record<string, Category> = {
  "general-knowledge": {
    id: "general-knowledge",
    name: "General Knowledge",
    icon: "🌍",
    color: "from-blue-500 to-cyan-600",
    description: "Test your knowledge across all topics",
  },
  science: {
    id: "science",
    name: "Science & Nature",
    icon: "🔬",
    color: "from-green-500 to-emerald-600",
    description: "Biology, Chemistry, Physics & more",
  },
  history: {
    id: "history",
    name: "History",
    icon: "📜",
    color: "from-amber-500 to-orange-600",
    description: "Ancient civilizations to modern times",
  },
  entertainment: {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎬",
    color: "from-purple-500 to-pink-600",
    description: "Movies, TV, Music & Pop Culture",
  },
  sports: {
    id: "sports",
    name: "Sports",
    icon: "⚽",
    color: "from-red-500 to-rose-600",
    description: "From football to Formula 1",
  },
  geography: {
    id: "geography",
    name: "Geography",
    icon: "🗺️",
    color: "from-teal-500 to-cyan-600",
    description: "Countries, capitals & landmarks",
  },
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
]

export default function TriviaArenasClient({ categoryId }: { categoryId: string }) {
  const router = useRouter()
  const category = TRIVIA_CATEGORIES[categoryId]

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={() => router.push("/arcade/trivia")}>Back to Categories</Button>
        </div>
      </div>
    )
  }

  const handleJoinArena = (tier: TournamentTier) => {
    console.log("[v0] Entering arena:", { tierId: tier.id, tierName: tier.name, categoryId })
    const url = `/arcade/tournaments/trivia/${tier.id}?categoryId=${categoryId}`
    console.log("[v0] Navigating to:", url)
    router.push(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.push("/arcade/trivia")}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-5xl">{category.icon}</span>
              <h1
                className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${category.color} bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]`}
              >
                {category.name}
              </h1>
            </div>
            <p className="text-gray-300 text-lg">{category.description}</p>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Choose Your Arena
        </h2>

        <div className="grid gap-6 px-0 sm:grid-cols-1 md:grid-cols-2 max-w-full mx-auto">
          {TOURNAMENT_TIERS.map((tier) => {
            const totalPayout = Object.values(tier.payouts).reduce((a, b) => a + b, 0)

            return (
              <Card
                key={tier.id}
                className={`relative overflow-hidden rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-[12px] ${tier.border} animate-border-glow hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_50px_rgba(168,85,247,0.6)]`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${tier.color} animate-rolling-gradient opacity-95`}
                />

                <CardContent className="p-8 relative z-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-6xl animate-float drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                          {tier.icon}
                        </span>
                        <div>
                          <h3 className="text-4xl font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
                            {tier.name}
                          </h3>
                          <div className="flex gap-2 mt-2">
                            <Badge
                              variant="secondary"
                              className="bg-black/50 backdrop-blur-sm text-white border-2 border-white/50 text-base py-1 px-3 font-bold"
                            >
                              <Users className="h-4 w-4 mr-1" />
                              {tier.players} Players
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="bg-black/50 backdrop-blur-sm text-white border-2 border-white/50 text-base py-1 px-3 font-bold"
                            >
                              <Coins className="h-4 w-4 mr-1" />
                              {tier.entry}π Entry
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/50 backdrop-blur-sm rounded-xl p-5 min-w-[220px] border-4 border-white/40 shadow-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="h-5 w-5 text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                        <span className="font-black text-white text-lg">Payouts</span>
                      </div>
                      <div className="space-y-2 text-base">
                        {Object.entries(tier.payouts).map(([place, amount]) => (
                          <div key={place} className="flex justify-between text-white font-bold">
                            <span>#{place}:</span>
                            <span className="font-black text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                              {amount}π
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleJoinArena(tier)}
                      size="lg"
                      className="bg-white/25 backdrop-blur-sm hover:bg-white/40 text-white font-black text-2xl py-7 px-10 min-w-[200px] border-4 border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 hover:ring-8 hover:ring-white/50 hover:scale-105"
                    >
                      Enter Arena
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="mt-8 bg-gradient-to-br from-purple-900/50 to-slate-900/50 border-purple-500/30">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">Tournament Rules</h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <h3 className="font-bold text-white mb-2">⏱️ Time Pressure</h3>
                <p className="text-sm">Answer quickly! Faster correct answers earn more points.</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">🎯 Accuracy Matters</h3>
                <p className="text-sm">Wrong answers cost you points. Think before you click!</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">🏆 Automatic Payouts</h3>
                <p className="text-sm">Winners receive Pi automatically when the tournament ends.</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">📊 Leaderboard</h3>
                <p className="text-sm">Track your ranking in real-time during the tournament.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
