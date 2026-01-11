"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trophy, Users, Coins, ArrowLeft } from "@/lib/icons"

const TOURNAMENT_TIERS = [
  {
    id: "bronze",
    name: "Arcade Rookie",
    tagline: "Start Your Legend",
    color: "from-orange-600 via-amber-700 to-orange-800",
    borderColor: "border-orange-500",
    entryFee: 1,
    prizePool: 3,
    games: [
      { id: "snake", name: "Snake", icon: "🐍" },
      { id: "tetris", name: "Tetris", icon: "🧱" },
      { id: "pong", name: "Pong", icon: "🏓" },
    ],
  },
  {
    id: "silver",
    name: "Pixel Power",
    tagline: "Rise Through The Ranks",
    color: "from-gray-400 via-gray-500 to-gray-600",
    borderColor: "border-gray-400",
    entryFee: 5,
    prizePool: 15,
    games: [
      { id: "breakout", name: "Breakout", icon: "⚡" },
      { id: "space-invaders", name: "Space Invaders", icon: "👾" },
      { id: "pacman", name: "Pac-Man", icon: "🟡" },
    ],
  },
  {
    id: "gold",
    name: "High Score Hunter",
    tagline: "Elite Competition",
    color: "from-yellow-500 via-yellow-600 to-amber-600",
    borderColor: "border-yellow-400",
    entryFee: 10,
    prizePool: 30,
    games: [
      { id: "asteroids", name: "Asteroids", icon: "🌑" },
      { id: "galaga", name: "Galaga", icon: "🚀" },
      { id: "donkey-kong", name: "Donkey Kong", icon: "🦍" },
    ],
  },
  {
    id: "platinum",
    name: "Arcade Royalty",
    tagline: "Champions Only",
    color: "from-cyan-400 via-blue-500 to-purple-600",
    borderColor: "border-cyan-300",
    entryFee: 25,
    prizePool: 75,
    games: [
      { id: "frogger", name: "Frogger", icon: "🐸" },
      { id: "street-fighter", name: "Street Fighter", icon: "🥊" },
    ],
  },
]

export default function TournamentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Link href="/arcade">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Arcade
          </Button>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Tournament Tiers
          </h1>
          <p className="text-xl text-gray-300">Choose your tier and dominate the leaderboards</p>
        </div>

        <div className="space-y-8">
          {TOURNAMENT_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={`border-4 ${tier.borderColor} bg-gradient-to-r ${tier.color} overflow-hidden hover:scale-[1.02] transition-all`}
            >
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <Badge className="mb-4 text-lg px-4 py-2 bg-white/20">{tier.id.toUpperCase()}</Badge>
                    <h2 className="text-4xl font-bold mb-2">{tier.name}</h2>
                    <p className="text-xl text-white/80 mb-6">{tier.tagline}</p>

                    <div className="bg-black/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm">Entry Fee</span>
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-yellow-300" />
                          <span className="text-2xl font-bold">{tier.entryFee}π</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">1st Place Prize</span>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-300" />
                          <span className="text-2xl font-bold text-yellow-300">{tier.prizePool}π</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Users className="w-4 h-4" />
                      <span>{tier.games.length} Games Available</span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-xl font-bold mb-4">Select Your Game</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tier.games.map((game) => (
                        <Link key={game.id} href={`/arcade/tournaments/${game.id}`}>
                          <Card className="bg-black/40 border-2 border-white/30 hover:border-white hover:bg-black/60 transition-all cursor-pointer h-full">
                            <CardContent className="p-6 text-center">
                              <div className="text-6xl mb-3">{game.icon}</div>
                              <h4 className="font-bold text-lg mb-2">{game.name}</h4>
                              <Button size="sm" className="w-full bg-green-500 hover:bg-green-400 text-white">
                                View Tournaments
                              </Button>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border-2 border-purple-500">
          <h2 className="text-3xl font-bold mb-6 text-center">How Tournaments Work</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-5xl mb-3">1️⃣</div>
              <h3 className="font-bold mb-2">Pick Your Tier</h3>
              <p className="text-sm text-gray-300">Choose based on entry fee and prize pool</p>
            </div>
            <div>
              <div className="text-5xl mb-3">2️⃣</div>
              <h3 className="font-bold mb-2">Select Game</h3>
              <p className="text-sm text-gray-300">Each tier has different classic arcade games</p>
            </div>
            <div>
              <div className="text-5xl mb-3">3️⃣</div>
              <h3 className="font-bold mb-2">Pay Entry Fee</h3>
              <p className="text-sm text-gray-300">Secure payment via Pi Network</p>
            </div>
            <div>
              <div className="text-5xl mb-3">4️⃣</div>
              <h3 className="font-bold mb-2">Win Pi!</h3>
              <p className="text-sm text-gray-300">Top 3 players get instant payouts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
