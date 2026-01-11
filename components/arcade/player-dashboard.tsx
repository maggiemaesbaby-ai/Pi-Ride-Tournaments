"use client"

import type React from "react"

import { useState } from "react"
import useSWR from "swr"
import { Upload, Edit2, Trophy, TrendingUp, Gamepad2, Clock, Target, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getRankTitle, getRankColor } from "@/lib/elo-rating"
import { MatchDetailsModal } from "./match-details-modal"

interface PlayerDashboardProps {
  user: any
  onUpdate: () => void
}

export function PlayerDashboard({ user, onUpdate }: PlayerDashboardProps) {
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(user.username)
  const [uploading, setUploading] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetcher = (url: string) => fetch(url).then((res) => res.json())
  const { data, error, mutate } = useSWR(`/api/arcade/player-stats?userId=${user.id}`, fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds
    revalidateOnFocus: true, // Refresh when window gains focus
    revalidateOnReconnect: true, // Refresh when internet reconnects
  })

  const playerStats = data?.playerStats
  const gameRatings = data?.gameRatings || []
  const recentMatches = data?.recentMatches || []
  const activeTournaments = data?.activeTournaments || []

  console.log("[v0] Player Dashboard - Active tournaments:", activeTournaments.length)

  async function handleUpdateUsername() {
    try {
      const response = await fetch("/api/arcade/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username }),
      })

      if (!response.ok) {
        alert("Username already taken or invalid")
        return
      }

      setEditing(false)
      onUpdate()
      mutate()
    } catch (error) {
      console.error("[v0] Username update error:", error)
    }
  }

  async function handleUploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", user.id)

      const response = await fetch("/api/arcade/upload-avatar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        onUpdate()
        mutate()
      }
    } catch (err) {
      console.error("[v0] Upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  function handleMatchClick(matchId: string) {
    setSelectedMatchId(matchId)
    setIsModalOpen(true)
  }

  const rankTitle = playerStats ? getRankTitle(playerStats.overall_rating) : "Beginner"
  const rankColor = playerStats ? getRankColor(playerStats.overall_rating) : "text-gray-500"

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card className="p-6 bg-black/40 border-cyan-500/30">
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-cyan-500 overflow-hidden bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url || "/placeholder.svg"}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">{user.username[0].toUpperCase()}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-cyan-500 hover:bg-cyan-400 rounded-full p-2 cursor-pointer transition-colors">
              <Upload className="h-4 w-4 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadAvatar}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-black/60 border-cyan-500 text-white max-w-xs"
                  />
                  <Button onClick={handleUpdateUsername} size="sm" className="bg-cyan-600 hover:bg-cyan-500">
                    Save
                  </Button>
                  <Button onClick={() => setEditing(false)} size="sm" variant="outline">
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-cyan-400">{user.username}</h3>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(true)} className="hover:bg-cyan-500/20">
                    <Edit2 className="h-4 w-4 text-cyan-400" />
                  </Button>
                </>
              )}
            </div>
            {playerStats && (
              <div className="flex items-center gap-3 mb-2">
                <Award className={`h-5 w-5 ${rankColor}`} />
                <span className={`text-lg font-bold ${rankColor}`}>{rankTitle}</span>
                <Badge className="bg-gradient-to-r from-purple-600 to-cyan-600">{playerStats.overall_rating} ELO</Badge>
              </div>
            )}
            <p className="text-sm text-gray-400 font-mono">
              {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
            </p>
          </div>
        </div>
      </Card>

      {/* Active Tournaments Section */}
      {activeTournaments.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-6 w-6 text-yellow-400 animate-pulse" />
            <h4 className="text-xl font-bold text-yellow-400">Active Tournaments</h4>
          </div>
          <div className="space-y-3">
            {activeTournaments.map((tournament: any) => (
              <div key={tournament.id} className="p-4 rounded-lg bg-black/40 border-2 border-yellow-500/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-cyan-400" />
                    <div>
                      <p className="font-bold text-white text-lg">{tournament.game_id.toUpperCase()}</p>
                      <p className="text-sm text-gray-400">{tournament.tier} tier</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      tournament.status === "waiting"
                        ? "bg-orange-600 text-white"
                        : "bg-green-600 text-white animate-pulse"
                    }
                  >
                    {tournament.status === "waiting" ? "⏳ Awaiting Players" : "🎮 In Progress"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                  <div className="bg-purple-900/30 rounded p-2 text-center">
                    <p className="text-gray-400 text-xs">Entry</p>
                    <p className="text-white font-bold">{tournament.entry_fee}π</p>
                  </div>
                  <div className="bg-yellow-900/30 rounded p-2 text-center">
                    <p className="text-gray-400 text-xs">Prize Pool</p>
                    <p className="text-yellow-400 font-bold">{tournament.prize_pool}π</p>
                  </div>
                  <div className="bg-cyan-900/30 rounded p-2 text-center">
                    <p className="text-gray-400 text-xs">Your Score</p>
                    <p className="text-cyan-400 font-bold">{tournament.score || "—"}</p>
                  </div>
                </div>
                {tournament.status === "waiting" && (
                  <p className="text-xs text-yellow-300 mt-3 text-center">
                    ⚡ Match starts when {tournament.max_players} players join
                  </p>
                )}
                <Button
                  onClick={() => {
                    console.log("[v0] 🎮 Play Now clicked for tournament:", tournament)
                    // Store entry in localStorage for game page verification
                    localStorage.setItem(
                      "pwa_tournament_entry",
                      JSON.stringify({
                        entryId: tournament.id,
                        gameId: tournament.game_id,
                        tierId: tournament.tier_id || tournament.tier,
                        tier: tournament.tier,
                        entryFee: tournament.entry_fee,
                        played: false,
                      }),
                    )
                    // Navigate to game
                    window.location.href = `/arcade/game/${tournament.game_id}?pwa=true`
                  }}
                  className="w-full mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold"
                >
                  🎮 Play Now
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats Section */}
      {playerStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-purple-900/50 to-black/50 border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-gray-400">Total Games</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">{playerStats.games_played}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-900/50 to-black/50 border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-400">Wins</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{playerStats.wins}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-cyan-900/50 to-black/50 border-cyan-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              <span className="text-sm text-gray-400">Win Rate</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">
              {playerStats.games_played > 0 ? Math.round((playerStats.wins / playerStats.games_played) * 100) : 0}%
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-yellow-900/50 to-black/50 border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Award className={`h-5 w-5 ${rankColor}`} />
              <span className="text-sm text-gray-400">Rating</span>
            </div>
            <p className={`text-3xl font-bold ${rankColor}`}>{playerStats.overall_rating}</p>
          </Card>
        </div>
      )}

      {/* Game Ratings */}
      {gameRatings.length > 0 && (
        <Card className="p-6 bg-black/40 border-cyan-500/30">
          <h4 className="text-xl font-bold text-cyan-400 mb-4">Game Ratings</h4>
          <div className="grid md:grid-cols-2 gap-3">
            {gameRatings.map((game: any) => (
              <div
                key={game.game_id}
                className="p-3 rounded-lg bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-cyan-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white">{game.game_id.toUpperCase()}</p>
                  <Badge className={`${getRankColor(game.rating)}`}>{game.rating} ELO</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                  <div>
                    <p>Games</p>
                    <p className="text-white font-bold">{game.games_played}</p>
                  </div>
                  <div>
                    <p>Wins</p>
                    <p className="text-green-400 font-bold">{game.wins}</p>
                  </div>
                  <div>
                    <p>Best</p>
                    <p className="text-yellow-400 font-bold">{game.best_score}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Matches */}
      <Card className="p-6 bg-black/40 border-cyan-500/30">
        <h4 className="text-xl font-bold text-cyan-400 mb-4">Match History</h4>
        <div className="space-y-3">
          {recentMatches.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No matches played yet</p>
          ) : (
            recentMatches.map((match: any) => (
              <div
                key={match.tournament_id}
                onClick={() => handleMatchClick(match.tournament_id)}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-cyan-500/20 cursor-pointer hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
              >
                <div>
                  <p className="font-bold text-white">{match.game_id.toUpperCase()}</p>
                  <p className="text-sm text-gray-400">
                    {match.tier} • Rank #{match.position}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(match.completed_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-cyan-400">{match.score} pts</p>
                  {match.rating_change && (
                    <p className={`text-sm ${match.rating_change > 0 ? "text-green-400" : "text-red-400"}`}>
                      {match.rating_change > 0 ? "+" : ""}
                      {match.rating_change} ELO
                    </p>
                  )}
                  {match.payout > 0 && <p className="text-sm text-yellow-400">+{match.payout}π</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Match Details Modal */}
      <MatchDetailsModal matchId={selectedMatchId} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
