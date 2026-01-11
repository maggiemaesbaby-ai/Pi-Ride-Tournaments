"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gift, TrendingUp, Star, Award } from 'lucide-react'
import { getUserRewards, getUserTier, getTotalRewardsEarned, calculateCashback } from "@/lib/pi-rewards"
import { useCurrency } from "@/contexts/currency-provider"

interface PiRewardsCardProps {
  userId: string
}

export function PiRewardsCard({ userId }: PiRewardsCardProps) {
  const [rewards, setRewards] = useState<any[]>([])
  const [tier, setTier] = useState<"bronze" | "silver" | "gold" | "platinum">("bronze")
  const [totalEarned, setTotalEarned] = useState(0)
  const { formatPriceWithUSD } = useCurrency()

  useEffect(() => {
    if (userId) {
      setRewards(getUserRewards(userId).slice(0, 5))
      setTier(getUserTier(userId))
      setTotalEarned(getTotalRewardsEarned(userId))
    }
  }, [userId])

  const tierColors = {
    bronze: "bg-orange-100 text-orange-800 border-orange-300",
    silver: "bg-gray-100 text-gray-800 border-gray-300",
    gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
    platinum: "bg-purple-100 text-purple-800 border-purple-300"
  }

  const tierIcons = {
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇",
    platinum: "💎"
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-bold">Pi Rewards</h3>
        </div>
        <Badge className={`${tierColors[tier]} border-2`}>
          <span className="mr-1">{tierIcons[tier]}</span>
          {tier.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-white rounded-lg border border-purple-200">
          <p className="text-xs text-slate-600 mb-1">Total Earned</p>
          <p className="text-xl font-bold text-purple-600">{formatPriceWithUSD(totalEarned).pi}</p>
        </div>
        <div className="p-3 bg-white rounded-lg border border-purple-200">
          <p className="text-xs text-slate-600 mb-1">Cashback Rate</p>
          <p className="text-xl font-bold text-purple-600">{(calculateCashback(100, tier) / 100) * 100}%</p>
        </div>
      </div>

      {rewards.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 mb-2">Recent Rewards</p>
          {rewards.map((reward) => (
            <div key={reward.id} className="flex items-center justify-between p-2 bg-white rounded border border-purple-100">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-slate-700">{reward.description}</span>
              </div>
              <span className="text-sm font-bold text-purple-600">+{formatPriceWithUSD(reward.amount).pi}</span>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" className="w-full mt-4">
        <TrendingUp className="w-4 h-4 mr-2" />
        View All Rewards
      </Button>
    </Card>
  )
}
