"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MatchDetailsModalProps {
  matchId: string | null
  isOpen: boolean
  onClose: () => void
}

export function MatchDetailsModal({ matchId, isOpen, onClose }: MatchDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [matchData, setMatchData] = useState<any>(null)

  useEffect(() => {
    if (matchId && isOpen) {
      loadMatchDetails()
    }
  }, [matchId, isOpen])

  async function loadMatchDetails() {
    setLoading(true)
    try {
      const response = await fetch(`/api/arcade/tournament/match-details?matchId=${matchId}`)
      const data = await response.json()
      setMatchData(data)
    } catch (error) {
      console.error("[v0] Error loading match details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!matchData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-950 via-black to-cyan-950 border-2 border-cyan-500">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-cyan-400">Loading Match Details...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const { match, participants } = matchData
  const topThree = participants.slice(0, 3)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-950 via-black to-cyan-950 border-2 border-cyan-500">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Tournament Results
          </DialogTitle>
        </DialogHeader>

        {/* Match Info */}
        <div className="bg-black/40 rounded-lg p-4 border border-cyan-500/30 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Game</p>
              <p className="text-lg font-bold text-white">{match.game_id.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tier</p>
              <Badge className="bg-purple-600">{match.tier_id}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-400">Prize Pool</p>
              <p className="text-lg font-bold text-yellow-400">{match.prize_pool}π</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Completed</p>
              <p className="text-sm text-gray-300">{new Date(match.completed_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performers
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {topThree.map((participant, index) => {
              const icons = [
                <Trophy key="1" className="h-8 w-8 text-yellow-400" />,
                <Medal key="2" className="h-8 w-8 text-gray-400" />,
                <Award key="3" className="h-8 w-8 text-orange-600" />,
              ]
              const bgColors = [
                "from-yellow-900/50 to-yellow-700/30 border-yellow-500",
                "from-gray-700/50 to-gray-600/30 border-gray-400",
                "from-orange-900/50 to-orange-700/30 border-orange-600",
              ]

              return (
                <div
                  key={participant.id}
                  className={`p-4 rounded-lg bg-gradient-to-br ${bgColors[index]} border-2 text-center`}
                >
                  <div className="flex justify-center mb-2">{icons[index]}</div>
                  <p className="text-sm text-gray-400">#{participant.position}</p>
                  <div className="flex items-center justify-center gap-2 my-2">
                    {participant.arcade_users?.avatar_url ? (
                      <img
                        src={participant.arcade_users.avatar_url || "/placeholder.svg"}
                        alt={participant.arcade_users.username}
                        className="w-10 h-10 rounded-full border-2 border-white"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold">
                        {participant.arcade_users?.username?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-white truncate">{participant.arcade_users?.username || "Unknown"}</p>
                  <p className="text-2xl font-bold text-cyan-400 my-2">{participant.final_score}</p>
                  {participant.payout > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-sm text-gray-300">Prize</p>
                      <p className="text-xl font-bold text-yellow-400">+{participant.payout}π</p>
                      <Badge
                        className={
                          participant.payoutStatus === "completed" ? "bg-green-600 mt-1" : "bg-orange-600 mt-1"
                        }
                      >
                        {participant.payoutStatus === "completed" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Full Leaderboard */}
        <div>
          <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Full Leaderboard
          </h3>
          <div className="space-y-2">
            {participants.map((participant: any) => (
              <div
                key={participant.id}
                className={`p-3 rounded-lg flex items-center justify-between ${
                  participant.position <= 3
                    ? "bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border border-cyan-500/50"
                    : "bg-black/40 border border-gray-700/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      participant.position === 1
                        ? "bg-yellow-500 text-black"
                        : participant.position === 2
                          ? "bg-gray-400 text-black"
                          : participant.position === 3
                            ? "bg-orange-600 text-white"
                            : "bg-gray-700 text-white"
                    }`}
                  >
                    #{participant.position}
                  </div>
                  {participant.arcade_users?.avatar_url ? (
                    <img
                      src={participant.arcade_users.avatar_url || "/placeholder.svg"}
                      alt={participant.arcade_users.username}
                      className="w-10 h-10 rounded-full border-2 border-cyan-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold">
                      {participant.arcade_users?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-white">{participant.arcade_users?.username || "Unknown Player"}</p>
                    <p className="text-sm text-gray-400">Score: {participant.final_score}</p>
                  </div>
                </div>
                <div className="text-right">
                  {participant.rating_change && (
                    <p className={`text-sm ${participant.rating_change > 0 ? "text-green-400" : "text-red-400"}`}>
                      {participant.rating_change > 0 ? "+" : ""}
                      {participant.rating_change} ELO
                    </p>
                  )}
                  {participant.payout > 0 && (
                    <p className="text-lg font-bold text-yellow-400">+{participant.payout}π</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-500">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
