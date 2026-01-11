"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface Player {
  rank: number
  username: string
  score: number
  completionTime: number
  payout: number
  avatar?: string
}

interface MatchResultsProps {
  players: Player[]
  userRank: number | null
  onClose: () => void
}

export function MatchResults({ players, userRank, onClose }: MatchResultsProps) {
  const [showFireworks, setShowFireworks] = useState(true)
  const [isPWA, setIsPWA] = useState(false)
  const topThree = players.slice(0, 3)
  const restOfPlayers = players.slice(3)

  useEffect(() => {
    const timer = setTimeout(() => setShowFireworks(false), 5000)
    const checkPWA = window.matchMedia("(display-mode: standalone)").matches
    setIsPWA(checkPWA)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      {showFireworks && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: "1.5s",
              }}
            >
              <div className="text-4xl">{["🎆", "🎇", "✨", "💫", "⭐"][Math.floor(Math.random() * 5)]}</div>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-5xl w-full my-8 relative z-10">
        {!isPWA && (
          <Card className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400/50 p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📱</div>
              <div className="flex-1">
                <p className="text-cyan-400 font-bold text-lg mb-1">Enhanced PWA Experience</p>
                <p className="text-white/80 text-sm">
                  Play in landscape mode with seamless gameplay! Add Pi to your dashboard for the ultimate gaming
                  experience - no interruptions, just pure arcade action.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="text-center mb-8 animate-bounce">
          <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 mb-4">
            🎉 TOURNAMENT COMPLETE 🎉
          </h2>
          <p className="text-2xl text-cyan-400 animate-pulse">Winners Crowned!</p>
        </div>

        <div className="mb-12">
          <div className="flex items-end justify-center gap-6 mb-8">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="flex-1 max-w-xs transform hover:scale-105 transition-transform">
                <Card className="bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 border-4 border-gray-200 shadow-2xl shadow-gray-400/50">
                  <CardContent className="p-6 text-center">
                    <div className="relative mb-3">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gray-600 flex items-center justify-center text-4xl border-4 border-white shadow-lg overflow-hidden">
                        {topThree[1].avatar ? (
                          <img
                            src={topThree[1].avatar || "/placeholder.svg"}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          "👤"
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 text-6xl animate-spin-slow">🥈</div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 mb-2">{topThree[1].username}</p>
                    <div className="bg-white/30 rounded-lg p-3 mb-2">
                      <p className="text-4xl font-bold text-yellow-400 drop-shadow-lg">{topThree[1].payout}π</p>
                    </div>
                    <p className="text-lg text-gray-900 font-semibold">Score: {topThree[1].score}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 1st Place - Elevated */}
            {topThree[0] && (
              <div className="flex-1 max-w-sm transform scale-110 hover:scale-115 transition-transform">
                <div className="animate-pulse-slow">
                  <Card className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-4 border-yellow-200 shadow-2xl shadow-yellow-500/80">
                    <CardContent className="p-8 text-center">
                      <div className="relative mb-4">
                        <div className="w-32 h-32 mx-auto rounded-full bg-yellow-600 flex items-center justify-center text-5xl border-4 border-white shadow-2xl overflow-hidden">
                          {topThree[0].avatar ? (
                            <img
                              src={topThree[0].avatar || "/placeholder.svg"}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            "👤"
                          )}
                        </div>
                        <div className="absolute -top-4 -right-4 text-8xl animate-bounce">🏆</div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-3">{topThree[0].username}</p>
                      <div className="bg-white/40 rounded-lg p-4 mb-3">
                        <p className="text-6xl font-bold text-red-600 drop-shadow-2xl animate-pulse">
                          {topThree[0].payout}π
                        </p>
                      </div>
                      <p className="text-xl text-gray-900 font-semibold">Score: {topThree[0].score}</p>
                      <div className="mt-3 text-3xl">👑</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="flex-1 max-w-xs transform hover:scale-105 transition-transform">
                <Card className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 border-4 border-orange-300 shadow-2xl shadow-orange-400/50">
                  <CardContent className="p-6 text-center">
                    <div className="relative mb-3">
                      <div className="w-24 h-24 mx-auto rounded-full bg-orange-700 flex items-center justify-center text-4xl border-4 border-white shadow-lg overflow-hidden">
                        {topThree[2].avatar ? (
                          <img
                            src={topThree[2].avatar || "/placeholder.svg"}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          "👤"
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 text-6xl animate-spin-slow">🥉</div>
                    </div>
                    <p className="text-xl font-bold text-white mb-2">{topThree[2].username}</p>
                    <div className="bg-white/30 rounded-lg p-3 mb-2">
                      <p className="text-4xl font-bold text-yellow-200 drop-shadow-lg">{topThree[2].payout}π</p>
                    </div>
                    <p className="text-lg text-white font-semibold">Score: {topThree[2].score}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        <Card className="bg-gray-800/80 backdrop-blur-sm border-2 border-purple-500 mb-6">
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Final Standings</h3>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.rank}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    userRank === player.rank
                      ? "bg-cyan-900/70 border-2 border-cyan-400 shadow-lg shadow-cyan-500/50"
                      : "bg-gray-700/40"
                  } ${player.rank <= 3 ? "border-l-4 border-yellow-400" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-3xl font-bold ${
                        player.rank === 1
                          ? "text-yellow-400"
                          : player.rank === 2
                            ? "text-gray-300"
                            : player.rank === 3
                              ? "text-orange-400"
                              : "text-gray-400"
                      }`}
                    >
                      #{player.rank}
                    </span>
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-2xl overflow-hidden">
                      {player.avatar ? (
                        <img
                          src={player.avatar || "/placeholder.svg"}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <span className="text-lg font-semibold text-white">{player.username}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-cyan-400">{player.score} pts</p>
                    {player.payout > 0 && (
                      <p className="text-lg font-bold text-green-400 animate-pulse">+{player.payout}π</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={onClose}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xl px-8 py-6 shadow-lg"
          >
            🎮 Play Again
          </Button>
          <Link href="/arcade">
            <Button
              size="lg"
              variant="outline"
              className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black text-xl px-8 py-6 bg-transparent shadow-lg"
            >
              Back to Arcade
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
