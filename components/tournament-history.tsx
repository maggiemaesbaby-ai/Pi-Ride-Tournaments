"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Calendar, Target, Coins } from "@/lib/icons"
import { Skeleton } from "@/components/ui/skeleton"

interface TournamentEntry {
  id: string
  game_id: string
  tier_id: string
  tier_name: string
  entry_fee: number
  score: number
  rank: number | null
  payout: number
  status: string
  created_at: string
  completed_at: string | null
}

interface TournamentHistoryProps {
  userId: string
}

export function TournamentHistory({ userId }: TournamentHistoryProps) {
  const [entries, setEntries] = useState<TournamentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGames: 0,
    totalWinnings: 0,
    bestRank: null as number | null,
    avgScore: 0,
  })

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/arcade/tournament/history?userId=${userId}`)
        const data = await response.json()

        if (data.success) {
          setEntries(data.entries)
          setStats(data.stats)
        }
      } catch (error) {
        console.error("[v0] Failed to load tournament history:", error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [userId])

  const getRankBadge = (rank: number | null) => {
    if (!rank) return null
    if (rank === 1)
      return (
        <Badge className="bg-yellow-500 text-white">
          <Trophy className="w-3 h-3 mr-1" />
          1st Place
        </Badge>
      )
    if (rank === 2)
      return (
        <Badge className="bg-gray-400 text-white">
          <Medal className="w-3 h-3 mr-1" />
          2nd Place
        </Badge>
      )
    if (rank === 3)
      return (
        <Badge className="bg-amber-600 text-white">
          <Award className="w-3 h-3 mr-1" />
          3rd Place
        </Badge>
      )
    if (rank <= 5)
      return (
        <Badge variant="secondary">
          <Coins className="w-3 h-3 mr-1" />
          {rank}th Place
        </Badge>
      )
    return <Badge variant="outline">{rank}th Place</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Tournament Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Games</CardDescription>
              <CardTitle className="text-2xl">{stats.totalGames}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Winnings</CardDescription>
              <CardTitle className="text-2xl text-green-600">π {stats.totalWinnings.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Best Rank</CardDescription>
              <CardTitle className="text-2xl">
                {stats.bestRank ? (
                  <span className="flex items-center gap-1">
                    {stats.bestRank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                    {stats.bestRank}
                    {stats.bestRank === 1 ? "st" : stats.bestRank === 2 ? "nd" : stats.bestRank === 3 ? "rd" : "th"}
                  </span>
                ) : (
                  "-"
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Score</CardDescription>
              <CardTitle className="text-2xl">{stats.avgScore.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Tournament Entries */}
      {entries.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Tournament History</h3>
          <p className="text-muted-foreground mb-4">
            Play your first tournament in the Arcade to see your performance here!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Recent Tournaments</h3>
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      {entry.tier_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {entry.score.toLocaleString()} pts
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getRankBadge(entry.rank)}
                    {entry.payout > 0 && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Coins className="w-3 h-3 mr-1" />
                        +π {entry.payout.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entry Fee:</span>
                    <span className="ml-2 font-medium">π {entry.entry_fee.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2 font-medium capitalize">{entry.status}</span>
                  </div>
                  {entry.rank && (
                    <div>
                      <span className="text-muted-foreground">Final Rank:</span>
                      <span className="ml-2 font-medium">
                        {entry.rank}
                        {entry.rank === 1 ? "st" : entry.rank === 2 ? "nd" : entry.rank === 3 ? "rd" : "th"}
                      </span>
                    </div>
                  )}
                  {entry.completed_at && (
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="ml-2 font-medium">{new Date(entry.completed_at).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
