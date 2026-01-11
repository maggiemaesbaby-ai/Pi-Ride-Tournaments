"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Coins } from "@/lib/icons"

interface TournamentCardProps {
  arena: {
    id: string
    name: string
    entryFee: number
    maxPlayers: number
    payouts: { first: number; second: number; third: number }
    color: string
    icon: string
  }
  activePlayers: number
  onJoin: () => void
}

export function TournamentCard({ arena, activePlayers, onJoin }: TournamentCardProps) {
  const prizePool = arena.entryFee * arena.maxPlayers

  return (
    <Card className={`border-4 bg-gradient-to-br ${arena.color} hover:scale-[1.02] transition-all cursor-pointer`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="text-6xl">{arena.icon}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">{arena.name}</h3>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3 border border-white/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/80">Prize Pool</span>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span className="text-2xl font-bold text-yellow-200">{prizePool}π</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-yellow-500/30 rounded p-2 text-center border border-yellow-400">
                  <div className="text-lg mb-1">🥇</div>
                  <div className="font-bold">{arena.payouts.first}π</div>
                </div>
                <div className="bg-gray-400/30 rounded p-2 text-center border border-gray-300">
                  <div className="text-lg mb-1">🥈</div>
                  <div className="font-bold">{arena.payouts.second}π</div>
                </div>
                <div className="bg-orange-500/30 rounded p-2 text-center border border-orange-400">
                  <div className="text-lg mb-1">🥉</div>
                  <div className="font-bold">{arena.payouts.third > 0 ? `${arena.payouts.third}π` : "—"}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span className="text-white">
                  {activePlayers}/{arena.maxPlayers}
                </span>
              </div>
              <Badge className="bg-white/20 text-white">5 min</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 border border-white/40">
                <Coins className="w-5 h-5 text-green-300" />
                <span className="text-2xl font-bold text-white">{arena.entryFee}π</span>
              </div>
              <Button onClick={onJoin} className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold text-lg">
                PLAY
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
